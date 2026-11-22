import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { UserAvatar } from '../components/common/UserAvatar';
import { EmployeeFormModal } from '../components/employees/EmployeeFormModal';
import { useAsyncData } from '../hooks/useAsyncData';
import { employeeService } from '../services';
import {
  Employee,
  EmployeeStatus,
  UpsertEmployeeRequest,
  UserRole,
} from '../types';
import {
  EMPLOYEE_STATUS_LABELS,
  formatVnd,
  ROLE_LABELS,
} from '../utils';

type RoleFilter = 'ALL' | UserRole;

const ROLE_FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả vai trò' },
  { value: UserRole.MANAGER, label: ROLE_LABELS[UserRole.MANAGER] },
  { value: UserRole.STAFF, label: ROLE_LABELS[UserRole.STAFF] },
  { value: UserRole.CHEF, label: ROLE_LABELS[UserRole.CHEF] },
];

const STATUS_TEXT_COLOR: Record<EmployeeStatus, string> = {
  [EmployeeStatus.ACTIVE]: 'text-[#15803D]',
  [EmployeeStatus.ON_LEAVE]: 'text-[#B45309]',
  [EmployeeStatus.INACTIVE]: 'text-[#6E675E]',
};

export function EmployeesPage() {
  const fetchEmployees = useCallback(async () => {
    const res = await employeeService.getEmployees();
    return res.data;
  }, []);

  const {
    data: employees,
    loading,
    error,
    reload,
  } = useAsyncData<Employee[]>(fetchEmployees, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return employees.filter((emp) => {
      if (emp.status === EmployeeStatus.INACTIVE) return false;
      if (roleFilter !== 'ALL' && emp.role !== roleFilter) {
        return false;
      }
      if (!normalizedSearch) return true;
      return (
        emp.employeeCode.toLowerCase().includes(normalizedSearch) ||
        emp.fullName.toLowerCase().includes(normalizedSearch) ||
        emp.phone.toLowerCase().includes(normalizedSearch) ||
        emp.email.toLowerCase().includes(normalizedSearch) ||
        emp.positionTitle.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [employees, roleFilter, searchQuery]);

  const activeCount = employees.filter(
    (emp) => emp.status === EmployeeStatus.ACTIVE
  ).length;
  const onLeaveCount = employees.filter(
    (emp) => emp.status === EmployeeStatus.ON_LEAVE
  ).length;
  const totalPayrollVnd = employees
    .filter((emp) => emp.status !== EmployeeStatus.INACTIVE)
    .reduce((sum, emp) => sum + emp.baseSalaryVnd, 0);

  function showNotice(message: string) {
    setFeedback(message);
  }

  function openCreateModal() {
    setEditingEmployee(null);
    setSubmitError(null);
    setFormModalOpen(true);
  }

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);
    setSubmitError(null);
    setFormModalOpen(true);
  }

  async function handleSaveEmployee(payload: UpsertEmployeeRequest) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingEmployee) {
        const res = await employeeService.updateEmployee(
          editingEmployee.id,
          payload
        );
        showNotice(res.message);
      } else {
        const res = await employeeService.createEmployee(payload);
        showNotice(res.message);
      }
      setFormModalOpen(false);
      setEditingEmployee(null);
      reload();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Không thể lưu thông tin nhân viên.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingEmployee) return;
    setDeleting(true);
    try {
      const res = await employeeService.deleteEmployee(deletingEmployee.id);
      setDeletingEmployee(null);
      showNotice(res.message);
      reload();
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Không thể xóa nhân viên.'
      );
      setDeletingEmployee(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang và nút hành động chính */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F1D1A]">
            Quản lý nhân viên
          </h1>
          <p className="text-sm text-[#5E5850]">
            Danh sách nhân sự nhà hàng, phân quyền vai trò và trạng thái hoạt
            động theo ca làm việc.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Thêm nhân viên</span>
        </button>
      </div>

      {/* Dải chỉ số tóm tắt nhân sự */}
      <section
        aria-label="Tổng quan nhân sự"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-[#E6E2DC] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E6E2DC]"
      >
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Tổng nhân viên</p>
          <p className="font-display text-xl font-bold text-[#1F1D1A] tabular-nums">
            {loading ? '—' : employees.length}
          </p>
          <p className="text-xs text-[#7A7268]">Toàn bộ hồ sơ nhân sự</p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Đang làm việc</p>
          <p className="font-display text-xl font-bold text-[#15803D] tabular-nums">
            {loading ? '—' : activeCount}
          </p>
          <p className="text-xs text-[#7A7268]">Trạng thái ACTIVE</p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">Nghỉ phép</p>
          <p className="font-display text-xl font-bold text-[#B45309] tabular-nums">
            {loading ? '—' : onLeaveCount}
          </p>
          <p className="text-xs text-[#7A7268]">Trạng thái ON_LEAVE</p>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-[#6E675E]">
            Quỹ lương tháng (đang hoạt động)
          </p>
          <p className="font-display text-xl font-bold text-[#1F1D1A] tabular-nums">
            {loading ? '—' : formatVnd(totalPayrollVnd)}
          </p>
          <p className="text-xs text-[#7A7268]">Đơn vị VNĐ</p>
        </div>
      </section>

      {/* Thông báo kết quả thao tác */}
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

      {/* Khối danh sách nhân viên: Tìm kiếm + Lọc vai trò + Bảng dữ liệu */}
      <section className="rounded-xl border border-[#E6E2DC] bg-white overflow-hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-5 py-4 border-b border-[#E6E2DC]">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8378]"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Tìm kiếm nhân viên"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã NV, họ tên, số điện thoại, email..."
              className="h-10 w-full rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] pl-9 pr-3 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] transition-colors focus:border-[#C2572B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
            />
          </div>

          <div
            role="group"
            aria-label="Lọc theo vai trò"
            className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F2EFEA] p-1"
          >
            {ROLE_FILTER_OPTIONS.map((option) => {
              const active = roleFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRoleFilter(option.value)}
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

        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6E2DC] bg-[#FAF9F7] text-xs font-semibold text-[#5E5850]">
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Mã NV
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Họ tên
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Vai trò
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Số điện thoại
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Email
                  </th>
                  <th scope="col" className="px-5 py-3 whitespace-nowrap">
                    Trạng thái hoạt động
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
                    <tr key={idx} className="h-14">
                      {Array.from({ length: 7 }).map((__, colIdx) => (
                        <td key={colIdx} className="px-5 py-3">
                          <div className="h-4 w-24 rounded bg-[#EFECE6] animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-[#6E675E]"
                    >
                      Không tìm thấy nhân viên nào khớp với điều kiện lọc hiện
                      tại.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="transition-colors hover:bg-[#FAF9F7]"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-[#1F1D1A] whitespace-nowrap">
                        {emp.employeeCode}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <UserAvatar
                            name={emp.fullName}
                            avatarUrl={emp.avatarUrl}
                            size="sm"
                            decorative
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-[#1F1D1A] truncate">
                              {emp.fullName}
                            </p>
                            <p className="text-xs text-[#6E675E] truncate">
                              {emp.positionTitle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-[#4A453E]">
                        {ROLE_LABELS[emp.role]}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-[#4A453E] whitespace-nowrap">
                        {emp.phone}
                      </td>
                      <td className="px-5 py-3 text-[#5E5850] whitespace-nowrap">
                        {emp.email}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`font-medium ${STATUS_TEXT_COLOR[emp.status]}`}
                        >
                          {EMPLOYEE_STATUS_LABELS[emp.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            aria-label={`Sửa nhân viên ${emp.fullName}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#DCD7CE] bg-white px-2.5 text-xs font-medium text-[#1F1D1A] transition-colors hover:border-[#C2572B]/50 hover:bg-[#FDF5F1] hover:text-[#9A3D18] focus-visible:outline-2 focus-visible:outline-[#C2572B] cursor-pointer whitespace-nowrap"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEmployee(emp)}
                            aria-label={`Xóa nhân viên ${emp.fullName}`}
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

        <div className="flex items-center justify-between border-t border-[#E6E2DC] bg-[#FAF9F7] px-5 py-3 text-xs text-[#6E675E]">
          <span className="tabular-nums">
            Hiển thị {filteredEmployees.length} / {employees.length} nhân viên
          </span>
          <span className="font-mono hidden sm:inline">
            GET / POST / PUT / DELETE /api/employees
          </span>
        </div>
      </section>

      {/* Modal Thêm / Sửa nhân viên */}
      <EmployeeFormModal
        open={formModalOpen}
        editingEmployee={editingEmployee}
        existingEmployees={employees}
        submitting={submitting}
        submitError={submitError}
        onClose={() => {
          setFormModalOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleSaveEmployee}
      />

      {/* Hộp thoại xác nhận xóa */}
      <ConfirmDialog
        open={deletingEmployee !== null}
        title="Xác nhận xóa nhân viên"
        description={
          deletingEmployee
            ? `Bạn có chắc chắn muốn xóa nhân viên ${deletingEmployee.fullName} (${deletingEmployee.employeeCode}) khỏi hệ thống? Thao tác này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Xóa nhân viên"
        loading={deleting}
        onCancel={() => setDeletingEmployee(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
