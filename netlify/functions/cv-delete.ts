import type { Handler, HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { v2 as cloudinary } from 'cloudinary';
import { ok, err, respond, verifyToken } from './_utils';

cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  if (!verifyToken(event.headers['authorization'])) return err('Unauthorized', 401);
  if (event.httpMethod !== 'DELETE') return err('Method not allowed', 405);

  try {
    const { id, publicId } = JSON.parse(event.body || '{}') as { id: string; publicId: string };
    if (!id || !publicId) return err('ID and publicId are required');

    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    const store = getStore('cvs');
    await store.delete(id);

    return ok({ id });
  } catch (e) {
    return err(`cv-delete error: ${(e as Error).message}`, 500);
  }
};
