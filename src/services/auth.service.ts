import { api } from './api';
import { storage } from '../utils/storage';
import type { AuthPayload, AuthResponse } from '../types';

export const authService = {
  async login(payload: AuthPayload): Promise<{ success: boolean; error?: string }> {
    const res = await api.post<AuthResponse>('auth', { ...payload, action: 'login' });
    if (res.success && res.data) {
      storage.setToken(res.data.token);
      storage.setUser(res.data.username);
      if (res.data.expiresAt) storage.setExpiresAt(res.data.expiresAt);
    }
    return { success: res.success, error: res.error };
  },

  async register(payload: AuthPayload): Promise<{ success: boolean; error?: string }> {
    const res = await api.post<AuthResponse>('auth', { ...payload, action: 'register' });
    if (res.success && res.data) {
      storage.setToken(res.data.token);
      storage.setUser(res.data.username);
      if (res.data.expiresAt) storage.setExpiresAt(res.data.expiresAt);
    }
    return { success: res.success, error: res.error };
  },

  logout() {
    storage.clear();
  },

  isAuthenticated(): boolean {
    if (!storage.getToken()) return false;
    if (storage.isTokenExpired()) {
      storage.clear();
      return false;
    }
    return true;
  },

  getUser(): string | null {
    return storage.getUser();
  },
};
