import { useMemo, useState } from 'react';
import { PackageCheck, PackageX, RotateCcw, Search } from 'lucide-react';
import { MenuItem, MenuItemStatus } from '../../types';
import { MENU_CATEGORY_LABELS } from '../../utils';

interface IngredientStatusSidebarProps {
  menuItems: MenuItem[];
  busyMenuItemId: number | null;
  onRequestOutOfStock: (item: MenuItem) => void;
  onRestoreAvailable: (item: MenuItem) => void;
}

type StockFilter = 'ALL' | 'AVAILABLE' | 'OUT_OF_STOCK';

export function IngredientStatusSidebar({
  menuItems,
  busyMenuItemId,
  onRequestOutOfStock,
  onRestoreAvailable,
}: IngredientStatusSidebarProps) {
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');

  const activeMenu = useMemo(
    () =>
      menuItems.filter((item) => item.status !== MenuItemStatus.DISCONTINUED),
    [menuItems]
  );

  const outOfStockCount = useMemo(
    () =>
      activeMenu.filter((item) => item.status === MenuItemStatus.OUT_OF_STOCK)
        .length,
    [activeMenu]
  );

  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activeMenu
      .filter((item) => {
        if (
          stockFilter === 'OUT_OF_STOCK' &&
          item.status !== MenuItemStatus.OUT_OF_STOCK
        ) {
          return false;
        }
        if (
          stockFilter === 'AVAILABLE' &&
          item.status !== MenuItemStatus.AVAILABLE
        ) {
          return false;
        }
        if (!query) return true;
        return (
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query)
        );
      })
      // Ưu tiên hiển thị các món đang hết nguyên liệu lên trên để bếp dễ theo dõi
      .sort((a, b) => {
        if (
          a.status === MenuItemStatus.OUT_OF_STOCK &&
          b.status !== MenuItemStatus.OUT_OF_STOCK
        ) {
          return -1;
        }
        if (
          a.status !== MenuItemStatus.OUT_OF_STOCK &&
          b.status === MenuItemStatus.OUT_OF_STOCK
        ) {
          return 1;
        }
        return a.name.localeCompare(b.name, 'vi');
      });
  }, [activeMenu, search, stockFilter]);

  return (
    <aside
      aria-label="Kiểm soát tình trạng nguyên liệu món ăn"
      className="rounded-xl border border-[#E6E2DC] bg-white overflow-hidden flex flex-col xl:sticky xl:top-6"
    >
      <div className="border-b border-[#E6E2DC] bg-[#FAF9F7] px-4 py-3.5 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-bold text-[#1F1D1A]">
            Báo hết nguyên liệu nhanh
          </h2>
          <span
            className={`text-xs font-bold tabular-nums whitespace-nowrap ${
              outOfStockCount > 0 ? 'text-[#B91C1C]' : 'text-[#15803D]'
            }`}
          >
            {outOfStockCount} món hết
          </span>
        </div>
        <p className="text-[11px] text-[#6E675E] leading-relaxed">
          Cập nhật trạng thái <span className="font-mono">OUT_OF_STOCK</span> sẽ
          tự động khóa món trên màn hình gọi món (POS) của Nhân viên.
        </p>
      </div>

      {/* Tìm kiếm & Lọc kho món */}
      <div className="border-b border-[#EFECE6] p-3.5 space-y-2.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8378]"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Tìm món trong kho bếp"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên món hoặc mã..."
            className="h-9 w-full rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] pl-8 pr-3 text-xs text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#C2572B] focus:bg-white focus:outline-none"
          />
        </div>

        <div
          role="group"
          aria-label="Lọc tình trạng nguyên liệu"
          className="grid grid-cols-3 gap-1 rounded-lg bg-[#F2EFEA] p-1"
        >
          {(
            [
              { value: 'ALL', label: `Tất cả (${activeMenu.length})` },
              {
                value: 'OUT_OF_STOCK',
                label: `Hết NL (${outOfStockCount})`,
              },
              {
                value: 'AVAILABLE',
                label: `Còn (${activeMenu.length - outOfStockCount})`,
              },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStockFilter(option.value)}
              className={`h-7 rounded-md px-1.5 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                stockFilter === option.value
                  ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                  : 'text-[#5E5850] hover:text-[#1F1D1A]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách món ăn nhanh */}
      <div className="divide-y divide-[#EFECE6] max-h-[540px] overflow-y-auto">
        {filteredList.length === 0 ? (
          <p className="p-6 text-center text-xs text-[#6E675E]">
            Không có món ăn phù hợp với bộ lọc.
          </p>
        ) : (
          filteredList.map((item) => {
            const isOut = item.status === MenuItemStatus.OUT_OF_STOCK;
            const isBusy = busyMenuItemId === item.id;

            return (
              <div
                key={item.id}
                data-testid={`kds-stock-${item.sku}`}
                data-stock-status={item.status}
                className={`flex items-center justify-between gap-2.5 px-4 py-3 transition-colors ${
                  isOut ? 'bg-[#FEF4F2]' : 'bg-white hover:bg-[#FAF9F7]'
                }`}
              >
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold leading-snug truncate ${
                      isOut ? 'text-[#991B1B] line-through' : 'text-[#1F1D1A]'
                    }`}
                  >
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6E675E] flex items-center gap-1.5">
                    <span>{MENU_CATEGORY_LABELS[item.category]}</span>
                    <span aria-hidden="true">·</span>
                    {isOut ? (
                      <span className="font-bold text-[#B91C1C]">
                        Hết nguyên liệu
                      </span>
                    ) : (
                      <span className="font-medium text-[#15803D] inline-flex items-center gap-0.5">
                        <PackageCheck className="h-3 w-3" aria-hidden="true" />
                        Còn hàng
                      </span>
                    )}
                  </p>
                </div>

                {isOut ? (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onRestoreAvailable(item)}
                    aria-label={`Mở bán lại món ${item.name}`}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-[#BBF7D0] bg-white px-2 text-[11px] font-semibold text-[#15803D] transition-colors hover:bg-[#F0FDF4] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>Có lại</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onRequestOutOfStock(item)}
                    aria-label={`Báo hết nguyên liệu món ${item.name}`}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-[#F3C5C0] bg-white px-2 text-[11px] font-semibold text-[#B91C1C] transition-colors hover:bg-[#B91C1C] hover:text-white disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <PackageX className="h-3 w-3" aria-hidden="true" />
                    <span>Báo hết</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-[#E6E2DC] bg-[#FAF9F7] px-4 py-2.5 text-[11px] font-mono text-[#6E675E]">
        PATCH /api/menu-items/{'{id}'}/status
      </div>
    </aside>
  );
}
