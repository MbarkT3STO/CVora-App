import { storage } from '../utils/storage';
import type { ApiResponse } from '../types';

const BASE = '/.netlify/functions';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<ApiResponse<T>> {
  const token = storage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token && !skipAuth) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE}/${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Request failed' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export const api = {
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'GET' }),

  getPublic: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'GET' }, true),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'DELETE', body: JSON.stringify(body) }),
};
