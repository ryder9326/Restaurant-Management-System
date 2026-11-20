import { Order, OrderItem, OrderItemStatus, OrderStatus } from '../types';

export type KitchenTabFilter = 'ALL' | 'PENDING' | 'COOKING' | 'COMPLETED';

export interface OrderCookingProgress {
  completed: number;
  total: number;
  percentage: number;
}

/**
 * Sắp xếp danh sách phiếu bếp theo thứ tự FIFO (phiếu cũ nhất xếp trước).
 */
export function sortKitchenTicketsFifo(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const timeDiff =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id - b.id;
  });
}

/**
 * Lọc danh sách phiếu hiển thị trên màn hình KDS (loại bỏ phiếu đã thanh toán SERVED / đã hủy CANCELLED).
 */
export function getActiveKitchenOrders(orders: Order[]): Order[] {
  return sortKitchenTicketsFifo(
    orders.filter(
      (order) =>
        order.status === OrderStatus.PENDING ||
        order.status === OrderStatus.COOKING ||
        order.status === OrderStatus.COMPLETED
    )
  );
}

/**
 * Lọc phiếu KDS theo tab: Tất cả / Chờ tiếp nhận / Đang chế biến / Đã hoàn thành.
 */
export function filterKitchenTicketsByTab(
  orders: Order[],
  tab: KitchenTabFilter
): Order[] {
  const active = getActiveKitchenOrders(orders);
  if (tab === 'ALL') return active;
  return active.filter((order) => order.status === tab);
}

/**
 * Trả về trạng thái kế tiếp của một dòng món trong quy trình bếp:
 * PENDING (Chờ làm) -> COOKING (Đang nấu) -> COMPLETED (Hoàn thành)
 */
export function getNextOrderItemStatus(
  current: OrderItemStatus
): OrderItemStatus {
  if (current === OrderItemStatus.PENDING) return OrderItemStatus.COOKING;
  if (current === OrderItemStatus.COOKING) return OrderItemStatus.COMPLETED;
  return current;
}

/**
 * Tự động suy luận trạng thái phiếu bếp từ danh sách các món trong phiếu:
 * - Nếu tất cả món đang hiệu lực đều COMPLETED -> tự động chuyển phiếu thành COMPLETED (Sẵn sàng phục vụ).
 * - Nếu có ít nhất 1 món COOKING hoặc COMPLETED và phiếu đang PENDING -> chuyển phiếu sang COOKING.
 * - Nếu phiếu đang COMPLETED nhưng còn món chưa hoàn thành -> chuyển lại COOKING.
 */
export function deriveOrderStatusFromItems(
  items: Pick<OrderItem, 'status'>[],
  currentOrderStatus: OrderStatus
): OrderStatus {
  const activeItems = items.filter(
    (item) => item.status !== OrderItemStatus.CANCELLED
  );

  if (activeItems.length === 0) {
    return currentOrderStatus;
  }

  const allCompleted = activeItems.every(
    (item) => item.status === OrderItemStatus.COMPLETED
  );
  if (allCompleted) {
    return OrderStatus.COMPLETED;
  }

  const hasStartedItem = activeItems.some(
    (item) =>
      item.status === OrderItemStatus.COOKING ||
      item.status === OrderItemStatus.COMPLETED
  );

  if (
    currentOrderStatus === OrderStatus.COMPLETED ||
    (currentOrderStatus === OrderStatus.PENDING && hasStartedItem)
  ) {
    return OrderStatus.COOKING;
  }

  return currentOrderStatus;
}

/**
 * Tính tiến độ hoàn thành món trên một phiếu bếp (bỏ qua món đã hủy).
 */
export function getOrderCookingProgress(
  items: Pick<OrderItem, 'status'>[]
): OrderCookingProgress {
  const activeItems = items.filter(
    (item) => item.status !== OrderItemStatus.CANCELLED
  );
  const total = activeItems.length;
  const completed = activeItems.filter(
    (item) => item.status === OrderItemStatus.COMPLETED
  ).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}
