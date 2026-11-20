import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { DishImage } from '../components/common/DishImage';
import { useRestaurant } from '../context/RestaurantContext';
import {
  MenuCategory,
  MenuItem,
  MenuItemStatus,
  OrderStatus,
  TableStatus,
} from '../types';
import {
  formatVnd,
  MENU_CATEGORY_LABELS,
  TABLE_AREA_LABELS,
} from '../utils';

type CategoryFilter = 'ALL' | MenuCategory;

interface DraftTicketItem {
  menuItemId: number;
  name: string;
  unitPriceVnd: number;
  unit: string;
  quantity: number;
  note: string;
}

const POS_CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  {
    value: MenuCategory.APPETIZER,
    label: MENU_CATEGORY_LABELS[MenuCategory.APPETIZER],
  },
  {
    value: MenuCategory.MAIN_COURSE,
    label: MENU_CATEGORY_LABELS[MenuCategory.MAIN_COURSE],
  },
  {
    value: MenuCategory.DRINK,
    label: MENU_CATEGORY_LABELS[MenuCategory.DRINK],
  },
  {
    value: MenuCategory.DESSERT,
    label: MENU_CATEGORY_LABELS[MenuCategory.DESSERT],
  },
];

const QUICK_KITCHEN_NOTES = [
  'Ít cay',
  'Không hành',
  'Ít đá',
  'Làm nhanh giúp bàn',
  'Để riêng nước chấm',
];

