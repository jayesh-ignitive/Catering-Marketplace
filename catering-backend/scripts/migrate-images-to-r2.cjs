/**
 * One-off: copy caterer banner + gallery images into Cloudflare R2 and store relative keys in MySQL.
 *
 * Prerequisites (catering-backend/.env):
 *   IMAGE_STORAGE_DRIVER=r2
 *   S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_PUBLIC_BASE_URL, S3_REGION=auto
 *   UPLOAD_PUBLIC_BASE_URL (for stripping old API URLs)
 *   DB_* — same as the app
 *
 * Usage (from catering-backend/):
 *   node scripts/migrate-images-to-r2.cjs
 *   node scripts/migrate-images-to-r2.cjs --dry-run
 *
 * Skips rows already stored as images/banner/… or images/gallery/… (relative keys).
 * If the DB still has a full URL on your CDN or /uploads/, rewrites the row to the relative key only (no upload).
 */

const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const mysql = require('mysql2/promise');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath, override: true });
}

/** npm on some shells omits args after `--`; use `npm run migrate:images-r2:dry` or pass `--dry-run` directly to node. */
const DRY =
  process.argv.includes('--dry-run') ||
  process.argv.includes('-n') ||
  process.env.MIGRATE_IMAGES_DRY_RUN === '1';

console.log(`migrate-images-to-r2 — ${DRY ? 'DRY-RUN (no DB / no R2 writes)' : 'LIVE'}\n`);

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function extFromMime(mime) {
  const m = String(mime || '')
    .toLowerCase()
    .split(';')[0]
    .trim();
  return MIME_EXT[m] || null;
}

function guessMimeFromExt(ext) {
  const e = ext.toLowerCase().replace(/^\.+/, '');
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  if (e === 'gif') return 'image/gif';
  return 'image/jpeg';
}

