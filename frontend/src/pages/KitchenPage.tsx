import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  RefreshCw,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { IngredientStatusSidebar } from '../components/kitchen/IngredientStatusSidebar';
import { KitchenTicketCard } from '../components/kitchen/KitchenTicketCard';
import { useRestaurant } from '../context/RestaurantContext';
import {
  MenuItem,
  MenuItemStatus,
  OrderItemStatus,
  OrderStatus,
} from '../types';
import {
  filterKitchenTicketsByTab,
  getActiveKitchenOrders,
  KitchenTabFilter,
} from '../utils';

export function KitchenPage() {
  const {
    orders,
    menuItems,
    loading,
    error,
    refreshAll,
    acceptKitchenOrder,
    updateOrderItemStatus,
    completeKitchenOrder,
    updateMenuItemStatus,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<KitchenTabFilter>('ALL');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [busyMenuItemId, setBusyMenuItemId] = useState<number | null>(null);
  const [confirmOutOfStockItem, setConfirmOutOfStockItem] =
    useState<MenuItem | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const menuMap = useMemo(() => {
    const map = new Map<number, MenuItem>();
    for (const item of menuItems) {
      map.set(item.id, item);
    }
    return map;
  }, [menuItems]);

  const activeKitchenOrders = useMemo(
    () => getActiveKitchenOrders(orders),
    [orders]
  );

  const visibleOrders = useMemo(
    () => filterKitchenTicketsByTab(orders, activeTab),
    [orders, activeTab]
  );

  const counts = useMemo(() => {
    let pending = 0;
    let cooking = 0;
    let completed = 0;
    for (const order of activeKitchenOrders) {
      if (order.status === OrderStatus.PENDING) pending += 1;
      else if (order.status === OrderStatus.COOKING) cooking += 1;
      else if (order.status === OrderStatus.COMPLETED) completed += 1;
    }
    const outOfStock = menuItems.filter(
      (item) => item.status === MenuItemStatus.OUT_OF_STOCK
    ).length;
    return {
      all: activeKitchenOrders.length,
      pending,
      cooking,
      completed,
      outOfStock,
    };
  }, [activeKitchenOrders, menuItems]);

  const tabs: { value: KitchenTabFilter; label: string; count: number }[] = [
    { value: 'ALL', label: 'Tất cả phiếu', count: counts.all },
    { value: 'PENDING', label: 'Chờ tiếp nhận', count: counts.pending },
    { value: 'COOKING', label: 'Đang chế biến', count: counts.cooking },
    { value: 'COMPLETED', label: 'Đã hoàn thành', count: counts.completed },
  ];

  async function handleAcceptOrder(orderId: number) {
    setBusyKey(`order-${orderId}`);
    setFeedback(null);
    try {
      const res = await acceptKitchenOrder(orderId);
      setFeedback({ type: 'success', message: res.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể tiếp nhận phiếu bếp.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAdvanceItemStatus(
    orderId: number,
    orderItemId: number,
    nextStatus: OrderItemStatus
  ) {
    setBusyKey(`item-${orderItemId}`);
    setFeedback(null);
    try {
      const res = await updateOrderItemStatus(orderId, orderItemId, nextStatus);
      setFeedback({ type: 'success', message: res.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể cập nhật tình trạng món ăn.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCompleteOrder(orderId: number) {
    setBusyKey(`order-${orderId}`);
    setFeedback(null);
    try {
      const res = await completeKitchenOrder(orderId);
      setFeedback({ type: 'success', message: res.message });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể hoàn tất phiếu bếp.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleConfirmOutOfStock() {
    if (!confirmOutOfStockItem) return;
    setBusyMenuItemId(confirmOutOfStockItem.id);
    setFeedback(null);
    try {
      await updateMenuItemStatus(
        confirmOutOfStockItem.id,
        MenuItemStatus.OUT_OF_STOCK
      );
      setFeedback({
        type: 'success',
        message: `Đã báo hết nguyên liệu món "${confirmOutOfStockItem.name}" (OUT_OF_STOCK). Màn hình gọi món của Nhân viên đã tự động khóa món này.`,
      });
      setConfirmOutOfStockItem(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể cập nhật trạng thái nguyên liệu.',
      });
      setConfirmOutOfStockItem(null);
    } finally {
      setBusyMenuItemId(null);
    }
  }

  async function handleRestoreAvailable(item: MenuItem) {
    setBusyMenuItemId(item.id);
    setFeedback(null);
    try {
      await updateMenuItemStatus(item.id, MenuItemStatus.AVAILABLE);
      setFeedback({
        type: 'success',
        message: `Đã mở bán lại món "${item.name}" (AVAILABLE) trên thực đơn gọi món.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể mở bán lại món ăn này.',
      });
    } finally {
      setBusyMenuItemId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề KDS & nút làm mới */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F1D1A]">
            Điều phối bếp (KDS)
          </h1>
          <p className="text-sm text-[#5E5850]">
            Tiếp nhận phiếu gọi món theo thứ tự ưu tiên thời gian (cũ nhất ở
            trước), cập nhật tiến độ từng món và báo hết nguyên liệu đồng bộ
            trực tiếp sang POS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshAll()}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#DCD7CE] bg-white px-3.5 text-xs font-semibold text-[#1F1D1A] transition-colors hover:border-[#C2572B]/50 hover:bg-[#FDF5F1] hover:text-[#9A3D18] cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Đồng bộ hàng đợi</span>
        </button>
      </div>

      {/* Dải KPI tổng quan bếp */}
      <section
        aria-label="Tổng quan hàng đợi bếp"
        className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-[#E6E2DC] bg-white divide-y lg:divide-y-0 divide-x divide-[#E6E2DC]"
      >
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Chờ tiếp nhận</p>
          <p className="font-display text-xl font-bold text-[#B45309] tabular-nums">
            {loading ? '—' : counts.pending}
          </p>
          <p className="text-xs text-[#7A7268]">Phiếu mới từ nhân viên</p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Đang chế biến</p>
          <p className="font-display text-xl font-bold text-[#C2572B] tabular-nums">
            {loading ? '—' : counts.cooking}
          </p>
          <p className="text-xs text-[#7A7268]">Bếp đang thực hiện</p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Sẵn sàng phục vụ</p>
          <p className="font-display text-xl font-bold text-[#15803D] tabular-nums">
            {loading ? '—' : counts.completed}
          </p>
          <p className="text-xs text-[#7A7268]">Đã hoàn thành đủ món</p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Hết nguyên liệu</p>
          <p className="font-display text-xl font-bold text-[#B91C1C] tabular-nums">
            {loading ? '—' : counts.outOfStock}
          </p>
          <p className="text-xs text-[#7A7268]">Đã khóa trên POS gọi món</p>
        </div>
      </section>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'
              : 'border-[#F3C5C0] bg-[#FEF3F2] text-[#B42318]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline underline-offset-2 cursor-pointer whitespace-nowrap"
          >
            Đóng
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-[#F3C5C0] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Bố cục chính KDS: Khu vực phiếu bếp (8/12) + Thanh bên Báo hết nguyên liệu nhanh (4/12) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Bộ lọc tab + Lưới thẻ phiếu bếp theo FIFO */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Lọc phiếu bếp theo trạng thái"
              className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EBE7E0] p-1"
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.value)}
                    className={`h-9 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#C2572B] ${
                      active
                        ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                        : 'text-[#5E5850] hover:text-[#1F1D1A]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="ml-1.5 font-mono text-[11px] text-[#7A7268] tabular-nums">
                      ({tab.count})
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-[#6E675E]">
              Thứ tự: <strong className="text-[#1F1D1A]">Cũ nhất trước</strong>{' '}
              (FIFO)
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-64 rounded-xl border border-[#E6E2DC] bg-white animate-pulse"
                />
              ))}
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="rounded-xl border border-[#E6E2DC] bg-white p-12 text-center space-y-2">
              <ChefHat
                className="mx-auto h-8 w-8 text-[#C9C2B8]"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-[#1F1D1A]">
                Không có phiếu gọi món nào trong mục này
              </p>
              <p className="text-xs text-[#6E675E]">
                Khi nhân viên gửi phiếu mới từ màn hình POS, phiếu sẽ tự động
                xuất hiện tại đây theo đúng thứ tự thời gian.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {visibleOrders.map((order) => (
                <KitchenTicketCard
                  key={order.id}
                  order={order}
                  menuMap={menuMap}
                  busyKey={busyKey}
                  onAcceptOrder={(id) => void handleAcceptOrder(id)}
                  onAdvanceItemStatus={(orderId, itemId, nextStatus) =>
                    void handleAdvanceItemStatus(orderId, itemId, nextStatus)
                  }
                  onCompleteOrder={(id) => void handleCompleteOrder(id)}
                  onRequestOutOfStock={(item) => setConfirmOutOfStockItem(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: Bảng báo hết nguyên liệu / kiểm soát món nhanh */}
        <div className="xl:col-span-4">
          <IngredientStatusSidebar
            menuItems={menuItems}
            busyMenuItemId={busyMenuItemId}
            onRequestOutOfStock={(item) => setConfirmOutOfStockItem(item)}
            onRestoreAvailable={(item) => void handleRestoreAvailable(item)}
          />
        </div>
      </div>

      {/* Hộp thoại xác nhận Báo hết nguyên liệu */}
      <ConfirmDialog
        open={confirmOutOfStockItem !== null}
        title="Xác nhận báo hết nguyên liệu"
        description={
          confirmOutOfStockItem
            ? `Bạn có chắc muốn đánh dấu món "${confirmOutOfStockItem.name}" (${confirmOutOfStockItem.sku}) là Hết nguyên liệu (OUT_OF_STOCK)? Màn hình Tạo phiếu gọi món của Nhân viên sẽ lập tức khóa món này để tránh nhận thêm đơn.`
            : ''
        }
        confirmLabel="Xác nhận báo hết"
        loading={
          confirmOutOfStockItem !== null &&
          busyMenuItemId === confirmOutOfStockItem.id
        }
        onCancel={() => setConfirmOutOfStockItem(null)}
        onConfirm={() => void handleConfirmOutOfStock()}
      />
    </div>
  );
}
