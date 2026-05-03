import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { ImageStoragePort, SaveImageInput, SaveImageResult } from './image-storage.port';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class R2S3ImageStorage implements ImageStoragePort {
  private readonly log = new Logger(R2S3ImageStorage.name);
  private client: S3Client | undefined;
  private bucket = '';
  private publicBase = '';

  constructor(private readonly config: ConfigService) {}

  /** Lazy init so Nest can construct this bean when `IMAGE_STORAGE_DRIVER` is local. */
  private ensureClient(): S3Client {
    if (this.client) {
      return this.client;
    }
    const endpoint = this.config.get<string>('S3_ENDPOINT')?.trim();
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY')?.trim();
    const bucket = this.config.get<string>('S3_BUCKET')?.trim();
    const region = this.config.get<string>('S3_REGION')?.trim() || 'auto';
    const rawPublic = this.config.get<string>('S3_PUBLIC_BASE_URL')?.trim();

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'R2: set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_BUCKET',
      );
    }
    if (!rawPublic) {
      throw new Error(
        'R2: set S3_PUBLIC_BASE_URL (Cloudflare R2 custom domain or public r2.dev URL), no trailing slash',
      );
    }

    this.bucket = bucket;
    this.publicBase = rawPublic.replace(/\/$/, '');
    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
    return this.client;
  }

  async saveImage(input: SaveImageInput): Promise<SaveImageResult> {
    const mime = input.mimeType.toLowerCase().split(';')[0]!.trim();
    const ext = MIME_EXT[mime];
    if (!ext) {
      throw new Error(`unsupported_image_type:${mime}`);
    }

    const subdir = input.kind === 'banner' ? 'banner' : 'gallery';
    const id = randomUUID();
    const key = `images/${subdir}/${id}.${ext}`;

    const s3 = this.ensureClient();

    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: mime,
        /** R2 ignores ACLs for public reads; use bucket custom domain + public access policy in Cloudflare. */
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const url = `${this.publicBase}/${key}`;
    this.log.debug(`R2 put ${this.bucket}/${key} (${input.buffer.length} bytes)`);
    return { key, url };
  }
}
