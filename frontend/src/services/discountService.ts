import { MOCK_DISCOUNT_CODES } from '../mocks';
import { ApiResponse, DiscountCode } from '../types';
import { DiscountValidationResult, evaluateDiscountCode } from '../utils';
import { cloneData, createApiResponse, simulateLatency } from './apiConfig';

let discountStore: DiscountCode[] = cloneData(MOCK_DISCOUNT_CODES);

/**
 * GET /api/discounts
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<DiscountCode[]>>('/discounts');
 * return res.data;
 */
export async function getDiscountCodes(): Promise<ApiResponse<DiscountCode[]>> {
  await simulateLatency();
  return createApiResponse(cloneData(discountStore));
}

/**
 * POST /api/discounts/validate
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.post<ApiResponse<DiscountValidationResult>>('/discounts/validate', { code, subtotalVnd });
 * return res.data;
 */
export async function validateDiscountCode(
  code: string,
  subtotalVnd: number
): Promise<ApiResponse<DiscountValidationResult>> {
  await simulateLatency();
  const normalized = code.trim().toUpperCase();
  const found = discountStore.find((item) => item.code.toUpperCase() === normalized);
  if (!found) {
    return createApiResponse(
      {
        valid: false,
        reason: 'Mã giảm giá không tồn tại trên hệ thống.',
        discountAmountVnd: 0,
      },
      'Mã không hợp lệ'
    );
  }
  const result = evaluateDiscountCode(found, subtotalVnd);
  return createApiResponse(result, result.valid ? 'Áp dụng mã thành công' : result.reason);
}
