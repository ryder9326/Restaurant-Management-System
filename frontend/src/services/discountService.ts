import {
  ApiResponse,
  DiscountCode,
  DiscountStatus,
  DiscountType,
} from '../types';
import { DiscountValidationResult, evaluateDiscountCode } from '../utils';
import { apiRequest, createApiResponse } from './apiConfig';

interface BackendGiamGiaDTO {
  maGiamGia: string;
  giaTriUuDai: number;
  dieuKienApDung?: string | null;
  thoiHan: string;
}

const idToCodeMap = new Map<number, string>();
const codeToIdMap = new Map<string, number>();
let cachedDiscounts: DiscountCode[] = [];

function getOrAssignDiscountId(code: string): number {
  const existing = codeToIdMap.get(code);
  if (existing !== undefined) return existing;

  let hash = 7000;
  for (let i = 0; i < code.length; i += 1) {
    hash = (hash * 31 + code.charCodeAt(i)) % 100_000;
  }
  let candidate = hash || 7000;
  while (idToCodeMap.has(candidate)) {
    candidate += 1;
  }

  codeToIdMap.set(code, candidate);
  idToCodeMap.set(candidate, code);
  return candidate;
}

function parseMinOrderFromCondition(condition?: string | null): number {
  if (!condition) return 0;
  const digitsOnly = condition.replace(/[^0-9]/g, '');
  if (!digitsOnly) return 0;
  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mapBackendToDiscountCode(dto: BackendGiamGiaDTO): DiscountCode {
  const amount = Math.round(Number(dto.giaTriUuDai) || 0);
  const minOrderVnd = parseMinOrderFromCondition(dto.dieuKienApDung);
  const validTo = (dto.thoiHan || '').slice(0, 10) || '2027-12-31';
  const expired = new Date(dto.thoiHan).getTime() < Date.now();

  return {
    id: getOrAssignDiscountId(dto.maGiamGia),
    code: dto.maGiamGia,
    title: `Giảm ${amount.toLocaleString('vi-VN')} ₫`,
    description:
      dto.dieuKienApDung?.trim() ||
      (minOrderVnd > 0
        ? `Áp dụng cho hóa đơn từ ${minOrderVnd.toLocaleString('vi-VN')} ₫`
        : 'Áp dụng cho mọi hóa đơn thanh toán'),
    type: DiscountType.FIXED_AMOUNT,
    value: amount,
    minOrderVnd,
    maxDiscountVnd: amount,
    usageLimit: 1000,
    usedCount: 0,
    validFrom: '2025-01-01',
    validTo,
    status: expired ? DiscountStatus.EXPIRED : DiscountStatus.ACTIVE,
  };
}

/**
 * GET /api/v1/billing/discounts/active
 */
export async function getDiscountCodes(): Promise<ApiResponse<DiscountCode[]>> {
  const res = await apiRequest<BackendGiamGiaDTO[]>('/billing/discounts/active', {
    method: 'GET',
  });

  const mapped = (res.data || []).map(mapBackendToDiscountCode);
  cachedDiscounts = mapped;

  return {
    ...res,
    data: mapped,
  };
}

/**
 * POST /api/v1/billing/discounts
 */
export async function createDiscountCode(payload: {
  code: string;
  amountVnd: number;
  condition?: string;
  validToIso: string;
}): Promise<ApiResponse<DiscountCode>> {
  const thoiHan = payload.validToIso.includes('T')
    ? payload.validToIso
    : `${payload.validToIso}T23:59:59`;

  const res = await apiRequest<BackendGiamGiaDTO>('/billing/discounts', {
    method: 'POST',
    body: {
      maGiamGia: payload.code.trim().toUpperCase(),
      giaTriUuDai: Math.round(payload.amountVnd),
      dieuKienApDung: payload.condition?.trim() || '',
      thoiHan,
    },
  });

  const created = mapBackendToDiscountCode(res.data);
  cachedDiscounts = [created, ...cachedDiscounts.filter((d) => d.code !== created.code)];

  return {
    ...res,
    data: created,
  };
}

/**
 * Kiểm tra điều kiện áp dụng mã giảm giá theo danh sách mã thật từ MySQL.
 */
export async function validateDiscountCode(
  code: string,
  subtotalVnd: number
): Promise<ApiResponse<DiscountValidationResult>> {
  if (cachedDiscounts.length === 0) {
    try {
      await getDiscountCodes();
    } catch {
      // Giữ mảng rỗng nếu không tải được
    }
  }

  const normalized = code.trim().toUpperCase();
  const found = cachedDiscounts.find(
    (item) => item.code.toUpperCase() === normalized
  );

  if (!found) {
    return createApiResponse(
      {
        valid: false,
        reason: 'Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng.',
        discountAmountVnd: 0,
      },
      'Mã không hợp lệ'
    );
  }

  const result = evaluateDiscountCode(found, subtotalVnd, getTodayIso());
  return createApiResponse(
    result,
    result.valid ? 'Áp dụng mã thành công' : result.reason
  );
}