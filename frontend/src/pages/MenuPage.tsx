import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DishImage } from '../components/common/DishImage';
import { MenuItemFormModal } from '../components/menu/MenuItemFormModal';
import { useOptionalRestaurant } from '../context/RestaurantContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { menuService } from '../services';
import {
  MenuCategory,
  MenuItem,
  MenuItemStatus,
  UpsertMenuItemRequest,
} from '../types';
import {
  formatVnd,
  MENU_CATEGORY_LABELS,
  MENU_STATUS_LABELS,
} from '../utils';

type CategoryFilter = 'ALL' | MenuCategory;
type ViewMode = 'table' | 'cards';

const CATEGORY_FILTER_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: MenuCategory.APPETIZER, label: MENU_CATEGORY_LABELS[MenuCategory.APPETIZER] },
  { value: MenuCategory.MAIN_COURSE, label: MENU_CATEGORY_LABELS[MenuCategory.MAIN_COURSE] },
  { value: MenuCategory.DRINK, label: MENU_CATEGORY_LABELS[MenuCategory.DRINK] },
  { value: MenuCategory.DESSERT, label: MENU_CATEGORY_LABELS[MenuCategory.DESSERT] },
];

const STATUS_COLOR: Record<MenuItemStatus, string> = {
  [MenuItemStatus.AVAILABLE]: 'text-[#15803D]',
  [MenuItemStatus.OUT_OF_STOCK]: 'text-[#B91C1C]',
  [MenuItemStatus.DISCONTINUED]: 'text-[#6E675E]',
};

