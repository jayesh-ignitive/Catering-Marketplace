/**
 * Upload all static site images (formerly images.unsplash.com) to R2.
 *
 * Manifest: scripts/static-image-assets.manifest.cjs
 *
 * Usage (from catering-backend/):
 *   node scripts/upload-static-assets.cjs
 *   node scripts/upload-static-assets.cjs --dry-run
 *   node scripts/upload-static-assets.cjs --only=auth
 *   node scripts/upload-static-assets.cjs --only=home,blog
 *
 * Requires S3_* in .env (IMAGE_STORAGE_DRIVER=r2).
 */

const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { STATIC_IMAGE_ASSETS } = require("./static-image-assets.manifest.cjs");

const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath, override: true });
}

const DRY = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyFilters = onlyArg
  ? onlyArg
      .slice("--only=".length)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  : null;

function assetGroup(asset) {
  if (asset.key.startsWith("images/home/")) return "home";
  if (asset.key.startsWith("images/static/auth-")) return "auth";
  if (asset.key.startsWith("images/static/blog-")) return "blog";
  return "other";
}

function shouldUpload(asset) {
  if (!onlyFilters?.length) return true;
  return onlyFilters.includes(assetGroup(asset));
}

function buildS3(env) {
  const endpoint = env.S3_ENDPOINT?.trim();
  const accessKeyId = env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY?.trim();
  const bucket = env.S3_BUCKET?.trim();
  const region = env.S3_REGION?.trim() || "auto";
  const publicBase = (env.S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Missing S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, or S3_BUCKET");
  }
  if (!publicBase) {
    throw new Error("Missing S3_PUBLIC_BASE_URL");
  }
  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket, publicBase };
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function printManifestTable() {
  console.log("\nStatic image manifest (images.unsplash.com → R2):\n");
  console.log("| ID | R2 key | Source (Unsplash) |");
  console.log("|----|--------|-------------------|");
  for (const a of STATIC_IMAGE_ASSETS) {
    console.log(`| ${a.id} | \`${a.key}\` | ${a.source} |`);
  }
  console.log("");
}

(async () => {
  const env = process.env;
  const { client, bucket, publicBase } = buildS3(env);
  const assets = STATIC_IMAGE_ASSETS.filter(shouldUpload);

  printManifestTable();

  console.log(
    `upload-static-assets — ${DRY ? "DRY-RUN" : "LIVE"}${onlyFilters ? ` (only: ${onlyFilters.join(", ")})` : ""}`,
  );
  console.log(`Bucket: ${bucket}`);
  console.log(`Public base: ${publicBase}\n`);

  if (assets.length === 0) {
    console.log("No assets matched --only filter.");
    process.exit(0);
  }

  for (const asset of assets) {
    const buf = await download(asset.source);
    console.log(`[${asset.id}] ${asset.key} — ${buf.length} bytes`);
    console.log(`  used in: ${asset.usedIn}`);

    if (!DRY) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: asset.key,
          Body: buf,
          ContentType: asset.contentType,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    }

    console.log(`  → ${publicBase}/${asset.key}\n`);
  }

  console.log(`Done. Uploaded ${assets.length} asset(s).`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
