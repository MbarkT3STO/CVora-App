import type { Handler, HandlerEvent } from '@netlify/functions';
import { ok, err, respond, getUserFromToken } from './_utils';
import { getCVStore } from './_blobs';
import type { CV, CVBuiltCreatePayload, CVBuiltUpdatePayload } from '../../src/types';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  const username = getUserFromToken(event.headers['authorization']);
  if (!username) return err('Unauthorized', 401);

  const body = JSON.parse(event.body || '{}');
  const store = getCVStore();

  if (event.httpMethod === 'PUT') {
    const { id, title, description, cvData, template, accentColor } = body as CVBuiltUpdatePayload;
    if (!id || !title || !cvData) return err('id, title and cvData are required');
    const existing = await store.get(`${username}/${id}`, { type: 'json' }) as CV | null;
    if (!existing) return err('CV not found', 404);
    if (existing.owner !== username) return err('Forbidden', 403);
    const updated: CV = { ...existing, title, description: description || '', cvData, template, accentColor, updatedAt: new Date().toISOString() };
    await store.setJSON(`${username}/${id}`, updated);
    return ok(updated);
  }

  if (event.httpMethod === 'POST') {
    const { title, description, cvData, template, accentColor } = body as CVBuiltCreatePayload;
    if (!title || !cvData) return err('title and cvData are required');
    const cv: CV = {
      id: crypto.randomUUID(),
      owner: username,
      type: 'built',
      title,
      description: description || '',
      cvData,
      template: template || 'modern',
      accentColor,
      createdAt: new Date().toISOString(),
    };
    await store.setJSON(`${username}/${cv.id}`, cv);
    return ok(cv);
  }

  return err('Method not allowed', 405);
};
