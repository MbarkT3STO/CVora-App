import type { Handler, HandlerEvent } from '@netlify/functions';
import { v2 as cloudinary } from 'cloudinary';
import { ok, err, respond, getUserFromToken } from './_utils';
import { getCVStore } from './_blobs';
import type { CV } from '../../src/types';

cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  const username = getUserFromToken(event.headers['authorization']);
  if (!username) return err('Unauthorized', 401);
  if (event.httpMethod !== 'DELETE') return err('Method not allowed', 405);

  try {
    const { id, publicId } = JSON.parse(event.body || '{}') as { id: string; publicId?: string };
    if (!id) return err('ID is required');

    const store = getCVStore();
    const existing = await store.get(`${username}/${id}`, { type: 'json' }) as CV | null;
    if (!existing) return err('CV not found', 404);
    if (existing.owner !== username) return err('Forbidden', 403);

    // Only destroy Cloudinary asset for PDF CVs
    if (existing.type !== 'built' && publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    await store.delete(`${username}/${id}`);
    return ok({ id });
  } catch (e) {
    return err(`cv-delete error: ${(e as Error).message}`, 500);
  }
};
