const TOKEN_KEY = 'cvora_token';
const USER_KEY = 'cvora_user';

export const storage = {
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  setUser: (username: string) => localStorage.setItem(USER_KEY, username),
  getUser: (): string | null => localStorage.getItem(USER_KEY),
  removeUser: () => localStorage.removeItem(USER_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
