import {
  ApiResponse,
  Employee,
  EmployeeStatus,
  UpsertEmployeeRequest,
  UserRole,
} from '../types';
import { normalizePhoneDigits } from '../utils';
import { apiRequest } from './apiConfig';

type BackendWorkStatus = 'DANG_LAM_VIEC' | 'NGHI_PHEP' | 'DA_NGHI_VIEC';

interface BackendNhanVienResponse {
  maNV: string;
  hoVaTen: string;
  tuoi?: number | null;
  chucVu: string;
  ngayBatDau?: string | null;
  trangThaiLamViec: BackendWorkStatus;
  username?: string | null;
  danhSachMaQuanLy?: string[];
}

interface BackendNhanVienRequest {
  maNV: string;
  hoVaTen: string;
  tuoi?: number;
  chucVu: string;
  ngayBatDau?: string;
  trangThaiLamViec: BackendWorkStatus;
  username?: string;
  password?: string;
  maNVQuanLy?: string;
}

interface BackendPageResponse<T> {
  content?: T[];
  items?: T[];
  data?: T[];
}

interface EmployeeUiMeta {
  phone?: string;
  email?: string;
  shift?: string;
  baseSalaryVnd?: number;
  role?: UserRole;
}

const EMPLOYEE_UI_META_KEY = 'bepviet_employee_ui_meta_v1';

// Bộ nhớ ánh xạ 2 chiều giữa numeric id của FE và maNV của BE
const idToMaNvMap = new Map<number, string>();
const maNvToIdMap = new Map<string, number>();
const beCacheByMaNv = new Map<string, BackendNhanVienResponse>();

function readUiMetaMap(): Record<string, EmployeeUiMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(EMPLOYEE_UI_META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, EmployeeUiMeta>) : {};
  } catch {
    return {};
  }
}

function saveUiMeta(maNV: string, meta: EmployeeUiMeta): void {
  if (typeof window === 'undefined') return;
  const current = readUiMetaMap();
  current[maNV] = { ...current[maNV], ...meta };
  window.localStorage.setItem(EMPLOYEE_UI_META_KEY, JSON.stringify(current));
}

function getOrAssignNumericId(maNV: string): number {
  const existing = maNvToIdMap.get(maNV);
  if (existing !== undefined) return existing;

  const digits = maNV.replace(/\D/g, '');
  let candidate = digits ? Number.parseInt(digits, 10) : 0;

  if (!candidate || Number.isNaN(candidate) || idToMaNvMap.has(candidate)) {
    let hash = 1000;
    for (let i = 0; i < maNV.length; i += 1) {
      hash = (hash * 31 + maNV.charCodeAt(i)) % 100_000;
    }
    candidate = hash || 1000;
    while (idToMaNvMap.has(candidate)) {
      candidate += 1;
    }
  }

  maNvToIdMap.set(maNV, candidate);
  idToMaNvMap.set(candidate, maNV);
  return candidate;
}

function mapBeStatusToFe(status?: BackendWorkStatus): EmployeeStatus {
  switch (status) {
    case 'NGHI_PHEP':
      return EmployeeStatus.ON_LEAVE;
    case 'DA_NGHI_VIEC':
      return EmployeeStatus.INACTIVE;
    case 'DANG_LAM_VIEC':
    default:
      return EmployeeStatus.ACTIVE;
  }
}

function mapFeStatusToBe(status: EmployeeStatus): BackendWorkStatus {
  switch (status) {
    case EmployeeStatus.ON_LEAVE:
      return 'NGHI_PHEP';
    case EmployeeStatus.INACTIVE:
      return 'DA_NGHI_VIEC';
    case EmployeeStatus.ACTIVE:
    default:
      return 'DANG_LAM_VIEC';
  }
}

function inferRoleFromChucVu(chucVu?: string): UserRole {
  const normalized = (chucVu || '').toLowerCase();
  if (
    normalized.includes('quản lý') ||
    normalized.includes('admin') ||
    normalized.includes('giám đốc')
  ) {
    return UserRole.MANAGER;
  }
  if (normalized.includes('bếp')) {
    return UserRole.CHEF;
  }
  return UserRole.STAFF;
}

function mapBackendToEmployee(dto: BackendNhanVienResponse): Employee {
  beCacheByMaNv.set(dto.maNV, dto);
  const numericId = getOrAssignNumericId(dto.maNV);
  const meta = readUiMetaMap()[dto.maNV];

  return {
    id: numericId,
    employeeCode: dto.maNV,
    fullName: dto.hoVaTen,
    role: meta?.role ?? inferRoleFromChucVu(dto.chucVu),
    positionTitle: dto.chucVu || 'Nhân viên',
    phone: meta?.phone || '',
    email: meta?.email ?? '',
    shift: meta?.shift || 'Ca hành chính (08:30 - 17:30)',
    baseSalaryVnd: meta?.baseSalaryVnd ?? 8_000_000,
    hireDate: dto.ngayBatDau || new Date().toISOString().slice(0, 10),
    status: mapBeStatusToFe(dto.trangThaiLamViec),
  };
}

function extractListFromPage(
  pageData: BackendPageResponse<BackendNhanVienResponse> | BackendNhanVienResponse[]
): BackendNhanVienResponse[] {
  if (Array.isArray(pageData)) return pageData;
  return pageData?.content ?? pageData?.items ?? pageData?.data ?? [];
}

