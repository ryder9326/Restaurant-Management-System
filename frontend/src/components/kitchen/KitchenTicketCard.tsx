import {
  AlertTriangle,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Flame,
  PackageX,
  Play,
  Users,
} from 'lucide-react';
import {
  MenuItem,
  MenuItemStatus,
  Order,
  OrderItemStatus,
  OrderStatus,
} from '../../types';
import {
  formatDateTimeVi,
  getNextOrderItemStatus,
  getOrderCookingProgress,
} from '../../utils';

interface KitchenTicketCardProps {
  order: Order;
  menuMap: Map<number, MenuItem>;
  busyKey: string | null;
  onAcceptOrder: (orderId: number) => void;
  onAdvanceItemStatus: (
    orderId: number,
    orderItemId: number,
    nextStatus: OrderItemStatus
  ) => void;
  onCompleteOrder: (orderId: number) => void;
  onRequestOutOfStock: (menuItem: MenuItem) => void;
}

const ORDER_HEADER_THEME: Record<
  OrderStatus,
  {
    headerBg: string;
    border: string;
    statusLabel: string;
    statusText: string;
    progressBar: string;
  }
> = {
  [OrderStatus.PENDING]: {
    headerBg: 'bg-[#FFFBEB] border-b border-[#F4CF7B]',
    border: 'border-[#F4CF7B]',
    statusLabel: 'Chờ tiếp nhận',
    statusText: 'text-[#B45309]',
    progressBar: 'bg-[#D97706]',
  },
  [OrderStatus.COOKING]: {
    headerBg: 'bg-[#FDF5F1] border-b border-[#F2C6B3]',
    border: 'border-[#E6B8A3]',
    statusLabel: 'Đang chế biến',
    statusText: 'text-[#C2572B]',
    progressBar: 'bg-[#C2572B]',
  },
  [OrderStatus.COMPLETED]: {
    headerBg: 'bg-[#F0FDF4] border-b border-[#BBF7D0]',
    border: 'border-[#A7DFC0]',
    statusLabel: 'Sẵn sàng phục vụ',
    statusText: 'text-[#15803D]',
    progressBar: 'bg-[#16A34A]',
  },
  [OrderStatus.SERVED]: {
    headerBg: 'bg-[#F7F6F4] border-b border-[#E6E2DC]',
    border: 'border-[#E6E2DC]',
    statusLabel: 'Đã phục vụ',
    statusText: 'text-[#5E5850]',
    progressBar: 'bg-[#5E5850]',
  },
  [OrderStatus.CANCELLED]: {
    headerBg: 'bg-[#FEF3F2] border-b border-[#F3C5C0]',
    border: 'border-[#F3C5C0]',
    statusLabel: 'Đã hủy',
    statusText: 'text-[#B91C1C]',
    progressBar: 'bg-[#B91C1C]',
  },
};

const ITEM_STATUS_META: Record<
  OrderItemStatus,
  {
    label: string;
    textClass: string;
    rowBg: string;
    nextButtonLabel: string | null;
    nextButtonClass: string;
  }
> = {
  [OrderItemStatus.PENDING]: {
    label: 'Chờ làm',
    textClass: 'text-[#B45309]',
    rowBg: 'bg-white',
    nextButtonLabel: 'Đang nấu',
    nextButtonClass:
      'border-[#D97706] bg-[#FFFBEB] text-[#92400E] hover:bg-[#D97706] hover:text-white',
  },
  [OrderItemStatus.COOKING]: {
    label: 'Đang nấu',
    textClass: 'text-[#C2572B]',
    rowBg: 'bg-[#FFF9F6]',
    nextButtonLabel: 'Hoàn thành',
    nextButtonClass:
      'border-[#15803D] bg-[#F0FDF4] text-[#15803D] hover:bg-[#15803D] hover:text-white',
  },
  [OrderItemStatus.COMPLETED]: {
    label: 'Hoàn thành',
    textClass: 'text-[#15803D]',
    rowBg: 'bg-[#F7FBF8]',
    nextButtonLabel: null,
    nextButtonClass: '',
  },
  [OrderItemStatus.CANCELLED]: {
    label: 'Đã hủy',
    textClass: 'text-[#8A8378]',
    rowBg: 'bg-[#FAF9F7]',
    nextButtonLabel: null,
    nextButtonClass: '',
  },
};

