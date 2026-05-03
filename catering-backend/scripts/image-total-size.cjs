/**
 * Report total byte size of uploaded images:
 *   — Local: catering-backend/storage/public (recursive, image extensions only by default)
 *   — R2: all objects in S3_BUCKET when S3_* env is set (paginated list)
 *
 * Usage (from catering-backend/):
 *   node scripts/image-total-size.cjs
 *   node scripts/image-total-size.cjs --local-all   # count every file under storage/public, not only images
 */

const path = require('path');
const fs = require('fs');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath, override: true });
}

const LOCAL_ALL_FILES = process.argv.includes('--local-all');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

function formatBytes(n) {
  if (n === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), sizes.length - 1);
  return `${(n / Math.pow(k, i)).toFixed(i > 0 ? 2 : 0)} ${sizes[i]}`;
}

function walkLocalBytes(rootDir) {
  let bytes = 0;
  let files = 0;

  function walk(d) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (!LOCAL_ALL_FILES && !IMAGE_EXT.has(ext)) continue;
        try {
          const st = fs.statSync(full);
          bytes += st.size;
          files += 1;
        } catch {
          /* skip */
        }
      }
    }
  }

  walk(rootDir);
  return { bytes, files };
}

function buildS3(env) {
  const endpoint = env.S3_ENDPOINT?.trim();
  const accessKeyId = env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY?.trim();
  const bucket = env.S3_BUCKET?.trim();
  const region = env.S3_REGION?.trim() || 'auto';
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
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

async function sumR2Objects(client, bucket) {
  let bytes = 0;
  let objects = 0;
  let token;

  do {
    const out = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    );
    for (const obj of out.Contents ?? []) {
      bytes += obj.Size ?? 0;
      objects += 1;
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  return { bytes, objects };
}

(async () => {
  const env = process.env;
  const diskRoot = env.UPLOAD_DISK_ROOT || path.join(process.cwd(), 'storage', 'public');

  console.log('Image storage size report');
  console.log('========================\n');

  const local = walkLocalBytes(diskRoot);
  console.log(`Local (${diskRoot})`);
  console.log(
    `  ${LOCAL_ALL_FILES ? 'All files' : 'Image files (.jpg, .png, .webp, .gif, .svg)'}: ${local.files} files, ${formatBytes(local.bytes)} (${local.bytes.toLocaleString()} bytes)\n`,
  );

  const s3 = buildS3(env);
  if (!s3) {
    console.log('R2 / S3: not configured (set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET).');
    console.log('\nTotal (local only):', formatBytes(local.bytes), `(${local.bytes.toLocaleString()} bytes)`);
    process.exit(0);
  }

  try {
    const r2 = await sumR2Objects(s3.client, s3.bucket);
    console.log(`R2 bucket "${s3.bucket}"`);
    console.log(`  Objects: ${r2.objects.toLocaleString()}, ${formatBytes(r2.bytes)} (${r2.bytes.toLocaleString()} bytes)\n`);

    const combined = local.bytes + r2.bytes;
    console.log('Combined (local + R2):', formatBytes(combined), `(${combined.toLocaleString()} bytes)`);
  } catch (e) {
    console.error('R2 list failed:', e.message || e);
    console.log('\nTotal (local only):', formatBytes(local.bytes), `(${local.bytes.toLocaleString()} bytes)`);
    process.exit(1);
  }
})();