/**
 * GET /api/v1/hr/employees
 */
export async function getEmployees(): Promise<ApiResponse<Employee[]>> {
  const res = await apiRequest<
    BackendPageResponse<BackendNhanVienResponse> | BackendNhanVienResponse[]
  >('/hr/employees?page=0&size=100&sortBy=maNV', {
    method: 'GET',
  });

  const rawList = extractListFromPage(res.data);
  const employees = rawList.map(mapBackendToEmployee);

  return {
    ...res,
    data: employees,
  };
}

/**
 * GET /api/v1/hr/employees/{maNV}
 */
export async function getEmployeeById(id: number): Promise<ApiResponse<Employee>> {
  const maNV = idToMaNvMap.get(id);
  if (!maNV) {
    throw new Error(`Không tìm thấy mã nhân viên tương ứng với #${id}.`);
  }

  const res = await apiRequest<BackendNhanVienResponse>(
    `/hr/employees/${encodeURIComponent(maNV)}`,
    { method: 'GET' }
  );

  return {
    ...res,
    data: mapBackendToEmployee(res.data),
  };
}

/**
 * POST /api/v1/hr/employees
 */
export async function createEmployee(
  payload: UpsertEmployeeRequest
): Promise<ApiResponse<Employee>> {
  const maNV = payload.employeeCode.trim().toUpperCase();
  const body: BackendNhanVienRequest = {
    maNV,
    hoVaTen: payload.fullName.trim(),
    tuoi: 24,
    chucVu: payload.positionTitle.trim(),
    ngayBatDau: payload.hireDate || new Date().toISOString().slice(0, 10),
    trangThaiLamViec: mapFeStatusToBe(payload.status),
    username: maNV.toLowerCase(),
    password: 'password123',
  };

  const res = await apiRequest<BackendNhanVienResponse>('/hr/employees', {
    method: 'POST',
    body,
  });

  saveUiMeta(res.data.maNV, {
    phone: normalizePhoneDigits(payload.phone),
    email: payload.email.trim().toLowerCase(),
    shift: payload.shift.trim(),
    baseSalaryVnd: Math.round(payload.baseSalaryVnd),
    role: payload.role,
  });

  return {
    ...res,
    data: mapBackendToEmployee(res.data),
  };
}

/**
 * PUT /api/v1/hr/employees/{maNV}
 */
export async function updateEmployee(
  id: number,
  payload: UpsertEmployeeRequest
): Promise<ApiResponse<Employee>> {
  const targetMaNV =
    idToMaNvMap.get(id) || payload.employeeCode.trim().toUpperCase();
  const existingBe = beCacheByMaNv.get(targetMaNV);

  const body: BackendNhanVienRequest = {
    maNV: targetMaNV,
    hoVaTen: payload.fullName.trim(),
    tuoi: existingBe?.tuoi ?? 24,
    chucVu: payload.positionTitle.trim(),
    ngayBatDau:
      payload.hireDate ||
      existingBe?.ngayBatDau ||
      new Date().toISOString().slice(0, 10),
    trangThaiLamViec: mapFeStatusToBe(payload.status),
    username: existingBe?.username || undefined,
    // Không gửi trường password khi cập nhật để không vi phạm @Size(min = 6)
  };

  const res = await apiRequest<BackendNhanVienResponse>(
    `/hr/employees/${encodeURIComponent(targetMaNV)}`,
    {
      method: 'PUT',
      body,
    }
  );

  saveUiMeta(res.data.maNV, {
    phone: normalizePhoneDigits(payload.phone),
    email: payload.email.trim().toLowerCase(),
    shift: payload.shift.trim(),
    baseSalaryVnd: Math.round(payload.baseSalaryVnd),
    role: payload.role,
  });

  return {
    ...res,
    data: mapBackendToEmployee(res.data),
  };
}

/**
 * Xóa mềm nhân viên bằng cách chuyển trạng thái sang DA_NGHI_VIEC
 * (do Backend NhanVienController không mở endpoint DELETE để bảo toàn khóa ngoại).
 */
export async function deleteEmployee(id: number): Promise<ApiResponse<null>> {
  const maNV = idToMaNvMap.get(id);
  if (!maNV) {
    throw new Error(`Không tìm thấy nhân viên mã #${id}.`);
  }

  let existingBe = beCacheByMaNv.get(maNV);
  if (!existingBe) {
    const fetched = await apiRequest<BackendNhanVienResponse>(
      `/hr/employees/${encodeURIComponent(maNV)}`,
      { method: 'GET' }
    );
    existingBe = fetched.data;
  }

  const body: BackendNhanVienRequest = {
    maNV: existingBe.maNV,
    hoVaTen: existingBe.hoVaTen,
    tuoi: existingBe.tuoi ?? 24,
    chucVu: existingBe.chucVu,
    ngayBatDau: existingBe.ngayBatDau || undefined,
    trangThaiLamViec: 'DA_NGHI_VIEC',
    username: existingBe.username || undefined,
  };

  const res = await apiRequest<BackendNhanVienResponse>(
    `/hr/employees/${encodeURIComponent(maNV)}`,
    {
      method: 'PUT',
      body,
    }
  );

  beCacheByMaNv.set(res.data.maNV, res.data);

  return {
    ...res,
    data: null,
    message: 'Đã chuyển trạng thái nhân viên sang Đã nghỉ việc',
  };
}