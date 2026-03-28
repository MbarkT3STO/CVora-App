import type { Handler, HandlerEvent } from '@netlify/functions';
import { v2 as cloudinary } from 'cloudinary';
import { ok, err, respond, verifyToken } from './_utils';
import { getCVStore } from './_blobs';
import type { CVCreatePayload, CV } from '../../src/types';

cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return respond(204, {});
  if (!verifyToken(event.headers['authorization'])) return err('Unauthorized', 401);
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try {
    const { title, description, fileBase64, fileName } = JSON.parse(event.body || '{}') as CVCreatePayload;
    if (!title || !fileBase64) return err('Title and file are required');

    const dataUri = `data:application/pdf;base64,${fileBase64}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'raw',
      folder: 'cvora',
      public_id: `cv_${Date.now()}`,
      use_filename: true,
      unique_filename: true,
      original_filename: fileName?.replace('.pdf', '') || 'cv',
    });

    const cv: CV = {
      id: crypto.randomUUID(),
      title,
      description: description || '',
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      createdAt: new Date().toISOString(),
    };

    const store = getCVStore();
    await store.setJSON(cv.id, cv);

    return ok(cv);
  } catch (e) {
    return err(`cv-create error: ${(e as Error).message}`, 500);
  }
};
