import type { Handler, HandlerEvent } from '@netlify/functions';
import { v2 as cloudinary } from 'cloudinary';
import { ok, err, respond, getUserFromToken } from './_utils';
import { getCVStore } from './_blobs';
import type { CVUpdatePayload, CV } from '../../src/types';

cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  const username = getUserFromToken(event.headers['authorization']);
  if (!username) return err('Unauthorized', 401);
  if (event.httpMethod !== 'PUT') return err('Method not allowed', 405);

  try {
    const { id, title, description, fileBase64, fileName } = JSON.parse(event.body || '{}') as CVUpdatePayload;
    if (!id || !title) return err('ID and title are required');

    const store = getCVStore();
    const existing = await store.get(`${username}/${id}`, { type: 'json' }) as CV | null;
    if (!existing) return err('CV not found', 404);
    if (existing.owner !== username) return err('Forbidden', 403);

    let fileUrl = existing.fileUrl;
    let publicId = existing.publicId;

    if (fileBase64) {
      await cloudinary.uploader.destroy(existing.publicId, { resource_type: 'raw' });
      const dataUri = `data:application/pdf;base64,${fileBase64}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'raw',
        folder: 'cvora',
        public_id: `cv_${Date.now()}`,
        original_filename: fileName?.replace('.pdf', '') || 'cv',
      });
      fileUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }

    const updated: CV = {
      ...existing,
      title,
      description: description || '',
      fileUrl,
      publicId,
      updatedAt: new Date().toISOString(),
    };

    await store.setJSON(`${username}/${id}`, updated);
    return ok(updated);
  } catch (e) {
    return err(`cv-update error: ${(e as Error).message}`, 500);
  }
};
