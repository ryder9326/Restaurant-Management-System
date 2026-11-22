import { User, UserRole } from '../types';

const BILLING_ALLOWED_BACKEND_ROLES = new Set([
  'ADMIN',
  'MANAGER',
  'CASHIER',
]);

/**
 * Chỉ Quản trị viên, Quản lý và Thu ngân được truy cập Hóa đơn & Mã giảm giá.
 * Nhân viên phục vụ (WAITER), Lễ tân (RECEPTIONIST) và Bếp (INVENTORY_STAFF) không có quyền.
 */
export function canAccessBilling(user: User | null | undefined): boolean {
  if (!user) return false;

  if (user.backendRole) {
    const normalized = user.backendRole
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, '');
    return BILLING_ALLOWED_BACKEND_ROLES.has(normalized);
  }

  // Fallback nếu phiên cũ chưa có backendRole: chỉ Quản lý được vào
  return user.role === UserRole.MANAGER;
}