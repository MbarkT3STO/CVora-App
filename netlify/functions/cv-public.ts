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

    // id may be passed as "owner/cvId" (from public link) or bare cvId
    // Try direct key first, then scan by prefix match on the id segment
    let cv: CV | null = null;

    if (id.includes('/')) {
      cv = await store.get(id, { type: 'json' }).catch(() => null) as CV | null;
    } else {
      // Scan all blobs to find the one matching this id — needed for legacy bare-id links
      const { blobs } = await store.list();
      const match = blobs.find(b => b.key.endsWith(`/${id}`) || b.key === id);
      if (match) {
        cv = await store.get(match.key, { type: 'json' }).catch(() => null) as CV | null;
      }
    }

    if (!cv) return err('CV not found', 404);

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
