import type { Handler, HandlerEvent } from '@netlify/functions';
import { ok, err, respond, createToken, getTokenExpiresAt, getUserFromToken } from './_utils';
import { getUserStore } from './_blobs';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  const body = JSON.parse(event.body || '{}') as {
    username?: string;
    password?: string;
    action?: 'login' | 'register' | 'refresh';
  };

  // Silent token refresh — valid current token required, no credentials needed
  if (body.action === 'refresh') {
    const username = getUserFromToken(event.headers['authorization']);
    if (!username) return err('Unauthorized', 401);
    const token = createToken(username);
    return ok({ token, username, expiresAt: getTokenExpiresAt() });
  }

  const { username, password, action } = body as {
    username: string;
    password: string;
    action?: 'login' | 'register';
  };

  if (!username || !password) return err('Username and password required');
  if (username.length < 3) return err('Username must be at least 3 characters');
  if (password.length < 6) return err('Password must be at least 6 characters');

  const store = getUserStore();

  if (action === 'register') {
    const existing = await store.get(username, { type: 'json' }).catch(() => null);
    if (existing) return err('Username already taken', 409);
    await store.setJSON(username, { username, password, createdAt: new Date().toISOString() });
    const token = createToken(username);
    return ok({ token, username, expiresAt: getTokenExpiresAt() });
  }

  // Default: login
  const user = await store.get(username, { type: 'json' }).catch(() => null) as {
    username: string;
    password: string;
  } | null;

  const isLegacyAdmin = username === 'admin' && password === 'admin123';
  const isValidUser = user && user.password === password;
  if (!isLegacyAdmin && !isValidUser) return err('Invalid credentials', 401);

  const token = createToken(username);
  return ok({ token, username, expiresAt: getTokenExpiresAt() });
};
