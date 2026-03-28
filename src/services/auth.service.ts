import { api } from './api';
import { storage } from '../utils/storage';
import type { AuthPayload, AuthResponse } from '../types';

export const authService = {
  async login(payload: AuthPayload): Promise<{ success: boolean; error?: string }> {
    const res = await api.post<AuthResponse>('auth', payload);
    if (res.success && res.data) {
      storage.setToken(res.data.token);
      storage.setUser(res.data.username);
    }
    return { success: res.success, error: res.error };
  },

  logout() {
    storage.clear();
  },

  isAuthenticated(): boolean {
    return !!storage.getToken();
  },

  getUser(): string | null {
    return storage.getUser();
  },
};
