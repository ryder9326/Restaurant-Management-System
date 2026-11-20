import { MOCK_ORDERS } from '../mocks';
import {
  ApiResponse,
  CreateOrderRequest,
  MenuItemStatus,
  Order,
  OrderItem,
  OrderItemStatus,
  OrderStatus,
  TableStatus,
  UpdateOrderItemChange,
} from '../types';
import {
  calculateOrderSubtotal,
  deriveOrderStatusFromItems,
} from '../utils';
import { cloneData, createApiResponse, simulateLatency } from './apiConfig';
import * as menuService from './menuService';
import * as tableService from './tableService';

let orderStore: Order[] = cloneData(MOCK_ORDERS);

/**
 * GET /api/orders
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<Order[]>>('/orders', { params: { status } });
 * return res.data;
 */
export async function getOrders(status?: OrderStatus): Promise<ApiResponse<Order[]>> {
  await simulateLatency();
  const filtered = status
    ? orderStore.filter((order) => order.status === status)
    : orderStore;
  return createApiResponse(cloneData(filtered));
}

/**
 * GET /api/orders/kitchen
 * Trả về các đơn đang chờ chế biến hoặc đang nấu dành cho màn hình Điều phối bếp.
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<Order[]>>('/orders/kitchen');
 * return res.data;
 */
export async function getKitchenOrders(): Promise<ApiResponse<Order[]>> {
  await simulateLatency();
  const kitchenQueue = orderStore.filter(
    (order) =>
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.COOKING ||
      order.status === OrderStatus.COMPLETED
  );
  return createApiResponse(cloneData(kitchenQueue));
}

/**
 * POST /api/orders
 * Tạo đơn gọi món mới (hoặc gửi thêm món cho bàn đang phục vụ), kiểm tra trạng thái nguyên liệu.
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.post<ApiResponse<Order>>('/orders', payload);
 * return res.data;
 */