export function OrdersPage() {
  const {
    currentUser,
    tables,
    menuItems,
    orders,
    loading,
    selectedPosTableId,
    setSelectedPosTableId,
    submitOrder,
    goToBillingForTable,
    navigateTo,
  } = useRestaurant();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [ticketItems, setTicketItems] = useState<DraftTicketItem[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    tableId?: number;
  } | null>(null);

  // Chỉ lấy các bàn đang phục vụ (OCCUPIED)
  const occupiedTables = useMemo(
    () => tables.filter((t) => t.status === TableStatus.OCCUPIED),
    [tables]
  );

  // Tự động chọn bàn đang phục vụ đầu tiên nếu chưa chọn hoặc bàn cũ không còn OCCUPIED
  useEffect(() => {
    if (occupiedTables.length === 0) {
      if (selectedPosTableId !== null) setSelectedPosTableId(null);
      return;
    }
    const stillValid = occupiedTables.some((t) => t.id === selectedPosTableId);
    if (!stillValid) {
      setSelectedPosTableId(occupiedTables[0].id);
    }
  }, [occupiedTables, selectedPosTableId, setSelectedPosTableId]);

  const activeTable = useMemo(
    () => occupiedTables.find((t) => t.id === selectedPosTableId) ?? null,
    [occupiedTables, selectedPosTableId]
  );

  const existingTableOrder = useMemo(() => {
    if (!activeTable) return null;
    return (
      orders.find(
        (order) =>
          order.tableId === activeTable.id &&
          order.status !== OrderStatus.SERVED &&
          order.status !== OrderStatus.CANCELLED
      ) ?? null
    );
  }, [orders, activeTable]);

  // Cập nhật số khách gợi ý khi đổi bàn
  useEffect(() => {
    if (existingTableOrder) {
      setGuestCount(existingTableOrder.guestCount);
    } else if (activeTable) {
      setGuestCount(Math.min(4, activeTable.capacity));
    }
  }, [activeTable, existingTableOrder]);

  const filteredMenuItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (item.status === MenuItemStatus.DISCONTINUED) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
      );
    });
  }, [menuItems, categoryFilter, searchQuery]);

  const ticketQuantityMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of ticketItems) {
      map.set(item.menuItemId, item.quantity);
    }
    return map;
  }, [ticketItems]);

  const draftSubtotalVnd = useMemo(
    () =>
      ticketItems.reduce(
        (sum, item) => sum + item.unitPriceVnd * item.quantity,
        0
      ),
    [ticketItems]
  );

  const totalDraftCount = useMemo(
    () => ticketItems.reduce((sum, item) => sum + item.quantity, 0),
    [ticketItems]
  );

  function handleAddDish(dish: MenuItem) {
    if (dish.status !== MenuItemStatus.AVAILABLE) return;
    setFeedback(null);
    setTicketItems((prev) => {
      const exists = prev.find((i) => i.menuItemId === dish.id);
      if (exists) {
        return prev.map((i) =>
          i.menuItemId === dish.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: dish.id,
          name: dish.name,
          unitPriceVnd: dish.priceVnd,
          unit: dish.unit,
          quantity: 1,
          note: '',
        },
      ];
    });
  }

  function handleChangeQuantity(menuItemId: number, delta: number) {
    setTicketItems((prev) =>
      prev
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function handleItemNoteChange(menuItemId: number, note: string) {
    setTicketItems((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId ? { ...item, note } : item
      )
    );
  }

  function handleRemoveItem(menuItemId: number) {
    setTicketItems((prev) =>
      prev.filter((item) => item.menuItemId !== menuItemId)
    );
  }

  function handleAppendQuickNote(tag: string) {
    setOrderNote((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.toLowerCase().includes(tag.toLowerCase())) return prev;
      return `${trimmed}, ${tag.toLowerCase()}`;
    });
  }

  async function handleSubmitTicket() {
    if (!activeTable) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng chọn một bàn đang phục vụ trước khi gửi phiếu.',
      });
      return;
    }
    if (ticketItems.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Phiếu gọi món chưa có món ăn nào.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await submitOrder({
        tableId: activeTable.id,
        staffId: currentUser.id,
        staffName: currentUser.fullName,
        guestCount: Math.max(1, guestCount),
        note: orderNote.trim() || undefined,
        items: ticketItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          note: item.note.trim() || undefined,
        })),
      });
      setTicketItems([]);
      setOrderNote('');
      setFeedback({
        type: 'success',
        message: `${res.message} (${activeTable.tableName}).`,
        tableId: activeTable.id,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể gửi phiếu gọi món xuống bếp.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Tiêu đề trang POS */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F1D1A]">
            Tạo phiếu gọi món (POS)
          </h1>
          <p className="text-sm text-[#5E5850]">
            Chọn bàn đang phục vụ, kiểm tra tình trạng nguyên liệu trực tiếp và
            gửi phiếu yêu cầu chế biến xuống bếp.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('tables')}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#DCD7CE] bg-white px-3.5 text-xs font-semibold text-[#1F1D1A] transition-colors hover:border-[#C2572B]/50 hover:bg-[#FDF5F1] hover:text-[#9A3D18] cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <span>Xem sơ đồ bàn</span>
        </button>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
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
          <div className="flex items-center gap-3">
            {feedback.type === 'success' && feedback.tableId && (
              <button
                type="button"
                onClick={() => goToBillingForTable(feedback.tableId!)}
                className="text-xs font-bold underline underline-offset-2 cursor-pointer whitespace-nowrap"
              >
                Đi tới thanh toán
              </button>
            )}
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold underline underline-offset-2 cursor-pointer whitespace-nowrap"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Giao diện POS chia 2 cột: Trái ~65% (8/12) — Phải ~35% (4/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (65%): Chọn bàn đang phục vụ + Bộ lọc danh mục + Lưới thẻ món */}
        <div className="lg:col-span-8 space-y-4">
          {/* Thanh chọn bàn đang phục vụ */}
          <section
            aria-label="Chọn bàn đang phục vụ"
            className="rounded-xl border border-[#E6E2DC] bg-white p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#5E5850]">
                1. Chọn bàn đang phục vụ ({occupiedTables.length} bàn)
              </h2>
              {activeTable && (
                <div className="flex items-center gap-2 text-xs text-[#5E5850]">
                  <label htmlFor="pos-guest-count" className="font-medium">
                    Số khách:
                  </label>
                  <input
                    id="pos-guest-count"
                    type="number"
                    min={1}
                    max={activeTable.capacity}
                    value={guestCount}
                    onChange={(e) =>
                      setGuestCount(
                        Math.max(
                          1,
                          Math.min(
                            activeTable.capacity,
                            Number(e.target.value) || 1
                          )
                        )
                      )
                    }
                    className="h-8 w-16 rounded-md border border-[#DCD7CE] bg-[#FAF9F7] px-2 text-center text-xs font-semibold tabular-nums text-[#1F1D1A] focus:border-[#C2572B] focus:bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            {occupiedTables.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-[#DCD7CE] bg-[#FAF9F7] p-4 text-sm text-[#5E5850]">
                <span>
                  Hiện chưa có bàn nào ở trạng thái Đang phục vụ. Vui lòng nhận
                  bàn trước khi gọi món.
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo('tables')}
                  className="inline-flex h-8 items-center rounded-md bg-[#C2572B] px-3 text-xs font-semibold text-white hover:bg-[#A5451E] cursor-pointer"
                >
                  Mở Quản lý đặt bàn
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {occupiedTables.map((table) => {
                  const isSelected = table.id === selectedPosTableId;
                  const tableOrder = orders.find(
                    (o) =>
                      o.tableId === table.id &&
                      o.status !== OrderStatus.SERVED &&
                      o.status !== OrderStatus.CANCELLED
                  );
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => setSelectedPosTableId(table.id)}
                      aria-pressed={isSelected}
                      data-testid={`pos-table-${table.tableCode}`}
                      className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C2572B] ${
                        isSelected
                          ? 'border-[#C2572B] bg-[#FDF5F1] text-[#9A3D18] ring-1 ring-[#C2572B]'
                          : 'border-[#DCD7CE] bg-[#FAF9F7] text-[#1F1D1A] hover:border-[#C2572B]/50 hover:bg-white'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold">
                        {table.tableCode}
                      </span>
                      <span className="text-xs font-semibold whitespace-nowrap">
                        {table.tableName}
                      </span>
                      <span className="text-[11px] text-[#6E675E] hidden sm:inline">
                        · {TABLE_AREA_LABELS[table.area]}
                      </span>
                      {tableOrder && (
                        <span className="text-[11px] font-semibold text-[#B91C1C] tabular-nums whitespace-nowrap">
                          ({tableOrder.items.length} món)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Danh mục thực đơn & tìm kiếm */}
          <section
            aria-label="Danh sách món ăn"
            className="rounded-xl border border-[#E6E2DC] bg-white overflow-hidden"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E6E2DC] px-4 py-3.5">
              <div
                role="group"
                aria-label="Lọc danh mục món ăn"
                className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F2EFEA] p-1"
              >
                {POS_CATEGORIES.map((cat) => {
                  const active = categoryFilter === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategoryFilter(cat.value)}
                      className={`h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#C2572B] ${
                        active
                          ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                          : 'text-[#5E5850] hover:text-[#1F1D1A]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-56">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8378]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Tìm nhanh món ăn"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm món ăn..."
                  className="h-9 w-full rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] pl-9 pr-3 text-xs text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#C2572B] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Lưới thẻ món ăn */}
            <div className="p-4">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-56 rounded-xl border border-[#E6E2DC] bg-[#FAF9F7] animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#6E675E]">
                  Không có món ăn phù hợp với từ khóa hoặc danh mục đang chọn.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {filteredMenuItems.map((dish) => {
                    const isOutOfStock =
                      dish.status === MenuItemStatus.OUT_OF_STOCK;
                    const inTicketQty = ticketQuantityMap.get(dish.id) ?? 0;

                    return (
                      <article
                        key={dish.id}
                        data-testid={`pos-dish-${dish.sku}`}
                        data-out-of-stock={isOutOfStock ? 'true' : 'false'}
                        className={`flex flex-col rounded-xl border bg-white overflow-hidden transition-colors ${
                          isOutOfStock
                            ? 'border-[#F3C5C0] bg-[#FAF8F7] opacity-65'
                            : inTicketQty > 0
                              ? 'border-[#C2572B] ring-1 ring-[#C2572B]/30'
                              : 'border-[#E6E2DC] hover:border-[#C2572B]/50'
                        }`}
                      >
                        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[#EFECE6]">
                          <DishImage
                            src={dish.imageUrl}
                            alt={dish.name}
                            className={`h-full w-full ${
                              isOutOfStock ? 'grayscale' : ''
                            }`}
                          />
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#1F1D1A]/45">
                              <span className="rounded-md bg-[#B91C1C] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-xs">
                                Hết nguyên liệu
                              </span>
                            </div>
                          )}
                          {!isOutOfStock && inTicketQty > 0 && (
                            <span className="absolute top-2 right-2 rounded-md bg-[#C2572B] px-2 py-0.5 text-xs font-bold text-white tabular-nums shadow-xs">
                              x{inTicketQty}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-3.5 space-y-2.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="text-[#6E675E]">
                                {MENU_CATEGORY_LABELS[dish.category]}
                              </span>
                              {isOutOfStock ? (
                                <span className="font-bold text-[#B91C1C] whitespace-nowrap">
                                  Hết nguyên liệu
                                </span>
                              ) : (
                                <span className="text-[#15803D] font-medium whitespace-nowrap">
                                  Còn hàng
                                </span>
                              )}
                            </div>

                            <h3
                              className={`font-display text-sm font-bold leading-snug ${
                                isOutOfStock
                                  ? 'text-[#6E675E] line-through'
                                  : 'text-[#1F1D1A]'
                              }`}
                            >
                              {dish.name}
                            </h3>
                          </div>

                          <div className="pt-2 border-t border-[#EFECE6] flex items-center justify-between gap-2">
                            <div>
                              <p
                                className={`font-display text-sm font-bold tabular-nums ${
                                  isOutOfStock
                                    ? 'text-[#7A7268]'
                                    : 'text-[#9A3D18]'
                                }`}
                              >
                                {formatVnd(dish.priceVnd)}
                              </p>
                              <p className="text-[11px] text-[#7A7268]">
                                / {dish.unit}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isOutOfStock || !activeTable}
                              onClick={() => handleAddDish(dish)}
                              aria-label={
                                isOutOfStock
                                  ? `${dish.name} đã hết nguyên liệu`
                                  : `Thêm ${dish.name} vào phiếu`
                              }
                              className={`inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                                isOutOfStock || !activeTable
                                  ? 'bg-[#E6E2DC] text-[#7A7268] cursor-not-allowed'
                                  : 'bg-[#C2572B] text-white hover:bg-[#A5451E] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C2572B]'
                              }`}
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{isOutOfStock ? 'Hết món' : 'Thêm'}</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* CỘT PHẢI (35%): Phiếu gọi món hiện tại */}
        <aside
          aria-label="Phiếu gọi món hiện tại"
          className="lg:col-span-4 lg:sticky lg:top-6 rounded-xl border border-[#E6E2DC] bg-white overflow-hidden flex flex-col"
        >
          {/* Đầu phiếu */}
          <div className="border-b border-[#E6E2DC] bg-[#FAF9F7] px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingBag
                  className="h-4 w-4 shrink-0 text-[#C2572B]"
                  aria-hidden="true"
                />
                <h2 className="font-display text-base font-bold text-[#1F1D1A] truncate">
                  Phiếu gọi món
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#5E5850] tabular-nums whitespace-nowrap">
                {totalDraftCount} món mới
              </span>
            </div>

            {activeTable ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#9A3D18]">
                  {activeTable.tableName} ({activeTable.tableCode})
                </span>
                <span className="text-[#6E675E]">
                  {existingTableOrder
                    ? `Bổ sung vào ${existingTableOrder.orderCode}`
                    : 'Tạo phiếu mới (PENDING)'}
                </span>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-[#B91C1C]">
                Chưa chọn bàn đang phục vụ
              </p>
            )}
          </div>

          {/* Danh sách món trong phiếu nháp */}
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {ticketItems.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <UtensilsCrossed
                  className="mx-auto h-7 w-7 text-[#C9C2B8]"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-[#5E5850]">
                  Chưa có món nào trong phiếu
                </p>
                <p className="text-xs text-[#7A7268]">
                  Bấm nút &ldquo;Thêm&rdquo; ở danh sách món bên trái để bắt đầu
                  lên đơn cho bàn.
                </p>
              </div>
            ) : (
              ticketItems.map((item) => (
                <div
                  key={item.menuItemId}
                  className="rounded-lg border border-[#E6E2DC] bg-[#FAF9F7] p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F1D1A] leading-snug">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#6E675E] tabular-nums">
                        {formatVnd(item.unitPriceVnd)} / {item.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.menuItemId)}
                      aria-label={`Bỏ ${item.name} khỏi phiếu`}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#7A7268] hover:bg-[#FEF3F2] hover:text-[#B91C1C] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-md border border-[#DCD7CE] bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          handleChangeQuantity(item.menuItemId, -1)
                        }
                        aria-label={`Giảm số lượng ${item.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center text-[#4A453E] hover:bg-[#F2EFEA] cursor-pointer"
                      >
                        <Minus className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold tabular-nums text-[#1F1D1A]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleChangeQuantity(item.menuItemId, 1)}
                        aria-label={`Tăng số lượng ${item.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center text-[#4A453E] hover:bg-[#F2EFEA] cursor-pointer"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-[#1F1D1A] tabular-nums whitespace-nowrap">
                      {formatVnd(item.unitPriceVnd * item.quantity)}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) =>
                      handleItemNoteChange(item.menuItemId, e.target.value)
                    }
                    placeholder="Ghi chú riêng cho món (ít cay, không hành...)"
                    aria-label={`Ghi chú cho món ${item.name}`}
                    className="h-8 w-full rounded-md border border-[#E6E2DC] bg-white px-2.5 text-xs text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#C2572B] focus:outline-none"
                  />
                </div>
              ))
            )}
          </div>

          {/* Ghi chú chung cho bếp & nút gửi */}
          <div className="border-t border-[#E6E2DC] bg-[#FAF9F7] p-4 space-y-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="pos-order-note"
                className="block text-xs font-semibold text-[#4A453E]"
              >
                Ghi chú chung gửi bếp
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_KITCHEN_NOTES.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAppendQuickNote(tag)}
                    className="rounded-md border border-[#DCD7CE] bg-white px-2 py-1 text-[11px] font-medium text-[#4A453E] transition-colors hover:border-[#C2572B] hover:text-[#9A3D18] cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              <textarea
                id="pos-order-note"
                rows={2}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Ví dụ: Lên món khai vị trước, ít cay, không hành..."
                className="w-full rounded-lg border border-[#DCD7CE] bg-white px-3 py-2 text-xs text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#C2572B] focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#E6E2DC]">
              {existingTableOrder && (
                <div className="flex items-center justify-between text-xs text-[#6E675E]">
                  <span>Đơn đã gọi trước đó</span>
                  <span className="tabular-nums font-medium">
                    {formatVnd(existingTableOrder.subtotalVnd)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#1F1D1A]">
                  Tạm tính phiếu mới
                </span>
                <span className="font-display text-lg font-bold text-[#9A3D18] tabular-nums">
                  {formatVnd(draftSubtotalVnd)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting || !activeTable || ticketItems.length === 0}
              onClick={() => void handleSubmitTicket()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B]"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>
                {submitting ? 'Đang gửi phiếu...' : 'Gửi phiếu xuống bếp'}
              </span>
            </button>

            <p className="text-[11px] font-mono text-[#6E675E] text-center">
              POST /api/orders · Trạng thái khởi tạo: PENDING
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
