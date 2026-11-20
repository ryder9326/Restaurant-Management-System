import {
  DiscountStatus,
  EmployeeStatus,
  InvoiceStatus,
  MenuCategory,
  MenuItemStatus,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  TableArea,
  TableStatus,
  UserRole,
} from '../types';

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatVnd(amount: number): string {
  return vndFormatter.format(Math.round(amount));
}

export function formatDateTimeVi(isoString?: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatShortDateVi(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

export function formatFullDateVi(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.MANAGER]: 'Quản lý',
  [UserRole.STAFF]: 'Nhân viên',
  [UserRole.CHEF]: 'Nhân viên bếp',
};

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  [TableStatus.AVAILABLE]: 'Bàn trống',
  [TableStatus.OCCUPIED]: 'Đang phục vụ',
  [TableStatus.RESERVED]: 'Đã đặt trước',
  [TableStatus.CLEANING]: 'Đang dọn dẹp',
};

export const TABLE_AREA_LABELS: Record<TableArea, string> = {
  [TableArea.FLOOR_1]: 'Tầng 1',
  [TableArea.FLOOR_2]: 'Tầng 2',
  [TableArea.VIP_ROOM]: 'Phòng VIP',
  [TableArea.OUTDOOR]: 'Sân vườn',
};

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  [MenuCategory.APPETIZER]: 'Khai vị',
  [MenuCategory.MAIN_COURSE]: 'Món chính',
  [MenuCategory.SOUP_HOTPOT]: 'Canh & Lẩu',
  [MenuCategory.DRINK]: 'Đồ uống',
  [MenuCategory.DESSERT]: 'Tráng miệng',
};

export const MENU_STATUS_LABELS: Record<MenuItemStatus, string> = {
  [MenuItemStatus.AVAILABLE]: 'Còn hàng',
  [MenuItemStatus.OUT_OF_STOCK]: 'Hết nguyên liệu',
  [MenuItemStatus.DISCONTINUED]: 'Ngừng bán',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ xác nhận',
  [OrderStatus.COOKING]: 'Đang chế biến',
  [OrderStatus.COMPLETED]: 'Hoàn tất bếp',
  [OrderStatus.SERVED]: 'Đã lên đủ món',
  [OrderStatus.CANCELLED]: 'Đã hủy',
};

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  [OrderItemStatus.PENDING]: 'Chờ bếp',
  [OrderItemStatus.COOKING]: 'Đang nấu',
  [OrderItemStatus.COMPLETED]: 'Hoàn tất',
  [OrderItemStatus.CANCELLED]: 'Đã hủy',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.UNPAID]: 'Chưa thanh toán',
  [InvoiceStatus.PAID]: 'Đã thanh toán',
  [InvoiceStatus.REFUNDED]: 'Đã hoàn tiền',
  [InvoiceStatus.CANCELLED]: 'Đã hủy',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Tiền mặt',
  [PaymentMethod.BANK_TRANSFER]: 'Chuyển khoản QR',
  [PaymentMethod.CARD]: 'Thẻ ngân hàng',
  [PaymentMethod.E_WALLET]: 'Ví điện tử',
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  [EmployeeStatus.ACTIVE]: 'Đang làm việc',
  [EmployeeStatus.ON_LEAVE]: 'Nghỉ phép',
  [EmployeeStatus.INACTIVE]: 'Đã nghỉ việc',
};

export const DISCOUNT_STATUS_LABELS: Record<DiscountStatus, string> = {
  [DiscountStatus.ACTIVE]: 'Đang áp dụng',
  [DiscountStatus.EXPIRED]: 'Hết hạn',
  [DiscountStatus.DISABLED]: 'Tạm ngưng',
};