/** If value is already our public URL, return storage key; else null. */
function urlToKeyIfOurs(raw, env) {
  const t = String(raw || '').trim();
  if (!t) return null;

  const r2 = (env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (r2 && t.startsWith(r2)) {
    try {
      const u = new URL(t);
      return u.pathname.replace(/^\/+/, '');
    } catch {
      return t.slice(r2.length + 1).replace(/^\/+/, '');
    }
  }

  const api = (env.UPLOAD_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (api && t.startsWith(api + '/uploads/')) {
    return t.slice((api + '/uploads/').length).replace(/^\/+/, '');
  }

  try {
    const u = new URL(t);
    if (r2) {
      const r2u = new URL(r2);
      if (u.host === r2u.host) {
        return u.pathname.replace(/^\/+/, '');
      }
    }
  } catch {
    /* ignore */
  }

  if (t.startsWith('/uploads/')) {
    return t.slice('/uploads/'.length);
  }

  return null;
}

function isNewLayoutKey(k) {
  return /^images\/(banner|gallery)\/[^/]+\.(jpe?g|png|webp|gif)$/i.test(k);
}

async function resolveBuffer(raw, env) {
  const t = String(raw || '').trim();

  if (t.startsWith('data:image/')) {
    const comma = t.indexOf(',');
    if (comma === -1) throw new Error('Invalid data URL');
    const header = t.slice(5, comma);
    const mime = header.split(';')[0] || 'image/jpeg';
    const b64 = t.slice(comma + 1);
    const buf = Buffer.from(b64, 'base64');
    return { buffer: buf, mime };
  }

  if (/^https?:\/\//i.test(t)) {
    const res = await fetch(t, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${t.slice(0, 120)}`);
    const ab = await res.arrayBuffer();
    const mime = res.headers.get('content-type') || guessMimeFromExt(path.extname(new URL(t).pathname));
    return { buffer: Buffer.from(ab), mime };
  }

  let rel = t;
  if (rel.startsWith('/uploads/')) rel = rel.slice('/uploads/'.length);
  if (rel.includes('/uploads/')) {
    const idx = rel.indexOf('/uploads/');
    rel = rel.slice(idx + '/uploads/'.length);
  }
  rel = rel.replace(/^\/+/, '');

  const diskRoot = env.UPLOAD_DISK_ROOT || path.join(process.cwd(), 'storage', 'public');
  const full = path.join(diskRoot, rel);
  if (!fs.existsSync(full)) {
    throw new Error(`Local file not found: ${full}`);
  }
  const buffer = fs.readFileSync(full);
  const ext = path.extname(full).slice(1) || 'jpg';
  const mime = guessMimeFromExt(ext);
  return { buffer, mime };
}

function buildS3(env) {
  const endpoint = env.S3_ENDPOINT?.trim();
  const accessKeyId = env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY?.trim();
  const bucket = env.S3_BUCKET?.trim();
  const region = env.S3_REGION?.trim() || 'auto';
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Missing S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, or S3_BUCKET');
  }
  return {
    client: new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
  };
}

async function putImage(client, bucket, kind, buffer, mime) {
  const ext = extFromMime(mime) || 'jpg';
  const sub = kind === 'banner' ? 'banner' : 'gallery';
  const key = `images/${sub}/${randomUUID()}.${ext}`;
  const contentType = String(mime || 'image/jpeg')
    .split(';')[0]
    .trim();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return key;
}

(async () => {
  const env = process.env;
  if ((env.IMAGE_STORAGE_DRIVER || '').toLowerCase() !== 'r2' && (env.IMAGE_STORAGE_DRIVER || '').toLowerCase() !== 's3') {
    console.warn('Warning: IMAGE_STORAGE_DRIVER is not r2/s3. Continuing anyway (script writes to R2).');
  }

  let s3;
  try {
    s3 = buildS3(env);
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD ?? '',
    database: env.DB_NAME || 'catering',
  });

  const urlDedupe = new Map();

  let heroesUpdated = 0;
  let galleryUpdated = 0;
  let heroesSkipped = 0;
  let gallerySkipped = 0;
  let errors = 0;

  const [heroRows] = await conn.query(
    `SELECT id, hero_image_url FROM caterer_profiles WHERE hero_image_url IS NOT NULL AND TRIM(hero_image_url) <> ''`,
  );

  for (const row of heroRows) {
    const id = row.id;
    const raw = row.hero_image_url;
    try {
      const normalizedKey = urlToKeyIfOurs(raw, env);
      if (normalizedKey && normalizedKey !== raw.trim()) {
        if (DRY) {
          console.log(`[hero ${id}] rewrite URL → key: ${normalizedKey.slice(0, 80)}…`);
        } else {
          await conn.query(`UPDATE caterer_profiles SET hero_image_url = ? WHERE id = ?`, [normalizedKey, id]);
        }
        heroesUpdated += 1;
        continue;
      }

      if (isNewLayoutKey(String(raw).trim())) {
        heroesSkipped += 1;
        continue;
      }

      const { buffer, mime } = await resolveBuffer(raw, env);
      const extOk = extFromMime(mime);
      if (!extOk) {
        console.warn(`[hero ${id}] skip unsupported mime: ${mime}`);
        errors += 1;
        continue;
      }

      if (DRY) {
        console.log(`[hero ${id}] would upload ${buffer.length} bytes (${mime}) → images/banner/…`);
        heroesUpdated += 1;
        continue;
      }

      const key = await putImage(s3.client, s3.bucket, 'banner', buffer, mime);
      await conn.query(`UPDATE caterer_profiles SET hero_image_url = ? WHERE id = ?`, [key, id]);
      heroesUpdated += 1;
      console.log(`[hero ${id}] → ${key}`);
    } catch (e) {
      errors += 1;
      console.error(`[hero ${id}]`, e.message || e);
    }
  }

  const [galRows] = await conn.query(
    `SELECT id, caterer_profile_id, url FROM caterer_profile_gallery_images WHERE url IS NOT NULL AND TRIM(url) <> ''`,
  );

  for (const row of galRows) {
    const id = row.id;
    const raw = row.url;
    try {
      const normalizedKey = urlToKeyIfOurs(raw, env);
      if (normalizedKey && normalizedKey !== raw.trim()) {
        if (DRY) {
          console.log(`[gallery ${id}] rewrite URL → key: ${normalizedKey.slice(0, 80)}…`);
        } else {
          await conn.query(`UPDATE caterer_profile_gallery_images SET url = ? WHERE id = ?`, [normalizedKey, id]);
        }
        galleryUpdated += 1;
        continue;
      }

      if (isNewLayoutKey(String(raw).trim())) {
        gallerySkipped += 1;
        continue;
      }

      const dedupeKey = raw.trim();
      if (urlDedupe.has(dedupeKey)) {
        const existingKey = urlDedupe.get(dedupeKey);
        if (!DRY) {
          await conn.query(`UPDATE caterer_profile_gallery_images SET url = ? WHERE id = ?`, [existingKey, id]);
        }
        galleryUpdated += 1;
        console.log(`[gallery ${id}] deduped → ${existingKey}`);
        continue;
      }

      const { buffer, mime } = await resolveBuffer(raw, env);
      const extOk = extFromMime(mime);
      if (!extOk) {
        console.warn(`[gallery ${id}] skip unsupported mime: ${mime}`);
        errors += 1;
        continue;
      }

      if (DRY) {
        console.log(`[gallery ${id}] would upload ${buffer.length} bytes (${mime}) → images/gallery/…`);
        galleryUpdated += 1;
        continue;
      }

      const key = await putImage(s3.client, s3.bucket, 'gallery', buffer, mime);
      urlDedupe.set(dedupeKey, key);
      await conn.query(`UPDATE caterer_profile_gallery_images SET url = ? WHERE id = ?`, [key, id]);
      galleryUpdated += 1;
      console.log(`[gallery ${id}] → ${key}`);
    } catch (e) {
      errors += 1;
      console.error(`[gallery ${id}]`, e.message || e);
    }
  }

  await conn.end();

  console.log('');
  console.log(DRY ? 'Dry run complete.' : 'Migration complete.');
  console.log(`Hero: ${heroesUpdated} updated, ${heroesSkipped} skipped`);
  console.log(`Gallery: ${galleryUpdated} updated, ${gallerySkipped} skipped`);
  console.log(`Errors: ${errors}`);
  process.exit(errors > 0 ? 1 : 0);
})();
