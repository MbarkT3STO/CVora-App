import type { Handler, HandlerEvent } from '@netlify/functions';
import { ok, err, respond } from './_utils';
import { getCVStore } from './_blobs';
import type { CV } from '../../src/types';
import { renderTemplate } from './cv-templates.js';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  const id = event.queryStringParameters?.['id'];
  if (!id) return err('CV id is required', 400);

  try {
    const store = getCVStore();
    let cv: CV | null = null;

    if (id.includes('/')) {
      cv = await store.get(id, { type: 'json' }).catch(() => null) as CV | null;
    } else {
      const { blobs } = await store.list();
      const match = blobs.find(b => b.key.endsWith(`/${id}`) || b.key === id);
      if (match) {
        cv = await store.get(match.key, { type: 'json' }).catch(() => null) as CV | null;
      }
    }

    if (!cv) return err('CV not found', 404);

    // Built CVs — return rendered HTML page
    if (cv.type === 'built' && cv.cvData) {
      const html = renderTemplate(cv.cvData, cv.template || 'modern', cv.title, cv.accentColor);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
        body: html,
      };
    }

    // PDF CVs — return JSON with file URL
    return ok({
      id: cv.id,
      type: cv.type || 'pdf',
      title: cv.title,
      description: cv.description,
      fileUrl: cv.fileUrl,
      createdAt: cv.createdAt,
    });
  } catch (e) {
    return err(`cv-public error: ${(e as Error).message}`, 500);
  }
};
