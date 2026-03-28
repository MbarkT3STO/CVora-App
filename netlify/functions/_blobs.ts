import { getStore } from '@netlify/blobs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root (needed for local netlify dev)
config({ path: resolve(__dirname, '../../.env') });

export function getCVStore() {
  const siteID = process.env['NETLIFY_SITE_ID'];
  const token = process.env['NETLIFY_TOKEN'] || process.env['NETLIFY_AUTH_TOKEN'];

  if (!siteID || !token) {
    throw new Error(
      `Missing Netlify credentials. NETLIFY_SITE_ID=${siteID ? 'set' : 'missing'}, token=${token ? 'set' : 'missing'}`
    );
  }

  return getStore({ name: 'cvs', siteID, token });
}
