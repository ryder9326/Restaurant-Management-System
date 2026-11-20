import { useMemo } from 'react';
import { formatVnd } from '../../utils';

interface VietQrBoxProps {
  orderCode: string;
  amountVnd: number;
  channelLabel: string;
}

/**
 * Tạo ma trận QR 21x21 ổn định theo mã đơn hàng và số tiền (không phụ thuộc URL ảnh ngoài).
 */
function buildDeterministicQrMatrix(seedText: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  function drawFinder(top: number, left: number) {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[top + r][left + c] = isBorder || isCenter;
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0;
        continue;
      }

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = ((hash >>> 0) % 10) < 5;
    }
  }

  return grid;
}

export function VietQrBox({
  orderCode,
  amountVnd,
  channelLabel,
}: VietQrBoxProps) {
  const matrix = useMemo(
    () => buildDeterministicQrMatrix(`BEPVIET|${orderCode}|${amountVnd}`),
    [orderCode, amountVnd]
  );

  const transferNote = `BEPVIET ${orderCode.replace(/[^A-Z0-9]/gi, '')}`;

  return (
    <div className="rounded-xl border border-[#E6E2DC] bg-[#FAF9F7] p-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="shrink-0 rounded-lg border border-[#DCD7CE] bg-white p-2.5">
          <svg
            viewBox="0 0 21 21"
            className="h-32 w-32 text-[#1F1D1A]"
            role="img"
            aria-label={`Mã VietQR thanh toán đơn ${orderCode}`}
          >
            <rect width="21" height="21" fill="#FFFFFF" />
            {matrix.map((row, r) =>
              row.map((filled, c) =>
                filled ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c}
                    y={r}
                    width={1}
                    height={1}
                    fill="currentColor"
                  />
                ) : null
              )
            )}
          </svg>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9A3D18]">
            VietQR · {channelLabel}
          </p>
          <p className="text-sm font-semibold text-[#1F1D1A]">
            Vietcombank · 0071 0012 88990
          </p>
          <p className="text-xs text-[#5E5850]">
            Chủ TK: <span className="font-medium text-[#1F1D1A]">NHA HANG BEP VIET</span>
          </p>
          <p className="text-xs text-[#5E5850]">
            Nội dung:{' '}
            <span className="font-mono font-semibold text-[#1F1D1A]">
              {transferNote}
            </span>
          </p>
          <p className="pt-1 font-display text-base font-bold text-[#9A3D18] tabular-nums">
            {formatVnd(amountVnd)}
          </p>
        </div>
      </div>
    </div>
  );
}
