import type { Handler, HandlerEvent } from '@netlify/functions';
import { ok, err, respond } from './_utils';
import { getCVStore } from './_blobs';
import type { CV } from '../../src/types';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  const id = event.queryStringParameters?.['id'];
  if (!id) return err('CV id is required', 400);

  try {
    const store = getCVStore();
    const cv = await store.get(id, { type: 'json' }) as CV | null;
    if (!cv) return err('CV not found', 404);

    // Only expose safe fields — no internal metadata
    return ok({
      id: cv.id,
      title: cv.title,
      description: cv.description,
      fileUrl: cv.fileUrl,
      createdAt: cv.createdAt,
    });
  } catch (e) {
    return err(`cv-public error: ${(e as Error).message}`, 500);
  }
};
