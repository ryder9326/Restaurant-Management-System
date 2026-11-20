import { ApiResponse } from '../types';

/**
 * Cấu hình gốc cho lớp gọi API.
 * Khi tích hợp Java REST API Backend (Spring Boot), khởi tạo axios instance:
 *
 * import axios from 'axios';
 * export const apiClient = axios.create({
 *   baseURL: API_BASE_URL,
 *   headers: { 'Content-Type': 'application/json' },
 * });
 */
export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:8080/api';

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