export function KitchenTicketCard({
  order,
  menuMap,
  busyKey,
  onAcceptOrder,
  onAdvanceItemStatus,
  onCompleteOrder,
  onRequestOutOfStock,
}: KitchenTicketCardProps) {
  const theme = ORDER_HEADER_THEME[order.status];
  const progress = getOrderCookingProgress(order.items);
  const activeItems = order.items.filter(
    (item) => item.status !== OrderItemStatus.CANCELLED
  );

  const isOrderBusy = busyKey === `order-${order.id}`;

  return (
    <article
      data-testid={`kds-ticket-${order.orderCode}`}
      data-order-status={order.status}
      className={`flex flex-col rounded-xl border bg-white overflow-hidden transition-colors ${theme.border}`}
    >
      {/* Đầu thẻ phiếu bếp */}
      <div className={`px-4 py-3.5 ${theme.headerBg}`}>
        <div className="space-y-1.5">
          {/* Dòng 1: Mã phiếu & Trạng thái */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-[#4A453E] whitespace-nowrap">
              {order.orderCode}
            </span>
            <span
              className={`text-xs font-bold whitespace-nowrap ${theme.statusText}`}
            >
              {theme.statusLabel}
            </span>
          </div>

          {/* Dòng 2: Tên bàn & Thời gian đặt */}
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-[#1F1D1A] leading-snug">
              {order.tableName}
            </h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#4A453E] tabular-nums whitespace-nowrap shrink-0">
              <Clock className="h-3.5 w-3.5 text-[#6E675E]" aria-hidden="true" />
              <span>{formatDateTimeVi(order.createdAt)}</span>
            </span>
          </div>

          {/* Dòng 3: Số khách & Nhân viên phục vụ */}
          <p className="inline-flex items-center gap-1.5 text-[11px] text-[#5E5850] tabular-nums">
            <Users className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              {order.guestCount} khách · NV: {order.staffName}
            </span>
          </p>
        </div>

        {/* Thanh tiến độ món ăn */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#5E5850]">
            <span>Tiến độ chế biến</span>
            <span className="tabular-nums text-[#1F1D1A]">
              {progress.completed}/{progress.total} món hoàn thành
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/8">
            <div
              className={`h-full transition-all duration-300 ${theme.progressBar}`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ghi chú đặc biệt cấp phiếu (in đậm, nổi bật) */}
      {order.note && (
        <div className="flex items-start gap-2 border-b border-[#F4CF7B] bg-[#FEF9E7] px-4 py-2.5 text-xs text-[#7C2D12]">
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-[#C2572B] mt-0.5"
            aria-hidden="true"
          />
          <p className="leading-snug">
            <span className="font-bold uppercase tracking-wide text-[#9A3D18]">
              Ghi chú đặc biệt:{' '}
            </span>
            <strong className="font-bold text-[#1F1D1A]">{order.note}</strong>
          </p>
        </div>
      )}

      {/* Danh sách từng món trên phiếu */}
      <ul className="flex-1 divide-y divide-[#EFECE6]">
        {activeItems.map((item) => {
          const itemMeta = ITEM_STATUS_META[item.status];
          const nextStatus = getNextOrderItemStatus(item.status);
          const menuObj = menuMap.get(item.menuItemId);
          const isOutOfStock = menuObj?.status === MenuItemStatus.OUT_OF_STOCK;
          const isItemBusy = busyKey === `item-${item.id}`;

          return (
            <li
              key={item.id}
              data-testid={`kds-item-${item.id}`}
              data-item-status={item.status}
              className={`px-4 py-3 transition-colors ${itemMeta.rowBg}`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Số lượng + Tên món + Ghi chú món */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`inline-flex h-7 min-w-8 shrink-0 items-center justify-center rounded-md px-1.5 font-display text-sm font-bold tabular-nums ${
                      item.status === OrderItemStatus.COMPLETED
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : 'bg-[#1F1D1A] text-white'
                    }`}
                  >
                    {item.quantity}x
                  </span>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold leading-snug ${
                        item.status === OrderItemStatus.COMPLETED
                          ? 'text-[#5E5850] line-through'
                          : 'text-[#1F1D1A]'
                      }`}
                    >
                      {item.menuItemName}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                      <span
                        className={`font-bold whitespace-nowrap ${itemMeta.textClass}`}
                      >
                        {itemMeta.label}
                      </span>

                      {isOutOfStock && (
                        <span className="font-bold text-[#B91C1C] whitespace-nowrap">
                          · Đã báo hết nguyên liệu
                        </span>
                      )}
                    </div>

                    {item.note && (
                      <p className="mt-1.5 inline-block rounded bg-[#FEF3C7] px-2 py-0.5 text-xs font-bold text-[#92400E]">
                        Lưu ý: {item.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nút cập nhật trạng thái món + Báo hết nguyên liệu */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {itemMeta.nextButtonLabel ? (
                    <button
                      type="button"
                      disabled={isItemBusy || isOrderBusy}
                      onClick={() =>
                        onAdvanceItemStatus(order.id, item.id, nextStatus)
                      }
                      aria-label={`Chuyển món ${item.menuItemName} sang ${itemMeta.nextButtonLabel}`}
                      className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap ${itemMeta.nextButtonClass}`}
                    >
                      {item.status === OrderItemStatus.PENDING ? (
                        <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{itemMeta.nextButtonLabel}</span>
                    </button>
                  ) : (
                    <span className="inline-flex h-8 items-center gap-1 text-xs font-bold text-[#15803D] whitespace-nowrap">
                      <CheckCheck className="h-4 w-4" aria-hidden="true" />
                      <span>Đã xong</span>
                    </span>
                  )}

                  {menuObj && !isOutOfStock && (
                    <button
                      type="button"
                      onClick={() => onRequestOutOfStock(menuObj)}
                      aria-label={`Báo hết nguyên liệu món ${menuObj.name}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A7268] hover:text-[#B91C1C] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <PackageX className="h-3 w-3" aria-hidden="true" />
                      <span>Báo hết NL</span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Chân thẻ phiếu bếp */}
      <div className="border-t border-[#E6E2DC] bg-[#FAF9F7] px-4 py-3">
        {order.status === OrderStatus.PENDING && (
          <button
            type="button"
            disabled={isOrderBusy}
            onClick={() => onAcceptOrder(order.id)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] disabled:opacity-60 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B]"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            <span>{isOrderBusy ? 'Đang tiếp nhận...' : 'Tiếp nhận phiếu'}</span>
          </button>
        )}

        {order.status === OrderStatus.COOKING && (
          <button
            type="button"
            disabled={isOrderBusy}
            onClick={() => onCompleteOrder(order.id)}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#15803D] bg-white px-4 text-xs font-semibold text-[#15803D] transition-colors hover:bg-[#15803D] hover:text-white disabled:opacity-60 cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            <span>Hoàn tất nhanh toàn bộ phiếu</span>
          </button>
        )}

        {order.status === OrderStatus.COMPLETED && (
          <div className="flex items-center justify-center gap-2 py-1 text-xs font-bold text-[#15803D]">
            <BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Phiếu đã hoàn thành · Sẵn sàng phục vụ ra bàn</span>
          </div>
        )}
      </div>
    </article>
  );
}
