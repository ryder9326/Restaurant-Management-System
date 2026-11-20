import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { DISH_IMAGE_OPTIONS } from '../../mocks';
import {
  MenuCategory,
  MenuItem,
  MenuItemStatus,
  UpsertMenuItemRequest,
} from '../../types';
import {
  hasValidationErrors,
  MENU_CATEGORY_LABELS,
  MENU_STATUS_LABELS,
  validateMenuItemForm,
  ValidationErrors,
} from '../../utils';
import { DishImage } from '../common/DishImage';
import { Modal } from '../common/Modal';

interface MenuItemFormModalProps {
  open: boolean;
  editingItem: MenuItem | null;
  existingItems: MenuItem[];
  submitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (payload: UpsertMenuItemRequest) => Promise<void>;
}

const PRIMARY_MENU_CATEGORIES: MenuCategory[] = [
  MenuCategory.APPETIZER,
  MenuCategory.MAIN_COURSE,
  MenuCategory.DRINK,
  MenuCategory.DESSERT,
];

const SELECTABLE_STATUSES: MenuItemStatus[] = [
  MenuItemStatus.AVAILABLE,
  MenuItemStatus.OUT_OF_STOCK,
];

function suggestNextSku(items: MenuItem[], category: MenuCategory): string {
  const prefixMap: Record<MenuCategory, string> = {
    [MenuCategory.APPETIZER]: 'KV',
    [MenuCategory.MAIN_COURSE]: 'MC',
    [MenuCategory.SOUP_HOTPOT]: 'MC',
    [MenuCategory.DRINK]: 'DU',
    [MenuCategory.DESSERT]: 'TM',
  };
  const prefix = prefixMap[category];
  const maxNum = items
    .filter((item) => item.sku.startsWith(`${prefix}-`))
    .reduce((max, item) => {
      const match = item.sku.match(/(\d+)$/);
      return Math.max(max, match ? Number(match[1]) : 0);
    }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(2, '0')}`;
}

function buildInitialState(
  editingItem: MenuItem | null,
  existingItems: MenuItem[]
): UpsertMenuItemRequest {
  if (editingItem) {
    return {
      sku: editingItem.sku,
      name: editingItem.name,
      description: editingItem.description,
      category: editingItem.category,
      priceVnd: editingItem.priceVnd,
      unit: editingItem.unit,
      preparationMinutes: editingItem.preparationMinutes,
      status: editingItem.status,
      imageUrl: editingItem.imageUrl ?? '',
    };
  }

  return {
    sku: suggestNextSku(existingItems, MenuCategory.MAIN_COURSE),
    name: '',
    description: '',
    category: MenuCategory.MAIN_COURSE,
    priceVnd: 95_000,
    unit: 'Đĩa',
    preparationMinutes: 15,
    status: MenuItemStatus.AVAILABLE,
    imageUrl: DISH_IMAGE_OPTIONS[1].url,
  };
}

export function MenuItemFormModal({
  open,
  editingItem,
  existingItems,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: MenuItemFormModalProps) {
  const [form, setForm] = useState<UpsertMenuItemRequest>(() =>
    buildInitialState(editingItem, existingItems)
  );
  const [errors, setErrors] = useState<ValidationErrors<UpsertMenuItemRequest>>(
    {}
  );

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(editingItem, existingItems));
      setErrors({});
    }
  }, [open, editingItem, existingItems]);

  function updateField<K extends keyof UpsertMenuItemRequest>(
    key: K,
    value: UpsertMenuItemRequest[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const otherSkus = existingItems
      .filter((item) => item.id !== editingItem?.id)
      .map((item) => item.sku);

    const validationErrors = validateMenuItemForm(form, otherSkus);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit(form);
  }

  const inputBaseClass =
    'h-10 w-full rounded-lg border bg-[#FAF9F7] px-3 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20';

  return (
    <Modal
      open={open}
      title={editingItem ? 'Cập nhật thông tin món ăn' : 'Thêm món ăn mới'}
      subtitle={
        editingItem
          ? `Chỉnh sửa món ${editingItem.sku} (PUT /api/menu-items/${editingItem.id})`
          : 'Khai báo thông tin món ăn mới vào thực đơn (POST /api/menu-items)'
      }
      onClose={submitting ? () => undefined : onClose}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#DCD7CE] bg-white px-4 text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#F2EFEA] focus-visible:outline-2 focus-visible:outline-[#C2572B] disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="menu-item-upsert-form"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            <span>{editingItem ? 'Lưu thay đổi' : 'Thêm món ăn'}</span>
          </button>
        </>
      }
    >
      <form
        id="menu-item-upsert-form"
        onSubmit={handleFormSubmit}
        noValidate
        className="space-y-4"
      >
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-[#F3C5C0] bg-[#FEF3F2] px-3.5 py-3 text-sm text-[#B42318]"
          >
            <AlertCircle
              className="h-4 w-4 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="dish-sku"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Mã món <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="dish-sku"
              type="text"
              value={form.sku}
              onChange={(e) => updateField('sku', e.target.value)}
              placeholder="Ví dụ: MC-07"
              className={`${inputBaseClass} font-mono ${
                errors.sku
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#DCD7CE] focus:border-[#C2572B]'
              }`}
            />
            {errors.sku && (
              <p className="text-xs text-[#B42318]">{errors.sku}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="dish-name"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Tên món ăn <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="dish-name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ví dụ: Gà nướng mật ong lá chanh"
              className={`${inputBaseClass} ${
                errors.name
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#DCD7CE] focus:border-[#C2572B]'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-[#B42318]">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="dish-category"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Danh mục <span className="text-[#B91C1C]">*</span>
            </label>
            <select
              id="dish-category"
              value={form.category}
              onChange={(e) => {
                const nextCategory = e.target.value as MenuCategory;
                updateField('category', nextCategory);
                if (!editingItem) {
                  updateField('sku', suggestNextSku(existingItems, nextCategory));
                }
              }}
              className={`${inputBaseClass} border-[#DCD7CE] focus:border-[#C2572B]`}
            >
              {PRIMARY_MENU_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {MENU_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="dish-status"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Trạng thái kho bếp
            </label>
            <select
              id="dish-status"
              value={form.status}
              onChange={(e) =>
                updateField('status', e.target.value as MenuItemStatus)
              }
              className={`${inputBaseClass} border-[#DCD7CE] focus:border-[#C2572B]`}
            >
              {SELECTABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {MENU_STATUS_LABELS[status]} ({status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="dish-price"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Giá tiền (VNĐ) <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="dish-price"
              type="number"
              min={1000}
              step={1000}
              value={form.priceVnd || ''}
              onChange={(e) => updateField('priceVnd', Number(e.target.value))}
              className={`${inputBaseClass} tabular-nums ${
                errors.priceVnd
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#DCD7CE] focus:border-[#C2572B]'
              }`}
            />
            {errors.priceVnd && (
              <p className="text-xs text-[#B42318]">{errors.priceVnd}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="dish-unit"
                className="block text-sm font-medium text-[#1F1D1A]"
              >
                Đơn vị <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="dish-unit"
                type="text"
                value={form.unit}
                onChange={(e) => updateField('unit', e.target.value)}
                placeholder="Đĩa, Phần, Ly"
                className={`${inputBaseClass} ${
                  errors.unit
                    ? 'border-[#D92D20] focus:border-[#D92D20]'
                    : 'border-[#DCD7CE] focus:border-[#C2572B]'
                }`}
              />
              {errors.unit && (
                <p className="text-xs text-[#B42318]">{errors.unit}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="dish-prep"
                className="block text-sm font-medium text-[#1F1D1A]"
              >
                Chế biến (phút)
              </label>
              <input
                id="dish-prep"
                type="number"
                min={1}
                max={180}
                value={form.preparationMinutes || ''}
                onChange={(e) =>
                  updateField('preparationMinutes', Number(e.target.value))
                }
                className={`${inputBaseClass} tabular-nums ${
                  errors.preparationMinutes
                    ? 'border-[#D92D20] focus:border-[#D92D20]'
                    : 'border-[#DCD7CE] focus:border-[#C2572B]'
                }`}
              />
              {errors.preparationMinutes && (
                <p className="text-xs text-[#B42318]">
                  {errors.preparationMinutes}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="dish-description"
            className="block text-sm font-medium text-[#1F1D1A]"
          >
            Mô tả món ăn
          </label>
          <textarea
            id="dish-description"
            rows={2}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Thành phần chính, hương vị hoặc lưu ý phục vụ..."
            className="w-full rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] p-3 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] transition-colors focus:border-[#C2572B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
          />
        </div>

        {/* Chọn ảnh món ăn từ thư viện có sẵn hoặc URL */}
        <div className="space-y-2.5 pt-2 border-t border-[#E6E2DC]">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="dish-image-url"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Ảnh món ăn
            </label>
            <span className="text-xs text-[#6E675E]">
              Chọn nhanh từ thư viện hoặc nhập đường dẫn ảnh
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
            <div className="sm:col-span-4 aspect-[4/3] overflow-hidden rounded-lg border border-[#E6E2DC]">
              <DishImage
                src={form.imageUrl}
                alt={form.name || 'Xem trước ảnh món ăn'}
                className="h-full w-full"
              />
            </div>

            <div className="sm:col-span-8 space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                {DISH_IMAGE_OPTIONS.map((option) => {
                  const selected = form.imageUrl === option.url;
                  return (
                    <button
                      key={option.url}
                      type="button"
                      onClick={() => updateField('imageUrl', option.url)}
                      className={`group overflow-hidden rounded-lg border text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C2572B] ${
                        selected
                          ? 'border-[#C2572B] ring-2 ring-[#C2572B]/25'
                          : 'border-[#E6E2DC] hover:border-[#C2572B]/50'
                      }`}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden">
                        <DishImage
                          src={option.url}
                          alt={option.label}
                          className="h-full w-full"
                        />
                      </div>
                      <p className="truncate px-1.5 py-1 text-[11px] font-medium text-[#4A453E] bg-white">
                        {option.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <input
                id="dish-image-url"
                type="text"
                value={form.imageUrl ?? ''}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                placeholder="/src/assets/images/..."
                className={`${inputBaseClass} font-mono text-xs border-[#DCD7CE] focus:border-[#C2572B]`}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
