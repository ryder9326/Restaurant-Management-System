import { UpsertEmployeeRequest, UpsertMenuItemRequest } from '../types';

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VN_PHONE_REGEX = /^0\d{9,10}$/;

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[\s.-]/g, '');
}

export function validateEmployeeForm(
  input: UpsertEmployeeRequest,
  existingCodes: string[] = []
): ValidationErrors<UpsertEmployeeRequest> {
  const errors: ValidationErrors<UpsertEmployeeRequest> = {};

  const code = input.employeeCode.trim().toUpperCase();
  if (!code) {
    errors.employeeCode = 'Vui lòng nhập mã nhân viên.';
  } else if (existingCodes.map((c) => c.toUpperCase()).includes(code)) {
    errors.employeeCode = 'Mã nhân viên này đã tồn tại trên hệ thống.';
  }

  if (!input.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên nhân viên.';
  } else if (input.fullName.trim().length < 2) {
    errors.fullName = 'Họ và tên cần tối thiểu 2 ký tự.';
  }

  const digits = normalizePhoneDigits(input.phone);
  if (!digits) {
    errors.phone = 'Vui lòng nhập số điện thoại.';
  } else if (!VN_PHONE_REGEX.test(digits)) {
    errors.phone = 'Số điện thoại không hợp lệ (gồm 10–11 chữ số, bắt đầu bằng 0).';
  }

  if (!input.email.trim()) {
    errors.email = 'Vui lòng nhập địa chỉ email.';
  } else if (!EMAIL_REGEX.test(input.email.trim())) {
    errors.email = 'Định dạng email không hợp lệ.';
  }

  if (!input.positionTitle.trim()) {
    errors.positionTitle = 'Vui lòng nhập chức danh công việc.';
  }

  if (!Number.isFinite(input.baseSalaryVnd) || input.baseSalaryVnd <= 0) {
    errors.baseSalaryVnd = 'Lương cơ bản phải lớn hơn 0 ₫.';
  }

  return errors;
}

export function validateMenuItemForm(
  input: UpsertMenuItemRequest,
  existingSkus: string[] = []
): ValidationErrors<UpsertMenuItemRequest> {
  const errors: ValidationErrors<UpsertMenuItemRequest> = {};

  const sku = input.sku.trim().toUpperCase();
  if (!sku) {
    errors.sku = 'Vui lòng nhập mã món.';
  } else if (existingSkus.map((s) => s.toUpperCase()).includes(sku)) {
    errors.sku = 'Mã món này đã tồn tại trong thực đơn.';
  }

  if (!input.name.trim()) {
    errors.name = 'Vui lòng nhập tên món ăn.';
  } else if (input.name.trim().length < 2) {
    errors.name = 'Tên món ăn cần tối thiểu 2 ký tự.';
  }

  if (!Number.isFinite(input.priceVnd) || input.priceVnd < 1000) {
    errors.priceVnd = 'Giá tiền phải từ 1.000 ₫ trở lên.';
  }

  if (!input.unit.trim()) {
    errors.unit = 'Vui lòng nhập đơn vị tính (Ví dụ: Đĩa, Phần, Ly).';
  }

  if (
    !Number.isFinite(input.preparationMinutes) ||
    input.preparationMinutes < 1 ||
    input.preparationMinutes > 180
  ) {
    errors.preparationMinutes = 'Thời gian chế biến hợp lệ từ 1 đến 180 phút.';
  }

  return errors;
}

export function hasValidationErrors<T>(errors: ValidationErrors<T>): boolean {
  return Object.keys(errors).length > 0;
}
