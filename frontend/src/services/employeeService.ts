import { MOCK_EMPLOYEES } from '../mocks';
import { ApiResponse, Employee, UpsertEmployeeRequest } from '../types';
import { normalizePhoneDigits } from '../utils';
import { cloneData, createApiResponse, simulateLatency } from './apiConfig';

let employeeStore: Employee[] = cloneData(MOCK_EMPLOYEES);

/**
 * GET /api/employees
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<Employee[]>>('/employees');
 * return res.data;
 */
export async function getEmployees(): Promise<ApiResponse<Employee[]>> {
  await simulateLatency();
  return createApiResponse(cloneData(employeeStore));
}

/**
 * GET /api/employees/{id}
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
 * return res.data;
 */
export async function getEmployeeById(id: number): Promise<ApiResponse<Employee>> {
  await simulateLatency();
  const employee = employeeStore.find((item) => item.id === id);
  if (!employee) {
    throw new Error(`Không tìm thấy nhân viên mã #${id}.`);
  }
  return createApiResponse(cloneData(employee));
}

/**
 * POST /api/employees
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.post<ApiResponse<Employee>>('/employees', payload);
 * return res.data;
 */
export async function createEmployee(
  payload: UpsertEmployeeRequest
): Promise<ApiResponse<Employee>> {
  await simulateLatency();

  const normalizedCode = payload.employeeCode.trim().toUpperCase();
  if (
    employeeStore.some(
      (emp) => emp.employeeCode.toUpperCase() === normalizedCode
    )
  ) {
    throw new Error(`Mã nhân viên ${normalizedCode} đã tồn tại.`);
  }

  const nextId = Math.max(100, ...employeeStore.map((emp) => emp.id)) + 1;
  const created: Employee = {
    id: nextId,
    employeeCode: normalizedCode,
    fullName: payload.fullName.trim(),
    role: payload.role,
    positionTitle: payload.positionTitle.trim(),
    phone: normalizePhoneDigits(payload.phone),
    email: payload.email.trim().toLowerCase(),
    shift: payload.shift.trim() || 'Ca hành chính (08:30 - 17:30)',
    baseSalaryVnd: Math.round(payload.baseSalaryVnd),
    hireDate: payload.hireDate || '2026-11-20',
    status: payload.status,
  };

  employeeStore = [created, ...employeeStore];
  return createApiResponse(cloneData(created), 'Thêm nhân viên mới thành công');
}

/**
 * PUT /api/employees/{id}
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, payload);
 * return res.data;
 */
export async function updateEmployee(
  id: number,
  payload: UpsertEmployeeRequest
): Promise<ApiResponse<Employee>> {
  await simulateLatency();

  const index = employeeStore.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Không tìm thấy nhân viên mã #${id}.`);
  }

  const normalizedCode = payload.employeeCode.trim().toUpperCase();
  const duplicate = employeeStore.some(
    (emp) =>
      emp.id !== id && emp.employeeCode.toUpperCase() === normalizedCode
  );
  if (duplicate) {
    throw new Error(`Mã nhân viên ${normalizedCode} đã được sử dụng.`);
  }

  const updated: Employee = {
    ...employeeStore[index],
    employeeCode: normalizedCode,
    fullName: payload.fullName.trim(),
    role: payload.role,
    positionTitle: payload.positionTitle.trim(),
    phone: normalizePhoneDigits(payload.phone),
    email: payload.email.trim().toLowerCase(),
    shift: payload.shift.trim(),
    baseSalaryVnd: Math.round(payload.baseSalaryVnd),
    hireDate: payload.hireDate,
    status: payload.status,
  };

  employeeStore[index] = updated;
  return createApiResponse(cloneData(updated), 'Cập nhật hồ sơ nhân viên thành công');
}

/**
 * DELETE /api/employees/{id}
 * Thay thế khi nối Java Backend:
 * await apiClient.delete(`/employees/${id}`);
 */
export async function deleteEmployee(id: number): Promise<ApiResponse<null>> {
  await simulateLatency();
  const exists = employeeStore.some((item) => item.id === id);
  if (!exists) {
    throw new Error(`Không tìm thấy nhân viên mã #${id}.`);
  }
  employeeStore = employeeStore.filter((item) => item.id !== id);
  return createApiResponse(null, 'Đã xóa nhân viên khỏi danh sách');
}