export function MenuPage() {
  const restaurant = useOptionalRestaurant();

  const fetchMenu = useCallback(async () => {
    const res = await menuService.getMenuItems();
    return res.data;
  }, []);

  const {
    data: items,
    loading,
    error,
    reload,
  } = useAsyncData<MenuItem[]>(fetchMenu, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (item.status === MenuItemStatus.DISCONTINUED) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [items, categoryFilter, searchQuery]);

  const availableCount = items.filter(
    (item) => item.status === MenuItemStatus.AVAILABLE
  ).length;
  const outOfStockCount = items.filter(
    (item) => item.status === MenuItemStatus.OUT_OF_STOCK
  ).length;
  const averagePriceVnd =
    items.length > 0
      ? Math.round(
          items.reduce((sum, item) => sum + item.priceVnd, 0) / items.length
        )
      : 0;

  function openCreateModal() {
    setEditingItem(null);
    setSubmitError(null);
    setFormModalOpen(true);
  }

  function openEditModal(item: MenuItem) {
    setEditingItem(item);
    setSubmitError(null);
    setFormModalOpen(true);
  }

  async function handleSaveItem(payload: UpsertMenuItemRequest) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingItem) {
        const res = await menuService.updateMenuItem(editingItem.id, payload);
        setFeedback(res.message);
      } else {
        const res = await menuService.createMenuItem(payload);
        setFeedback(res.message);
      }
      setFormModalOpen(false);
      setEditingItem(null);
      reload();
      void restaurant?.refreshMenu();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Không thể lưu thông tin món ăn.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleAvailability(item: MenuItem) {
    const nextStatus =
      item.status === MenuItemStatus.AVAILABLE
        ? MenuItemStatus.OUT_OF_STOCK
        : MenuItemStatus.AVAILABLE;
    try {
      const res = await menuService.updateMenuItemStatus(item.id, nextStatus);
      setFeedback(`${item.name}: ${MENU_STATUS_LABELS[res.data.status]}`);
      reload();
      void restaurant?.refreshMenu();
    } catch (err) {
      setFeedback(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái món.'
      );
    }
  }

  async function handleConfirmDelete() {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      const res = await menuService.deleteMenuItem(deletingItem.id);
      setDeletingItem(null);
      setFeedback(res.message);
      reload();
      void restaurant?.refreshMenu();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Không thể xóa món ăn.'
      );
      setDeletingItem(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề & nút Thêm món ăn */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F1D1A]">
            Quản lý thực đơn
          </h1>
          <p className="text-sm text-[#5E5850]">
            Quản lý món ăn, hình ảnh minh họa, đơn giá VNĐ và tình trạng nguyên
            liệu theo từng danh mục.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Thêm món ăn</span>
        </button>
      </div>

      {/* Dải chỉ số thực đơn */}
      <section
        aria-label="Tổng quan thực đơn"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-[#E6E2DC] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E6E2DC]"
      >
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Tổng số món</p>
          <p className="font-display text-xl font-bold text-[#1F1D1A] tabular-nums">
            {loading ? '—' : items.length}
          </p>
          <p className="text-xs text-[#7A7268]">4 danh mục ẩm thực Việt</p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Còn hàng</p>
          <p className="font-display text-xl font-bold text-[#15803D] tabular-nums">
            {loading ? '—' : availableCount}
          </p>
          <p className="text-xs text-[#7A7268]">Trạng thái AVAILABLE</p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Hết nguyên liệu</p>
          <p className="font-display text-xl font-bold text-[#B91C1C] tabular-nums">
            {loading ? '—' : outOfStockCount}
          </p>
          <p className="text-xs text-[#7A7268]">Trạng thái OUT_OF_STOCK</p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Đơn giá trung bình</p>
          <p className="font-display text-xl font-bold text-[#1F1D1A] tabular-nums">
            {loading ? '—' : formatVnd(averagePriceVnd)}
          </p>
          <p className="text-xs text-[#7A7268]">Tính theo VNĐ</p>
        </div>
      </section>

      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{feedback}</span>
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

      {/* Thanh công cụ: Tìm kiếm + Lọc danh mục + Chuyển dạng bảng / thẻ */}
      <section className="rounded-xl border border-[#E6E2DC] bg-white overflow-hidden">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between px-5 py-4 border-b border-[#E6E2DC]">
          <div className="relative w-full xl:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8378]"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Tìm kiếm món ăn"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên món hoặc mã món..."
              className="h-10 w-full rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] pl-9 pr-3 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] transition-colors focus:border-[#C2572B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Lọc theo danh mục món"
              className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F2EFEA] p-1"
            >
              {CATEGORY_FILTER_OPTIONS.map((option) => {
                const active = categoryFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategoryFilter(option.value)}
                    className={`h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#C2572B] ${
                      active
                        ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                        : 'text-[#5E5850] hover:text-[#1F1D1A]'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div
              role="group"
              aria-label="Chế độ hiển thị thực đơn"
              className="inline-flex items-center gap-1 rounded-lg bg-[#F2EFEA] p-1"
            >
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#C2572B] ${
                  viewMode === 'table'
                    ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                    : 'text-[#5E5850] hover:text-[#1F1D1A]'
                }`}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Dạng bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-pressed={viewMode === 'cards'}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#C2572B] ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                    : 'text-[#5E5850] hover:text-[#1F1D1A]'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Dạng thẻ</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="m-5 flex items-center justify-between gap-3 rounded-lg border border-[#F3C5C0] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={reload}
              className="text-xs font-semibold underline cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Chế độ hiển thị DẠNG BẢNG */}
        {!error && viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6E2DC] bg-[#FAF9F7] text-xs font-semibold text-[#5E5850]">
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Món ăn
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Danh mục
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right whitespace-nowrap"
                  >
                    Giá tiền
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right whitespace-nowrap"
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6] text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="h-16">
                      {Array.from({ length: 5 }).map((__, colIdx) => (
                        <td key={colIdx} className="px-5 py-3">
                          <div className="h-4 w-28 rounded bg-[#EFECE6] animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-[#6E675E]"
                    >
                      Không tìm thấy món ăn nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-[#FAF9F7]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3.5 min-w-[260px]">
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E6E2DC]">
                            <DishImage
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full"
                              iconSizeClass="h-4 w-4"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#1F1D1A] truncate">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-xs text-[#6E675E] truncate max-w-[320px]">
                              <span className="font-mono">{item.sku}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{item.unit}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{item.preparationMinutes} phút</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-[#4A453E]">
                        {MENU_CATEGORY_LABELS[item.category]}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-[#1F1D1A] whitespace-nowrap">
                        {formatVnd(item.priceVnd)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item)}
                          title="Nhấn để chuyển nhanh trạng thái Còn hàng / Hết nguyên liệu"
                          className={`text-sm font-medium underline-offset-4 hover:underline cursor-pointer ${STATUS_COLOR[item.status]}`}
                        >
                          {MENU_STATUS_LABELS[item.status]}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            aria-label={`Sửa món ${item.name}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#DCD7CE] bg-white px-2.5 text-xs font-medium text-[#1F1D1A] transition-colors hover:border-[#C2572B]/50 hover:bg-[#FDF5F1] hover:text-[#9A3D18] focus-visible:outline-2 focus-visible:outline-[#C2572B] cursor-pointer whitespace-nowrap"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            aria-label={`Xóa món ${item.name}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#DCD7CE] bg-white px-2.5 text-xs font-medium text-[#5E5850] transition-colors hover:border-[#F3C5C0] hover:bg-[#FEF3F2] hover:text-[#B91C1C] focus-visible:outline-2 focus-visible:outline-[#B91C1C] cursor-pointer whitespace-nowrap"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Chế độ hiển thị DẠNG THẺ MÓN */}
        {!error && viewMode === 'cards' && (
          <div className="p-5">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#E6E2DC] overflow-hidden"
                  >
                    <div className="aspect-[4/3] bg-[#EFECE6] animate-pulse" />
                    <div className="p-4 space-y-2.5">
                      <div className="h-4 w-3/4 rounded bg-[#EFECE6] animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-[#EFECE6] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#6E675E]">
                Không tìm thấy món ăn nào phù hợp với bộ lọc hiện tại.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col rounded-xl border border-[#E6E2DC] bg-white overflow-hidden transition-colors hover:border-[#C2572B]/40"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden border-b border-[#EFECE6]">
                      <DishImage
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-[#6E675E]">
                          <span>
                            {MENU_CATEGORY_LABELS[item.category]}
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono">{item.sku}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            className={`font-semibold hover:underline underline-offset-2 cursor-pointer whitespace-nowrap ${STATUS_COLOR[item.status]}`}
                          >
                            {MENU_STATUS_LABELS[item.status]}
                          </button>
                        </div>

                        <h2 className="font-display text-base font-semibold text-[#1F1D1A] leading-snug">
                          {item.name}
                        </h2>

                        <p className="text-xs text-[#5E5850] leading-relaxed line-clamp-2">
                          {item.description || 'Chưa có mô tả chi tiết cho món ăn này.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#EFECE6] flex items-center justify-between gap-2">
                        <div>
                          <p className="font-display text-base font-bold text-[#9A3D18] tabular-nums">
                            {formatVnd(item.priceVnd)}
                          </p>
                          <p className="text-[11px] text-[#7A7268]">
                            {item.unit} · {item.preparationMinutes} phút
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            aria-label={`Sửa món ${item.name}`}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#DCD7CE] bg-white px-2.5 text-xs font-medium text-[#1F1D1A] transition-colors hover:border-[#C2572B]/50 hover:bg-[#FDF5F1] hover:text-[#9A3D18] cursor-pointer whitespace-nowrap"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            aria-label={`Xóa món ${item.name}`}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#DCD7CE] bg-white px-2.5 text-xs font-medium text-[#5E5850] transition-colors hover:border-[#F3C5C0] hover:bg-[#FEF3F2] hover:text-[#B91C1C] cursor-pointer whitespace-nowrap"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#E6E2DC] bg-[#FAF9F7] px-5 py-3 text-xs text-[#6E675E]">
          <span className="tabular-nums">
            Hiển thị {filteredItems.length} / {items.length} món ăn
          </span>
          <span className="font-mono hidden sm:inline">
            GET / POST / PUT / PATCH / DELETE /api/menu-items
          </span>
        </div>
      </section>

      {/* Modal Thêm / Sửa món ăn */}
      <MenuItemFormModal
        open={formModalOpen}
        editingItem={editingItem}
        existingItems={items}
        submitting={submitting}
        submitError={submitError}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
      />

      {/* Hộp thoại xác nhận xóa món ăn */}
      <ConfirmDialog
        open={deletingItem !== null}
        title="Xác nhận xóa món ăn"
        description={
          deletingItem
            ? `Bạn có chắc chắn muốn xóa món "${deletingItem.name}" (${deletingItem.sku}) khỏi thực đơn? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa món ăn"
        loading={deleting}
        onCancel={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
