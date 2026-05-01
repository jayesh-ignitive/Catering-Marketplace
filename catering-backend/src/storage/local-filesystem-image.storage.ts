import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { ImageStoragePort, SaveImageInput, SaveImageResult } from './image-storage.port';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class LocalFilesystemImageStorage implements ImageStoragePort {
  private readonly log = new Logger(LocalFilesystemImageStorage.name);

  constructor(private readonly config: ConfigService) {}

  async saveImage(input: SaveImageInput): Promise<SaveImageResult> {
    const mime = input.mimeType.toLowerCase().split(';')[0]!.trim();
    const ext = MIME_EXT[mime];
    if (!ext) {
      throw new Error(`unsupported_image_type:${mime}`);
    }

    const diskRoot = this.config.get<string>('UPLOAD_DISK_ROOT') ?? join(process.cwd(), 'storage', 'public');
    const rawPublic =
      this.config.get<string>('UPLOAD_PUBLIC_BASE_URL') ?? 'http://localhost:4000';
    const publicBase = rawPublic.replace(/\/$/, '');

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const id = randomUUID();
    const key = `images/${year}/${month}/${id}.${ext}`;
    const dir = join(diskRoot, 'images', year, month);
    const filePath = join(dir, `${id}.${ext}`);

    await mkdir(dir, { recursive: true });
    await writeFile(filePath, input.buffer);

    const url = `${publicBase}/uploads/${key}`;
    this.log.debug(`Stored upload ${key} (${input.buffer.length} bytes)`);
    return { key, url };
  }
}
