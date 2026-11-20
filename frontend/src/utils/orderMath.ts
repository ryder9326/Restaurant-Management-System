import { DiscountCode, DiscountStatus, DiscountType, OrderItem, OrderItemStatus } from '../types';

export interface InvoiceCalculationResult {
  subtotalVnd: number;
  discountAmountVnd: number;
  vatAmountVnd: number;
  totalAmountVnd: number;
}

export interface DiscountValidationResult {
  valid: boolean;
  reason?: string;
  discountAmountVnd: number;
}

/**
 * Tính tạm tính từ danh sách món (bỏ qua món đã hủy).
 */
export function calculateOrderSubtotal(items: Pick<OrderItem, 'quantity' | 'unitPriceVnd' | 'status'>[]): number {
  return items.reduce((sum, item) => {
    if (item.status === OrderItemStatus.CANCELLED) {
      return sum;
    }
    return sum + Math.max(0, item.quantity) * Math.max(0, item.unitPriceVnd);
  }, 0);
}

/**
 * Kiểm tra điều kiện áp dụng mã giảm giá và trả về số tiền được giảm bằng VNĐ.
 */
export function evaluateDiscountCode(
  discount: DiscountCode,
  subtotalVnd: number,
  referenceDateIso = '2026-11-20'
): DiscountValidationResult {
  if (discount.status !== DiscountStatus.ACTIVE) {
    return {
      valid: false,
      reason: 'Mã giảm giá hiện không còn hiệu lực.',
      discountAmountVnd: 0,
    };
  }

  if (discount.usedCount >= discount.usageLimit) {
    return {
      valid: false,
      reason: 'Mã giảm giá đã hết lượt sử dụng.',
      discountAmountVnd: 0,
    };
  }

  if (referenceDateIso < discount.validFrom || referenceDateIso > discount.validTo) {
    return {
      valid: false,
      reason: 'Mã giảm giá nằm ngoài thời gian áp dụng.',
      discountAmountVnd: 0,
    };
  }

  if (subtotalVnd < discount.minOrderVnd) {
    return {
      valid: false,
      reason: `Đơn hàng chưa đạt mức tối thiểu ${discount.minOrderVnd.toLocaleString('vi-VN')} ₫.`,
      discountAmountVnd: 0,
    };
  }

  let rawDiscount = 0;
  if (discount.type === DiscountType.PERCENTAGE) {
    rawDiscount = Math.round((subtotalVnd * discount.value) / 100);
    if (discount.maxDiscountVnd != null) {
      rawDiscount = Math.min(rawDiscount, discount.maxDiscountVnd);
    }
  } else {
    rawDiscount = discount.value;
  }

  const clampedDiscount = Math.min(rawDiscount, subtotalVnd);

  return {
    valid: true,
    discountAmountVnd: Math.max(0, clampedDiscount),
  };
}

/**
 * Tính tổng hóa đơn sau giảm giá và VAT (mặc định VAT 8% theo quy định hiện hành).
 */
export function calculateInvoiceTotals(
  subtotalVnd: number,
  discountAmountVnd = 0,
  vatRate = 0.08
): InvoiceCalculationResult {
  const safeSubtotal = Math.max(0, Math.round(subtotalVnd));
  const safeDiscount = Math.min(safeSubtotal, Math.max(0, Math.round(discountAmountVnd)));
  const taxableAmount = safeSubtotal - safeDiscount;
  const vatAmountVnd = Math.round(taxableAmount * Math.max(0, vatRate));
  const totalAmountVnd = taxableAmount + vatAmountVnd;

  return {
    subtotalVnd: safeSubtotal,
    discountAmountVnd: safeDiscount,
    vatAmountVnd,
    totalAmountVnd,
  };
}

/**
 * Tính tiền thừa khi thanh toán tiền mặt.
 * Trả về số âm nếu khách đưa chưa đủ tiền.
 */
export function calculateCashChange(
  cashReceivedVnd: number,
  totalDueVnd: number
): number {
  return Math.round(cashReceivedVnd) - Math.round(totalDueVnd);
}
