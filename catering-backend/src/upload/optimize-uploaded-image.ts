import sharp from 'sharp';
import type { ImageUploadKind } from '../storage/image-storage.port';

export type OptimizedUploadImage = {
  buffer: Buffer;
  mimeType: string;
};

const MAX_EDGE: Record<ImageUploadKind, { width: number; height: number }> = {
  banner: { width: 1920, height: 1280 },
  home: { width: 1920, height: 1080 },
  gallery: { width: 1600, height: 1600 },
};

const WEBP_QUALITY = 80;

/**
 * Resize uploads and store JPEG/PNG/WebP as WebP. Animated GIFs stay GIFs so motion is kept.
 * Already-small files are left unchanged when re-encoding would not shrink them.
 */
export async function optimizeUploadedImage(
  buffer: Buffer,
  mimeType: string,
  kind: ImageUploadKind,
): Promise<OptimizedUploadImage> {
  const mime = mimeType.toLowerCase().split(';')[0].trim();
  const limit = MAX_EDGE[kind];

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer, { animated: true, failOn: 'error' }).metadata();
  } catch {
    throw new Error('invalid_image');
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const pageHeight = meta.pageHeight ?? height;
  const oversized = width > limit.width || pageHeight > limit.height;
  const animatedGif = mime === 'image/gif' && (meta.pages ?? 1) > 1;

  const pipeline = sharp(buffer, { animated: true, failOn: 'error' })
    .rotate()
    .resize({
      width: limit.width,
      height: limit.height,
      fit: 'inside',
      withoutEnlargement: true,
    });

  try {
    if (animatedGif) {
      const gif = await pipeline.gif({ effort: 7 }).toBuffer();
      if (!oversized && gif.length >= buffer.length) {
        return { buffer, mimeType: mime };
      }
      return { buffer: gif, mimeType: 'image/gif' };
    }

    const webp = await pipeline
      .webp({ quality: WEBP_QUALITY, effort: 4, alphaQuality: 80 })
      .toBuffer();

    if (!oversized && webp.length >= buffer.length) {
      return { buffer, mimeType: mime };
    }
    return { buffer: webp, mimeType: 'image/webp' };
  } catch {
    throw new Error('invalid_image');
  }
}
