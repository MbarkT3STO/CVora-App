import type { Handler, HandlerEvent } from '@netlify/functions';
import { ok, err, respond, createToken } from './_utils';

// Demo credentials — in production store hashed passwords
const USERS: Record<string, string> = {
  admin: 'admin123',
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  const body = JSON.parse(event.body || '{}');
  const { username, password } = body as { username: string; password: string };

  if (!username || !password) return err('Username and password required');

  const valid = USERS[username] === password;
  if (!valid) return err('Invalid credentials', 401);

  return ok({ token: createToken(username), username });
};
