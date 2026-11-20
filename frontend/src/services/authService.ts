import { MOCK_PASSWORDS, MOCK_USERS } from '../mocks';
import { ApiResponse, LoginRequest, LoginResponse, User, UserRole } from '../types';
import { cloneData, createApiResponse, simulateLatency } from './apiConfig';

const SESSION_STORAGE_KEY = 'bepviet_auth_session_v1';

/**
 * POST /api/auth/login
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload);
 * return res.data;
 */
export async function login(payload: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  await simulateLatency();

  const normalizedUsername = payload.username.trim().toLowerCase();
  const password = payload.password;

  if (!normalizedUsername || !password) {
    throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
  }

  const foundUser = MOCK_USERS.find(
    (user) => user.username.toLowerCase() === normalizedUsername && user.active
  );
  const expectedPassword = MOCK_PASSWORDS[normalizedUsername];

  if (!foundUser || expectedPassword !== password) {
    throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác.');
  }

  const session: LoginResponse = {
    accessToken: `mock-jwt-${foundUser.role.toLowerCase()}-${foundUser.id}`,
    tokenType: 'Bearer',
    expiresInSeconds: 28_800,
    user: cloneData({
      ...foundUser,
      lastLoginAt: new Date().toISOString(),
    }),
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  return createApiResponse(session, 'Đăng nhập thành công');
}

/**
 * Hỗ trợ nút "Đăng nhập nhanh (Demo)" theo vai trò trên màn hình đăng nhập.
 * Gọi trực tiếp cùng luồng POST /api/auth/login để đồng nhất hành vi xác thực.
 */
export async function loginAsDemoRole(role: UserRole): Promise<ApiResponse<LoginResponse>> {
  const targetUser = MOCK_USERS.find((user) => user.role === role);
  if (!targetUser) {
    throw new Error('Không tìm thấy tài khoản demo cho vai trò này.');
  }
  return login({
    username: targetUser.username,
    password: MOCK_PASSWORDS[targetUser.username],
  });
}

/**
 * GET /api/auth/me
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<User>>('/auth/me');
 * return res.data;
 */
export async function getCurrentSession(): Promise<ApiResponse<LoginResponse | null>> {
  await simulateLatency(40);
  if (typeof window === 'undefined') {
    return createApiResponse(null);
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return createApiResponse(null);
  }
  try {
    const parsed = JSON.parse(raw) as LoginResponse;
    return createApiResponse(parsed);
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return createApiResponse(null);
  }
}

/**
 * POST /api/auth/logout
 * Thay thế khi nối Java Backend:
 * await apiClient.post('/auth/logout');
 */
export async function logout(): Promise<ApiResponse<null>> {
  await simulateLatency(60);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  return createApiResponse(null, 'Đã đăng xuất khỏi hệ thống');
}

export function getDemoUserByRole(role: UserRole): User | undefined {
  return MOCK_USERS.find((user) => user.role === role);
}
