import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  Employee,
  EmployeeStatus,
  UpsertEmployeeRequest,
  UserRole,
} from '../../types';
import {
  EMPLOYEE_STATUS_LABELS,
  hasValidationErrors,
  ROLE_LABELS,
  validateEmployeeForm,
  ValidationErrors,
} from '../../utils';
import { Modal } from '../common/Modal';

interface EmployeeFormModalProps {
  open: boolean;
  editingEmployee: Employee | null;
  existingEmployees: Employee[];
  submitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (payload: UpsertEmployeeRequest) => Promise<void>;
}

const DEFAULT_SHIFTS = [
  'Ca hành chính (08:30 - 17:30)',
  'Ca sáng (09:00 - 16:00)',
  'Ca chiều (15:00 - 22:30)',
  'Ca gãy (09:00 - 14:00 & 17:00 - 21:30)',
];

function suggestNextEmployeeCode(employees: Employee[]): string {
  const maxNum = employees.reduce((max, emp) => {
    const match = emp.employeeCode.match(/(\d+)$/);
    const num = match ? Number(match[1]) : 0;
    return Math.max(max, num);
  }, 0);
  return `NV-${String(maxNum + 1).padStart(3, '0')}`;
}

function buildInitialState(
  editingEmployee: Employee | null,
  existingEmployees: Employee[]
): UpsertEmployeeRequest {
  if (editingEmployee) {
    return {
      employeeCode: editingEmployee.employeeCode,
      fullName: editingEmployee.fullName,
      role: editingEmployee.role,
      positionTitle: editingEmployee.positionTitle,
      phone: editingEmployee.phone,
      email: editingEmployee.email,
      shift: editingEmployee.shift,
      baseSalaryVnd: editingEmployee.baseSalaryVnd,
      hireDate: editingEmployee.hireDate,
      status: editingEmployee.status,
    };
  }

  return {
    employeeCode: suggestNextEmployeeCode(existingEmployees),
    fullName: '',
    role: UserRole.STAFF,
    positionTitle: 'Nhân viên phục vụ',
    phone: '',
    email: '',
    shift: DEFAULT_SHIFTS[1],
    baseSalaryVnd: 9_000_000,
    hireDate: '2026-11-20',
    status: EmployeeStatus.ACTIVE,
  };
}

export function EmployeeFormModal({
  open,
  editingEmployee,
  existingEmployees,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: EmployeeFormModalProps) {
  const [form, setForm] = useState<UpsertEmployeeRequest>(() =>
    buildInitialState(editingEmployee, existingEmployees)
  );
  const [errors, setErrors] = useState<ValidationErrors<UpsertEmployeeRequest>>(
    {}
  );

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(editingEmployee, existingEmployees));
      setErrors({});
    }
  }, [open, editingEmployee, existingEmployees]);

  function updateField<K extends keyof UpsertEmployeeRequest>(
    key: K,
    value: UpsertEmployeeRequest[K]
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
    const otherCodes = existingEmployees
      .filter((emp) => emp.id !== editingEmployee?.id)
      .map((emp) => emp.employeeCode);

    const validationErrors = validateEmployeeForm(form, otherCodes);
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
      title={editingEmployee ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
      subtitle={
        editingEmployee
          ? `Chỉnh sửa hồ sơ nhân sự ${editingEmployee.employeeCode} (PUT /api/employees/${editingEmployee.id})`
          : 'Nhập đầy đủ thông tin nhân sự để tạo hồ sơ mới (POST /api/employees)'
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
            form="employee-upsert-form"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            <span>{editingEmployee ? 'Lưu thay đổi' : 'Thêm nhân viên'}</span>
          </button>
        </>
      }
    >
      <form
        id="employee-upsert-form"
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
              htmlFor="emp-code"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Mã nhân viên <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="emp-code"
              type="text"
              value={form.employeeCode}
              onChange={(e) => updateField('employeeCode', e.target.value)}
              placeholder="Ví dụ: NV-007"
              className={`${inputBaseClass} font-mono ${
                errors.employeeCode
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#DCD7CE] focus:border-[#C2572B]'
              }`}
            />
            {errors.employeeCode && (
              <p className="text-xs text-[#B42318]">{errors.employeeCode}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="emp-fullname"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Họ và tên <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="emp-fullname"
              type="text"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn Hùng"
              className={`${inputBaseClass} ${
                errors.fullName
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#DCD7CE] focus:border-[#C2572B]'
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-[#B42318]">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="emp-role"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Vai trò hệ thống <span className="text-[#B91C1C]">*</span>
            </label>
            <select
              id="emp-role"
              value={form.role}
              onChange={(e) => updateField('role', e.target.value as UserRole)}
              className={`${inputBaseClass} border-[#DCD7CE] focus:border-[#C2572B]`}
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]} ({role})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="emp-position"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Chức danh <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="emp-position"
              type="text"
              value={form.positionTitle}
              onChange={(e) => updateField('positionTitle', e.target.value)}
              placeholder="Ví dụ: Thu ngân, Phụ bếp"
              className={`${inputBaseClass} ${
                errors.positionTitle
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#DCD7CE] focus:border-[#C2572B]'
              }`}
            />
            {errors.positionTitle && (
              <p className="text-xs text-[#B42318]">{errors.positionTitle}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="emp-phone"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Số điện thoại <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="emp-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Ví dụ: 0912345678"
              className={`${inputBaseClass} tabular-nums ${
                errors.phone
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#DCD7CE] focus:border-[#C2572B]'
              }`}
            />
            {errors.phone && (
              <p className="text-xs text-[#B42318]">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="emp-email"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Email <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="emp-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="hung.nguyen@bepviet.vn"
              className={`${inputBaseClass} ${
                errors.email
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#DCD7CE] focus:border-[#C2572B]'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-[#B42318]">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="emp-shift"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Ca làm việc
            </label>
            <select
              id="emp-shift"
              value={form.shift}
              onChange={(e) => updateField('shift', e.target.value)}
              className={`${inputBaseClass} border-[#DCD7CE] focus:border-[#C2572B]`}
            >
              {DEFAULT_SHIFTS.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="emp-status"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Trạng thái hoạt động
            </label>
            <select
              id="emp-status"
              value={form.status}
              onChange={(e) =>
                updateField('status', e.target.value as EmployeeStatus)
              }
              className={`${inputBaseClass} border-[#DCD7CE] focus:border-[#C2572B]`}
            >
              {Object.values(EmployeeStatus).map((status) => (
                <option key={status} value={status}>
                  {EMPLOYEE_STATUS_LABELS[status]} ({status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="emp-salary"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Lương cơ bản (VNĐ) <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="emp-salary"
              type="number"
              min={1000000}
              step={100000}
              value={form.baseSalaryVnd || ''}
              onChange={(e) =>
                updateField('baseSalaryVnd', Number(e.target.value))
              }
              className={`${inputBaseClass} tabular-nums ${
                errors.baseSalaryVnd
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#DCD7CE] focus:border-[#C2572B]'
              }`}
            />
            {errors.baseSalaryVnd && (
              <p className="text-xs text-[#B42318]">{errors.baseSalaryVnd}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="emp-hiredate"
              className="block text-sm font-medium text-[#1F1D1A]"
            >
              Ngày vào làm
            </label>
            <input
              id="emp-hiredate"
              type="date"
              value={form.hireDate}
              onChange={(e) => updateField('hireDate', e.target.value)}
              className={`${inputBaseClass} tabular-nums border-[#DCD7CE] focus:border-[#C2572B]`}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
