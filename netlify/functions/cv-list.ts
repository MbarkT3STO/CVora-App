import type { Handler, HandlerEvent } from '@netlify/functions';
import { getDeployStore } from '@netlify/blobs';
import { ok, err, respond, verifyToken } from './_utils';
import type { CV } from '../../src/types';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  if (!verifyToken(event.headers['authorization'])) return err('Unauthorized', 401);

  try {
    const store = getDeployStore('cvs');
    const { blobs } = await store.list();

    const cvs: CV[] = await Promise.all(
      blobs.map(async (b) => {
        const data = await store.get(b.key, { type: 'json' });
        return data as CV;
      })
    );

    return ok(cvs.filter(Boolean).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  } catch (e) {
    return err(`cv-list error: ${(e as Error).message}`, 500);
  }
};
