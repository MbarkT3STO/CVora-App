import type { HandlerResponse } from '@netlify/functions';

export function respond(statusCode: number, body: object): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

export function ok(data: object): HandlerResponse {
  return respond(200, data);
}

export function err(message: string, status = 400): HandlerResponse {
  return respond(status, { error: message });
}

export function verifyToken(authHeader: string | undefined): boolean {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  // Simple token: base64(username:timestamp) — in production use JWT
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return decoded.startsWith('cvora:');
  } catch {
    return false;
  }
}

export function createToken(username: string): string {
  return Buffer.from(`cvora:${username}:${Date.now()}`).toString('base64');
}
