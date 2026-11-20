import { MOCK_MENU_ITEMS } from '../mocks';
import {
  ApiResponse,
  MenuCategory,
  MenuItem,
  MenuItemStatus,
  UpsertMenuItemRequest,
} from '../types';
import { cloneData, createApiResponse, simulateLatency } from './apiConfig';

let menuStore: MenuItem[] = cloneData(MOCK_MENU_ITEMS);

/**
 * GET /api/menu-items
 * Hỗ trợ query params tùy chọn: ?category=MAIN_COURSE&status=AVAILABLE
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<MenuItem[]>>('/menu-items', { params });
 * return res.data;
 */
export async function getMenuItems(params?: {
  category?: MenuCategory;
  status?: MenuItemStatus;
}): Promise<ApiResponse<MenuItem[]>> {
  await simulateLatency();
  let items = cloneData(menuStore);
  if (params?.category) {
    items = items.filter((item) => item.category === params.category);
  }
  if (params?.status) {
    items = items.filter((item) => item.status === params.status);
  }
  return createApiResponse(items);
}

/**
 * POST /api/menu-items
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.post<ApiResponse<MenuItem>>('/menu-items', payload);
 * return res.data;
 */
export async function createMenuItem(
  payload: UpsertMenuItemRequest
): Promise<ApiResponse<MenuItem>> {
  await simulateLatency();

  const normalizedSku = payload.sku.trim().toUpperCase();
  if (menuStore.some((item) => item.sku.toUpperCase() === normalizedSku)) {
    throw new Error(`Mã món ${normalizedSku} đã tồn tại trong thực đơn.`);
  }

  const nextId = Math.max(200, ...menuStore.map((item) => item.id)) + 1;
  const created: MenuItem = {
    id: nextId,
    sku: normalizedSku,
    name: payload.name.trim(),
    description: payload.description.trim(),
    category: payload.category,
    priceVnd: Math.round(payload.priceVnd),
    unit: payload.unit.trim(),
    preparationMinutes: Math.round(payload.preparationMinutes),
    status: payload.status,
    featured: false,
    imageUrl: payload.imageUrl?.trim() || undefined,
  };

  menuStore = [created, ...menuStore];
  return createApiResponse(cloneData(created), 'Đã thêm món ăn mới vào thực đơn');
}

/**
 * PUT /api/menu-items/{id}
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.put<ApiResponse<MenuItem>>(`/menu-items/${id}`, payload);
 * return res.data;
 */
export async function updateMenuItem(
  id: number,
  payload: UpsertMenuItemRequest
): Promise<ApiResponse<MenuItem>> {
  await simulateLatency();

  const index = menuStore.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Không tìm thấy món ăn mã #${id}.`);
  }

  const normalizedSku = payload.sku.trim().toUpperCase();
  if (
    menuStore.some(
      (item) => item.id !== id && item.sku.toUpperCase() === normalizedSku
    )
  ) {
    throw new Error(`Mã món ${normalizedSku} đã được sử dụng cho món khác.`);
  }

  const updated: MenuItem = {
    ...menuStore[index],
    sku: normalizedSku,
    name: payload.name.trim(),
    description: payload.description.trim(),
    category: payload.category,
    priceVnd: Math.round(payload.priceVnd),
    unit: payload.unit.trim(),
    preparationMinutes: Math.round(payload.preparationMinutes),
    status: payload.status,
    imageUrl: payload.imageUrl?.trim() || undefined,
  };

  menuStore[index] = updated;
  return createApiResponse(cloneData(updated), 'Đã cập nhật thông tin món ăn');
}

/**
 * PATCH /api/menu-items/{id}/status
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.patch<ApiResponse<MenuItem>>(`/menu-items/${id}/status`, { status });
 * return res.data;
 */
export async function updateMenuItemStatus(
  id: number,
  status: MenuItemStatus
): Promise<ApiResponse<MenuItem>> {
  await simulateLatency();
  const index = menuStore.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Không tìm thấy món ăn mã #${id}.`);
  }
  menuStore[index] = { ...menuStore[index], status };
  return createApiResponse(
    cloneData(menuStore[index]),
    'Đã cập nhật trạng thái món ăn'
  );
}

/**
 * DELETE /api/menu-items/{id}
 * Thay thế khi nối Java Backend:
 * await apiClient.delete(`/menu-items/${id}`);
 */
export async function deleteMenuItem(id: number): Promise<ApiResponse<null>> {
  await simulateLatency();
  const exists = menuStore.some((item) => item.id === id);
  if (!exists) {
    throw new Error(`Không tìm thấy món ăn mã #${id}.`);
  }
  menuStore = menuStore.filter((item) => item.id !== id);
  return createApiResponse(null, 'Đã xóa món ăn khỏi thực đơn');
}