export async function createOrder(payload: CreateOrderRequest): Promise<ApiResponse<Order>> {
  await simulateLatency();

  if (!payload.items.length) {
    throw new Error('Phiếu gọi món cần tối thiểu 1 món ăn.');
  }

  const [tableRes, menuRes] = await Promise.all([
    tableService.getTableById(payload.tableId),
    menuService.getMenuItems(),
  ]);

  const table = tableRes.data;
  const menuList = menuRes.data;

  // Kiểm tra nguyên liệu tất cả món trước khi tạo phiếu
  for (const reqItem of payload.items) {
    const found = menuList.find((m) => m.id === reqItem.menuItemId);
    if (!found) {
      throw new Error(`Món ăn mã #${reqItem.menuItemId} không tồn tại.`);
    }
    if (found.status !== MenuItemStatus.AVAILABLE) {
      throw new Error(`Món "${found.name}" hiện đang hết nguyên liệu.`);
    }
    if (reqItem.quantity <= 0) {
      throw new Error(`Số lượng của món "${found.name}" phải lớn hơn 0.`);
    }
  }

  const now = new Date().toISOString();

  // Nếu bàn đang có một đơn chưa thanh toán (PENDING/COOKING/COMPLETED), bổ sung thêm món vào đơn hiện tại
  const existingIndex = orderStore.findIndex(
    (o) =>
      o.tableId === table.id &&
      o.status !== OrderStatus.SERVED &&
      o.status !== OrderStatus.CANCELLED
  );

  if (existingIndex !== -1) {
    const existing = orderStore[existingIndex];
    const maxItemId = Math.max(
      existing.id * 10,
      ...existing.items.map((item) => item.id)
    );

    const addedItems: OrderItem[] = payload.items.map((reqItem, idx) => {
      const menuItem = menuList.find((m) => m.id === reqItem.menuItemId)!;
      return {
        id: maxItemId + idx + 1,
        orderId: existing.id,
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: reqItem.quantity,
        unitPriceVnd: menuItem.priceVnd,
        lineTotalVnd: menuItem.priceVnd * reqItem.quantity,
        note: reqItem.note?.trim() || undefined,
        status: OrderItemStatus.PENDING,
      };
    });

    const mergedItems = [...existing.items, ...addedItems];
    const updatedNote = [existing.note, payload.note?.trim()]
      .filter(Boolean)
      .join(' | ');

    const updatedOrder: Order = {
      ...existing,
      guestCount: payload.guestCount || existing.guestCount,
      status: OrderStatus.PENDING,
      items: mergedItems,
      subtotalVnd: calculateOrderSubtotal(mergedItems),
      note: updatedNote || undefined,
      updatedAt: now,
    };

    orderStore[existingIndex] = updatedOrder;
    await tableService.updateTableDetails(table.id, {
      status: TableStatus.OCCUPIED,
      currentOrderId: updatedOrder.id,
    });

    return createApiResponse(
      cloneData(updatedOrder),
      `Đã bổ sung món vào phiếu ${updatedOrder.orderCode} và gửi xuống bếp`
    );
  }

  const nextId = Math.max(500, ...orderStore.map((o) => o.id)) + 1;
  const items: OrderItem[] = payload.items.map((reqItem, idx) => {
    const menuItem = menuList.find((m) => m.id === reqItem.menuItemId)!;
    return {
      id: nextId * 10 + idx + 1,
      orderId: nextId,
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      quantity: reqItem.quantity,
      unitPriceVnd: menuItem.priceVnd,
      lineTotalVnd: menuItem.priceVnd * reqItem.quantity,
      note: reqItem.note?.trim() || undefined,
      status: OrderItemStatus.PENDING,
    };
  });

  const newOrder: Order = {
    id: nextId,
    orderCode: `OD-20261120-${String(nextId).slice(-3)}`,
    tableId: table.id,
    tableName: table.tableName,
    staffId: payload.staffId,
    staffName: payload.staffName || 'Trần Thu Hà',
    guestCount: payload.guestCount,
    status: OrderStatus.PENDING,
    items,
    subtotalVnd: calculateOrderSubtotal(items),
    note: payload.note?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  orderStore = [newOrder, ...orderStore];

  await tableService.updateTableDetails(table.id, {
    status: TableStatus.OCCUPIED,
    currentOrderId: newOrder.id,
  });

  return createApiResponse(
    cloneData(newOrder),
    `Đã tạo phiếu ${newOrder.orderCode} và gửi xuống bếp`
  );
}

/**
 * PUT /api/orders/{id}/items
 * Cập nhật số lượng hoặc hủy món chưa nấu (PENDING) ngay trước khi thanh toán.
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.put<ApiResponse<Order>>(`/orders/${id}/items`, { changes });
 * return res.data;
 */
export async function updateOrderItems(
  orderId: number,
  changes: UpdateOrderItemChange[]
): Promise<ApiResponse<Order>> {
  await simulateLatency();
  const index = orderStore.findIndex((order) => order.id === orderId);
  if (index === -1) {
    throw new Error(`Không tìm thấy đơn hàng mã #${orderId}.`);
  }

  const current = orderStore[index];
  const changeMap = new Map(changes.map((c) => [c.orderItemId, c]));

  const updatedItems: OrderItem[] = current.items.map((item) => {
    const patch = changeMap.get(item.id);
    if (!patch) return item;
    // Chỉ cho phép sửa/hủy món chưa chế biến (PENDING)
    if (item.status !== OrderItemStatus.PENDING) {
      return item;
    }
    const nextQty = Math.max(0, Math.round(patch.quantity));
    const nextStatus =
      nextQty === 0 ? OrderItemStatus.CANCELLED : patch.status;
    return {
      ...item,
      quantity: nextStatus === OrderItemStatus.CANCELLED ? item.quantity : nextQty,
      lineTotalVnd:
        nextStatus === OrderItemStatus.CANCELLED
          ? 0
          : nextQty * item.unitPriceVnd,
      status: nextStatus,
    };
  });

  const updatedOrder: Order = {
    ...current,
    items: updatedItems,
    subtotalVnd: calculateOrderSubtotal(updatedItems),
    updatedAt: new Date().toISOString(),
  };

  orderStore[index] = updatedOrder;
  return createApiResponse(
    cloneData(updatedOrder),
    'Đã cập nhật thông tin đơn hàng thành công'
  );
}

/**
 * PATCH /api/orders/{id}/accept
 * Bếp tiếp nhận phiếu gọi món từ hàng đợi (PENDING -> COOKING).
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/accept`);
 * return res.data;
 */
export async function acceptKitchenOrder(id: number): Promise<ApiResponse<Order>> {
  await simulateLatency();
  const index = orderStore.findIndex((order) => order.id === id);
  if (index === -1) {
    throw new Error(`Không tìm thấy phiếu bếp mã #${id}.`);
  }

  const current = orderStore[index];
  if (current.status === OrderStatus.PENDING) {
    orderStore[index] = {
      ...current,
      status: OrderStatus.COOKING,
      updatedAt: new Date().toISOString(),
    };
  }

  return createApiResponse(
    cloneData(orderStore[index]),
    `Bếp đã tiếp nhận phiếu ${orderStore[index].orderCode} (${orderStore[index].tableName})`
  );
}

/**
 * PATCH /api/orders/{orderId}/items/{itemId}/status
 * Cập nhật trạng thái từng món ăn trên KDS (PENDING -> COOKING -> COMPLETED).
 * Tự động chuyển trạng thái phiếu sang COMPLETED (Sẵn sàng phục vụ) khi mọi món đã hoàn thành.
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.patch<ApiResponse<Order>>(`/orders/${orderId}/items/${itemId}/status`, { status });
 * return res.data;
 */
export async function updateOrderItemStatus(
  orderId: number,
  orderItemId: number,
  nextStatus: OrderItemStatus
): Promise<ApiResponse<Order>> {
  await simulateLatency();
  const index = orderStore.findIndex((order) => order.id === orderId);
  if (index === -1) {
    throw new Error(`Không tìm thấy phiếu bếp mã #${orderId}.`);
  }

  const current = orderStore[index];
  let matchedItemName = '';
  const updatedItems = current.items.map((item) => {
    if (item.id !== orderItemId) return item;
    matchedItemName = item.menuItemName;
    return {
      ...item,
      status: nextStatus,
    };
  });

  if (!matchedItemName) {
    throw new Error(`Không tìm thấy dòng món #${orderItemId} trong phiếu ${current.orderCode}.`);
  }

  const nextOrderStatus = deriveOrderStatusFromItems(updatedItems, current.status);
  const updatedOrder: Order = {
    ...current,
    items: updatedItems,
    status: nextOrderStatus,
    updatedAt: new Date().toISOString(),
  };

  orderStore[index] = updatedOrder;

  const message =
    nextOrderStatus === OrderStatus.COMPLETED
      ? `Phiếu ${updatedOrder.orderCode} (${updatedOrder.tableName}) đã hoàn thành tất cả món và sẵn sàng phục vụ!`
      : `Đã cập nhật trạng thái món "${matchedItemName}"`;

  return createApiResponse(cloneData(updatedOrder), message);
}

/**
 * PATCH /api/orders/{id}/status
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
 * return res.data;
 */
export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<ApiResponse<Order>> {
  await simulateLatency();
  const index = orderStore.findIndex((order) => order.id === id);
  if (index === -1) {
    throw new Error(`Không tìm thấy đơn hàng mã #${id}.`);
  }

  const current = orderStore[index];
  const updatedItems =
    status === OrderStatus.COMPLETED
      ? current.items.map((item) =>
          item.status === OrderItemStatus.CANCELLED
            ? item
            : { ...item, status: OrderItemStatus.COMPLETED }
        )
      : current.items;

  orderStore[index] = {
    ...current,
    items: updatedItems,
    status,
    updatedAt: new Date().toISOString(),
  };
  return createApiResponse(
    cloneData(orderStore[index]),
    status === OrderStatus.COMPLETED
      ? `Phiếu ${current.orderCode} (${current.tableName}) đã sẵn sàng phục vụ!`
      : 'Đã cập nhật trạng thái đơn hàng'
  );
}
