import { NavItemConfig, PageKey, UserRole } from '../types';

export const NAVIGATION_ITEMS: NavItemConfig[] = [
  {
    key: 'dashboard',
    label: 'Thống kê doanh thu',
    shortDescription: 'Báo cáo doanh thu, tỉ trọng danh mục món và xuất báo cáo CSV / PDF.',
    section: 'Vận hành',
    allowedRoles: [UserRole.MANAGER],
  },
  {
    key: 'tables',
    label: 'Sơ đồ bàn',
    shortDescription: 'Theo dõi trạng thái bàn trống, đang phục vụ và lịch đặt bàn theo khu vực.',
    section: 'Vận hành',
    allowedRoles: [UserRole.MANAGER, UserRole.STAFF],
  },
  {
    key: 'orders',
    label: 'Đơn gọi món',
    shortDescription: 'Tạo đơn gọi món tại bàn, thêm ghi chú bếp và theo dõi tiến độ phục vụ.',
    section: 'Vận hành',
    allowedRoles: [UserRole.MANAGER, UserRole.STAFF],
  },
  {
    key: 'kitchen',
    label: 'Điều phối bếp',
    shortDescription: 'Hàng đợi chế biến theo thời gian thực dành cho khu vực bếp.',
    section: 'Vận hành',
    allowedRoles: [UserRole.MANAGER, UserRole.CHEF],
  },
  {
    key: 'menu',
    label: 'Thực đơn',
    shortDescription: 'Quản lý danh mục món ăn, đơn giá VNĐ và trạng thái còn món / tạm hết.',
    section: 'Quản trị',
    allowedRoles: [UserRole.MANAGER, UserRole.STAFF, UserRole.CHEF],
  },
  {
    key: 'invoices',
    label: 'Hóa đơn & Thanh toán',
    shortDescription: 'Tính tiền, áp dụng mã giảm giá, VAT và ghi nhận phương thức thanh toán.',
    section: 'Quản trị',
    allowedRoles: [UserRole.MANAGER, UserRole.STAFF],
  },
  {
    key: 'discounts',
    label: 'Mã giảm giá',
    shortDescription: 'Thiết lập và kiểm tra hiệu lực các chương trình khuyến mãi nhà hàng.',
    section: 'Quản trị',
    allowedRoles: [UserRole.MANAGER, UserRole.STAFF],
  },
  {
    key: 'employees',
    label: 'Nhân viên',
    shortDescription: 'Quản lý danh sách nhân viên, phân quyền vai trò và trạng thái hoạt động.',
    section: 'Quản trị',
    allowedRoles: [UserRole.MANAGER],
  },
];

export function getMenuItemsForRole(role: UserRole): NavItemConfig[] {
  return NAVIGATION_ITEMS.filter((item) => item.allowedRoles.includes(role));
}

export function canAccessPage(role: UserRole, pageKey: PageKey): boolean {
  const item = NAVIGATION_ITEMS.find((entry) => entry.key === pageKey);
  return Boolean(item && item.allowedRoles.includes(role));
}

export function getDefaultPageForRole(role: UserRole): PageKey {
  switch (role) {
    case UserRole.MANAGER:
      return 'dashboard';
    case UserRole.STAFF:
      return 'tables';
    case UserRole.CHEF:
      return 'kitchen';
  }
}

export function getNavItemByKey(pageKey: PageKey): NavItemConfig {
  const found = NAVIGATION_ITEMS.find((entry) => entry.key === pageKey);
  return found ?? NAVIGATION_ITEMS[0];
}
