import { MOCK_TABLES } from '../mocks';
import {
  ApiResponse,
  DiningTable,
  TableStatus,
  UpdateTableDetailsRequest,
} from '../types';
import { cloneData, createApiResponse, simulateLatency } from './apiConfig';

let tableStore: DiningTable[] = cloneData(MOCK_TABLES);

/**
 * GET /api/tables
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<DiningTable[]>>('/tables');
 * return res.data;
 */
export async function getTables(): Promise<ApiResponse<DiningTable[]>> {
  await simulateLatency();
  return createApiResponse(cloneData(tableStore));
}

/**
 * GET /api/tables/{id}
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<DiningTable>>(`/tables/${id}`);
 * return res.data;
 */
export async function getTableById(id: number): Promise<ApiResponse<DiningTable>> {
  await simulateLatency();
  const table = tableStore.find((item) => item.id === id);
  if (!table) {
    throw new Error(`Không tìm thấy bàn ăn mã #${id}.`);
  }
  return createApiResponse(cloneData(table));
}

/**
 * PATCH /api/tables/{id}/status
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.patch<ApiResponse<DiningTable>>(`/tables/${id}/status`, { status });
 * return res.data;
 */
export async function updateTableStatus(
  id: number,
  status: TableStatus
): Promise<ApiResponse<DiningTable>> {
  return updateTableDetails(id, { status });
}

/**
 * PATCH /api/tables/{id}
 * Cập nhật trạng thái bàn, liên kết đơn hàng hoặc thông tin khách đặt trước.
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.patch<ApiResponse<DiningTable>>(`/tables/${id}`, payload);
 * return res.data;
 */
export async function updateTableDetails(
  id: number,
  payload: UpdateTableDetailsRequest
): Promise<ApiResponse<DiningTable>> {
  await simulateLatency();
  const index = tableStore.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Không tìm thấy bàn ăn mã #${id}.`);
  }

  const current = tableStore[index];
  const next: DiningTable = {
    ...current,
    status: payload.status,
    currentOrderId:
      payload.currentOrderId !== undefined
        ? payload.currentOrderId
        : payload.status === TableStatus.AVAILABLE
          ? null
          : current.currentOrderId,
    reservedCustomerName:
      payload.reservedCustomerName !== undefined
        ? payload.reservedCustomerName
        : payload.status === TableStatus.RESERVED
          ? current.reservedCustomerName
          : null,
    reservedCustomerPhone:
      payload.reservedCustomerPhone !== undefined
        ? payload.reservedCustomerPhone
        : payload.status === TableStatus.RESERVED
          ? current.reservedCustomerPhone
          : null,
    reservedGuestCount:
      payload.reservedGuestCount !== undefined
        ? payload.reservedGuestCount
        : payload.status === TableStatus.RESERVED
          ? current.reservedGuestCount
          : null,
    reservedAt:
      payload.reservedAt !== undefined
        ? payload.reservedAt
        : payload.status === TableStatus.RESERVED
          ? current.reservedAt
          : null,
  };

  tableStore[index] = next;
  return createApiResponse(cloneData(next), 'Cập nhật thông tin bàn thành công');
}
