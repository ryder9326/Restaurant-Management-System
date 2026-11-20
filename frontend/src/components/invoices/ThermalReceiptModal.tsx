import { Printer } from 'lucide-react';
import { Invoice, OrderItem, OrderItemStatus, PaymentMethod } from '../../types';
import {
  formatDateTimeVi,
  formatVnd,
  PAYMENT_METHOD_LABELS,
} from '../../utils';
import { Modal } from '../common/Modal';

export interface ReceiptSnapshot {
  invoice: Invoice;
  items: OrderItem[];
  guestCount: number;
  cashReceivedVnd?: number;
  cashChangeVnd?: number;
}

interface ThermalReceiptModalProps {
  snapshot: ReceiptSnapshot | null;
  onClose: () => void;
}

export function ThermalReceiptModal({
  snapshot,
  onClose,
}: ThermalReceiptModalProps) {
  if (!snapshot) return null;

  const { invoice, items, guestCount, cashReceivedVnd, cashChangeVnd } =
    snapshot;
  const activeItems = items.filter(
    (item) => item.status !== OrderItemStatus.CANCELLED
  );

  function handlePrint() {
    window.print();
  }

  return (
    <Modal
      open={Boolean(snapshot)}
      title="Hóa đơn thanh toán (Khổ in nhiệt K80)"
      subtitle={`${invoice.tableName} đã tự động chuyển về trạng thái Trống.`}
      onClose={onClose}
      maxWidthClass="max-w-md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#DCD7CE] bg-white px-4 text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#F2EFEA] cursor-pointer whitespace-nowrap"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] cursor-pointer whitespace-nowrap"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>In hóa đơn (K80)</span>
          </button>
        </>
      }
    >
      <div className="flex justify-center">
        <div
          id="printable-thermal-receipt"
          className="w-full max-w-[320px] rounded-lg border border-dashed border-[#CBC4B9] bg-[#FFFDF9] px-5 py-5 text-[#1F1D1A] shadow-xs"
        >
          {/* Đầu trang hóa đơn */}
          <div className="text-center space-y-1 border-b border-dashed border-[#B8B0A4] pb-3">
            <p className="font-display text-base font-bold tracking-tight uppercase">
              NHÀ HÀNG BẾP VIỆT
            </p>
            <p className="text-[11px] text-[#5E5850]">
              128 Hai Bà Trưng, P. Bến Nghé, Quận 1, TP.HCM
            </p>
            <p className="text-[11px] text-[#5E5850]">
              Hotline: 028 3822 6868 · MST: 0316889912
            </p>
            <p className="pt-2 text-xs font-bold tracking-wider uppercase">
              HÓA ĐƠN THANH TOÁN
            </p>
          </div>

          {/* Thông tin chứng từ */}
          <dl className="grid grid-cols-2 gap-y-1 py-3 text-[11px] border-b border-dashed border-[#B8B0A4]">
            <dt className="text-[#6E675E]">Số hóa đơn:</dt>
            <dd className="text-right font-mono font-semibold">
              {invoice.invoiceCode}
            </dd>
            <dt className="text-[#6E675E]">Mã đơn hàng:</dt>
            <dd className="text-right font-mono">{invoice.orderCode}</dd>
            <dt className="text-[#6E675E]">Bàn phục vụ:</dt>
            <dd className="text-right font-semibold">
              {invoice.tableName} ({guestCount} khách)
            </dd>
            <dt className="text-[#6E675E]">Thu ngân:</dt>
            <dd className="text-right">{invoice.cashierName}</dd>
            <dt className="text-[#6E675E]">Thời gian:</dt>
            <dd className="text-right tabular-nums">
              {formatDateTimeVi(invoice.paidAt ?? invoice.issuedAt)}
            </dd>
          </dl>

          {/* Danh sách món */}
          <div className="py-3 border-b border-dashed border-[#B8B0A4]">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#DCD7CE] text-[#5E5850]">
                  <th scope="col" className="pb-1.5 text-left font-semibold">
                    Tên món
                  </th>
                  <th
                    scope="col"
                    className="pb-1.5 text-center font-semibold w-8"
                  >
                    SL
                  </th>
                  <th
                    scope="col"
                    className="pb-1.5 text-right font-semibold whitespace-nowrap"
                  >
                    T.Tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {activeItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1.5 pr-2 align-top">
                      <p className="font-medium leading-snug">
                        {item.menuItemName}
                      </p>
                      <p className="text-[10px] text-[#6E675E] tabular-nums">
                        {formatVnd(item.unitPriceVnd)}
                      </p>
                    </td>
                    <td className="py-1.5 text-center align-top tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 text-right align-top font-medium tabular-nums whitespace-nowrap">
                      {formatVnd(item.lineTotalVnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tổng hợp tiền */}
          <dl className="space-y-1.5 py-3 text-xs border-b border-dashed border-[#B8B0A4]">
            <div className="flex items-center justify-between">
              <dt className="text-[#5E5850]">Tạm tính</dt>
              <dd className="tabular-nums font-medium">
                {formatVnd(invoice.subtotalVnd)}
              </dd>
            </div>
            {invoice.discountAmountVnd > 0 && (
              <div className="flex items-center justify-between text-[#15803D]">
                <dt>
                  Giảm giá
                  {invoice.discountCode ? ` (${invoice.discountCode})` : ''}
                </dt>
                <dd className="tabular-nums font-medium">
                  -{formatVnd(invoice.discountAmountVnd)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-[#5E5850]">
                Thuế VAT ({Math.round(invoice.vatRate * 100)}%)
              </dt>
              <dd className="tabular-nums font-medium">
                {formatVnd(invoice.vatAmountVnd)}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#DCD7CE] text-sm font-bold">
              <dt>TỔNG THANH TOÁN</dt>
              <dd className="tabular-nums text-[#9A3D18]">
                {formatVnd(invoice.totalAmountVnd)}
              </dd>
            </div>
          </dl>

          {/* Chi tiết thanh toán */}
          <dl className="space-y-1 py-3 text-[11px] border-b border-dashed border-[#B8B0A4]">
            <div className="flex items-center justify-between">
              <dt className="text-[#6E675E]">Hình thức:</dt>
              <dd className="font-semibold">
                {invoice.paymentMethod
                  ? PAYMENT_METHOD_LABELS[invoice.paymentMethod]
                  : '—'}
              </dd>
            </div>
            {invoice.paymentMethod === PaymentMethod.CASH &&
              cashReceivedVnd !== undefined && (
                <>
                  <div className="flex items-center justify-between">
                    <dt className="text-[#6E675E]">Tiền khách đưa:</dt>
                    <dd className="tabular-nums font-medium">
                      {formatVnd(cashReceivedVnd)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-[#6E675E]">Tiền thừa trả khách:</dt>
                    <dd className="tabular-nums font-semibold">
                      {formatVnd(Math.max(0, cashChangeVnd ?? 0))}
                    </dd>
                  </div>
                </>
              )}
          </dl>

          {/* Chân hóa đơn */}
          <div className="pt-3 text-center space-y-1 text-[11px] text-[#5E5850]">
            <p className="font-medium text-[#1F1D1A]">
              Cảm ơn Quý khách đã dùng bữa tại Bếp Việt!
            </p>
            <p>Hẹn gặp lại Quý khách lần sau · Wifi: BepViet_Guest</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
