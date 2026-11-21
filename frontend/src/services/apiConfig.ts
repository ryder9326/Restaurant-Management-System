import { ApiResponse } from '../types';

const RAW_API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:8080/api/v1';

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

export const ACCESS_TOKEN_KEY = 'bepviet_access_token_v1';
export const REFRESH_TOKEN_KEY = 'bepviet_refresh_token_v1';
export const SESSION_STORAGE_KEY = 'bepviet_auth_session_v1';

interface BackendApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  timestamp: string;
}

interface BackendErrorResponse {
  timestamp?: string;
  status?: number;
  errorCode?: number;
  error?: string;
  message?: string;
  path?: string;
  validationErrors?: Record<string, string>;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  _isRetry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken?: string | null): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function buildErrorMessage(errBody: BackendErrorResponse | null, status: number): string {
  if (errBody?.validationErrors && Object.keys(errBody.validationErrors).length > 0) {
    return Object.values(errBody.validationErrors).join('. ');
  }
  if (errBody?.message) {
    return errBody.message;
  }
  if (status === 401) return 'Phiên đăng nhập đã hết hạn hoặc thông tin xác thực không đúng.';
  if (status === 403) return 'Tài khoản của bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu trên hệ thống.';
  return `Lỗi kết nối máy chủ (HTTP ${status}).`;
}

function safeParseJson(rawText: string): unknown {
  if (!rawText) return null;
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearAuthStorage();
        return null;
      }

      const json = safeParseJson(await response.text()) as BackendApiResponse<{
        accessToken: string;
        refreshToken?: string;
      }> | null;

      if (json?.data?.accessToken) {
        setAuthTokens(json.data.accessToken, json.data.refreshToken ?? refreshToken);
        return json.data.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Hàm gọi Java Spring Boot REST API dùng chung cho toàn bộ các service.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, skipAuth = false, _isRetry = false, headers, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...((headers as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      `Không thể kết nối tới Backend (${API_BASE_URL}). Hãy kiểm tra Spring Boot đã chạy chưa.`
    );
  }

  // Tự động làm mới token 1 lần nếu gặp 401 ở các API cần đăng nhập
  if (response.status === 401 && !skipAuth && !_isRetry) {
    const newAccessToken = await tryRefreshAccessToken();
    if (newAccessToken) {
      return apiRequest<T>(endpoint, { ...options, _isRetry: true });
    }
  }

  const rawText = await response.text();
  const parsed = safeParseJson(rawText);

  if (!response.ok) {
    throw new Error(buildErrorMessage(parsed as BackendErrorResponse | null, response.status));
  }

  // Chuẩn hóa ApiResponse của Java ({ code, message, data?, timestamp }) sang kiểu của Frontend
  if (parsed && typeof parsed === 'object' && 'code' in parsed) {
    const beRes = parsed as BackendApiResponse<T>;
    return {
      success: beRes.code === 1000,
      message: beRes.message || 'Thành công',
      data: (beRes.data ?? null) as T,
      timestamp: beRes.timestamp || new Date().toISOString(),
    };
  }

  return createApiResponse(parsed as T);
}

// --- Giữ lại các hàm hỗ trợ Mock Data cho các module chưa ghép ---
let mockNetworkDelayMs = 150;

export function setMockNetworkDelay(ms: number): void {
  mockNetworkDelayMs = Math.max(0, ms);
}

export async function simulateLatency(ms = mockNetworkDelayMs): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function cloneData<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload)) as T;
}

export function createApiResponse<T>(data: T, message = 'Thành công'): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}