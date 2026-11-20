import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_DISCOUNT_CODES } from '../mocks';
import { OrderItemStatus } from '../types';
import {
  calculateCashChange,
  calculateInvoiceTotals,
  calculateOrderSubtotal,
  evaluateDiscountCode,
} from './orderMath';
import { formatDateTimeVi } from './formatters';

test('formatDateTimeVi preserves Asia/Ho_Chi_Minh local clock time', () => {
  const formatted = formatDateTimeVi('2026-11-20T11:25:00+07:00');
  assert.match(formatted, /11:25/);
  assert.match(formatted, /20\/11\/2026/);
});

test('calculateOrderSubtotal sums active items and ignores CANCELLED items', () => {
  const subtotal = calculateOrderSubtotal([
    { quantity: 2, unitPriceVnd: 65_000, status: OrderItemStatus.COMPLETED },
    { quantity: 1, unitPriceVnd: 165_000, status: OrderItemStatus.COOKING },
    { quantity: 3, unitPriceVnd: 100_000, status: OrderItemStatus.CANCELLED },
  ]);
  assert.equal(subtotal, 295_000);
});

test('evaluateDiscountCode enforces percentage cap, minimum order, and expired status', () => {
  const member10 = MOCK_DISCOUNT_CODES.find((d) => d.code === 'THANHVIEN10')!;
  const giam10 = MOCK_DISCOUNT_CODES.find((d) => d.code === 'GIAM10')!;
  const giam50k = MOCK_DISCOUNT_CODES.find((d) => d.code === 'GIAM50K')!;
  const expiredCode = MOCK_DISCOUNT_CODES.find((d) => d.code === 'KHAI_TRUONG15')!;

  const belowMin = evaluateDiscountCode(member10, 200_000, '2026-11-20');
  assert.equal(belowMin.valid, false);
  assert.equal(belowMin.discountAmountVnd, 0);

  const validRegular = evaluateDiscountCode(member10, 1_000_000, '2026-11-20');
  assert.equal(validRegular.valid, true);
  assert.equal(validRegular.discountAmountVnd, 100_000);

  const capped = evaluateDiscountCode(member10, 3_000_000, '2026-11-20');
  assert.equal(capped.valid, true);
  assert.equal(capped.discountAmountVnd, 200_000);

  const giam10Valid = evaluateDiscountCode(giam10, 400_000, '2026-11-20');
  assert.equal(giam10Valid.valid, true);
  assert.equal(giam10Valid.discountAmountVnd, 40_000);

  const giam50kValid = evaluateDiscountCode(giam50k, 250_000, '2026-11-20');
  assert.equal(giam50kValid.valid, true);
  assert.equal(giam50kValid.discountAmountVnd, 50_000);

  const expired = evaluateDiscountCode(expiredCode, 1_000_000, '2026-11-20');
  assert.equal(expired.valid, false);
});

test('calculateInvoiceTotals computes discount and 8% VAT accurately in VND', () => {
  const result = calculateInvoiceTotals(1_000_000, 100_000, 0.08);
  assert.equal(result.subtotalVnd, 1_000_000);
  assert.equal(result.discountAmountVnd, 100_000);
  assert.equal(result.vatAmountVnd, 72_000);
  assert.equal(result.totalAmountVnd, 972_000);
});

test('calculateCashChange returns positive change or negative deficit', () => {
  assert.equal(calculateCashChange(500_000, 385_000), 115_000);
  assert.equal(calculateCashChange(385_000, 385_000), 0);
  assert.equal(calculateCashChange(300_000, 385_000), -85_000);
});
