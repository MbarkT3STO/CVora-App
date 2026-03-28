const TOKEN_KEY = 'cvora_token';
const USER_KEY = 'cvora_user';
const EXPIRES_KEY = 'cvora_expires';

export const storage = {
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  setUser: (username: string) => localStorage.setItem(USER_KEY, username),
  getUser: (): string | null => localStorage.getItem(USER_KEY),
  removeUser: () => localStorage.removeItem(USER_KEY),

  setExpiresAt: (ts: number) => localStorage.setItem(EXPIRES_KEY, String(ts)),
  getExpiresAt: (): number | null => {
    const v = localStorage.getItem(EXPIRES_KEY);
    return v ? parseInt(v, 10) : null;
  },

  isTokenExpired: (): boolean => {
    const exp = storage.getExpiresAt();
    if (!exp) return true;
    return Date.now() >= exp;
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  },
};
