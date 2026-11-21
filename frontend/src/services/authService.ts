import { MOCK_USERS } from '../mocks';
import { ApiResponse, LoginRequest, LoginResponse, User, UserRole } from '../types';
import {
  apiRequest,
  clearAuthStorage,
  createApiResponse,
  getAccessToken,
  SESSION_STORAGE_KEY,
  setAuthTokens,
} from './apiConfig';

type BackendRole =
  | 'ROLE_ADMIN'
  | 'ROLE_MANAGER'
  | 'ROLE_RECEPTIONIST'
  | 'ROLE_WAITER'
  | 'ROLE_CASHIER'
  | 'ROLE_INVENTORY_STAFF';

interface BackendJwtAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  maNV: string;
  username: string;
  hoVaTen: string;
  chucVu: string;
  role: BackendRole;
}

interface BackendUserProfileResponse {
  maNV: string;
  hoVaTen: string;
  tuoi?: number;
  chucVu: string;
  ngayBatDau?: string;
  trangThaiLamViec?: string;
  username: string;
  role: BackendRole;
}

/**
 * Tài khoản mặc định cho 3 nút "Đăng nhập nhanh (Demo)".
 * Hãy đối chiếu username & password này với file V1__initialize_quanlynhahang.sql của Backend.
 */
const DEMO_CREDENTIALS_BY_ROLE: Record<UserRole, LoginRequest> = {
  [UserRole.MANAGER]: { username: 'quanly1', password: '123456' },
  [UserRole.STAFF]: { username: 'phucvu1', password: '123456' },
  [UserRole.CHEF]: { username: 'beptruong', password: '123456' },
};

function parseMaNvToNumericId(maNV?: string): number {
  if (!maNV) return 0;
  const digits = maNV.replace(/\D/g, '');
  const parsed = Number.parseInt(digits, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function mapBackendRoleToUserRole(role?: BackendRole, chucVu?: string): UserRole {
  const normalizedChucVu = (chucVu || '').toLowerCase();
  if (normalizedChucVu.includes('bếp')) {
    return UserRole.CHEF;
  }

  switch (role) {
    case 'ROLE_ADMIN':
    case 'ROLE_MANAGER':
      return UserRole.MANAGER;
    case 'ROLE_INVENTORY_STAFF':
      return UserRole.CHEF;
    case 'ROLE_RECEPTIONIST':
    case 'ROLE_WAITER':
    case 'ROLE_CASHIER':
    default:
      return UserRole.STAFF;
  }
}

function mapAuthDataToUser(data: {
  maNV: string;
  username: string;
  hoVaTen: string;
  chucVu: string;
  role: BackendRole;
  trangThaiLamViec?: string;
}): User {
  const feRole = mapBackendRoleToUserRole(data.role, data.chucVu);
  const demoMatch = MOCK_USERS.find((u) => u.role === feRole);

  return {
    id: parseMaNvToNumericId(data.maNV),
    username: data.username,
    fullName: data.hoVaTen,
    email: `${data.username}@bepviet.vn`,
    phone: '',
    role: feRole,
    avatarUrl: demoMatch?.avatarUrl,
    active: data.trangThaiLamViec ? data.trangThaiLamViec !== 'NGHI_VIEC' : true,
    lastLoginAt: new Date().toISOString(),
  };
}

/**
 * POST /api/v1/auth/login
 */
export async function login(payload: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const username = payload.username.trim();
  const password = payload.password;

  if (!username || !password) {
    throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
  }

  const res = await apiRequest<BackendJwtAuthResponse>('/auth/login', {
    method: 'POST',
    body: { username, password },
    skipAuth: true,
  });

  const beData = res.data;
  setAuthTokens(beData.accessToken, beData.refreshToken);

  const session: LoginResponse = {
    accessToken: beData.accessToken,
    tokenType: 'Bearer',
    expiresInSeconds: 86_400,
    user: mapAuthDataToUser(beData),
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  return {
    ...res,
    data: session,
  };
}

/**
 * Gọi trực tiếp POST /api/v1/auth/login bằng tài khoản tương ứng trong MySQL.
 */
export async function loginAsDemoRole(role: UserRole): Promise<ApiResponse<LoginResponse>> {
  const creds = DEMO_CREDENTIALS_BY_ROLE[role];
  if (!creds) {
    throw new Error('Không tìm thấy tài khoản demo cho vai trò này.');
  }
  return login(creds);
}

/**
 * GET /api/v1/auth/me — Xác thực lại phiên đăng nhập khi F5 tải lại trang.
 */
export async function getCurrentSession(): Promise<ApiResponse<LoginResponse | null>> {
  if (typeof window === 'undefined') {
    return createApiResponse(null);
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    return createApiResponse(null);
  }

  try {
    const res = await apiRequest<BackendUserProfileResponse>('/auth/me', {
      method: 'GET',
    });

    const session: LoginResponse = {
      accessToken: getAccessToken() || accessToken,
      tokenType: 'Bearer',
      expiresInSeconds: 86_400,
      user: mapAuthDataToUser(res.data),
    };

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return {
      ...res,
      data: session,
    };
  } catch {
    // Token hết hạn hoặc không hợp lệ -> xóa phiên để quay về màn hình đăng nhập
    clearAuthStorage();
    return createApiResponse(null);
  }
}

/**
 * Đăng xuất (Backend dùng Stateless JWT nên chỉ cần xóa token phía trình duyệt).
 */
export async function logout(): Promise<ApiResponse<null>> {
  clearAuthStorage();
  return createApiResponse(null, 'Đã đăng xuất khỏi hệ thống');
}

export function getDemoUserByRole(role: UserRole): User | undefined {
  return MOCK_USERS.find((user) => user.role === role);
}