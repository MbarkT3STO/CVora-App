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

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function verifyToken(authHeader: string | undefined): boolean {
  return !!getUserFromToken(authHeader);
}

export function getUserFromToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    // format: cvora:<username>:<issuedAt>
    if (parts.length < 3 || parts[0] !== 'cvora') return null;
    const issuedAt = parseInt(parts[2], 10);
    if (isNaN(issuedAt)) return null;
    if (Date.now() - issuedAt >= TOKEN_TTL_MS) return null;
    return parts[1];
  } catch {
    return null;
  }
}

export function createToken(username: string): string {
  return Buffer.from(`cvora:${username}:${Date.now()}`).toString('base64');
}

export function getTokenExpiresAt(): number {
  return Date.now() + TOKEN_TTL_MS;
}
