import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Express } from 'express';
import type { User } from '../user/user.entity';
import { UserRole } from '../user/user-role.enum';
import {
  IMAGE_STORAGE,
  type ImageStoragePort,
  type ImageUploadKind,
} from '../storage/image-storage.port';
import { optimizeUploadedImage } from './optimize-uploaded-image';

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Injectable()
export class UploadService {
  constructor(
    @Inject(IMAGE_STORAGE) private readonly imageStorage: ImageStoragePort,
  ) {}

  async uploadAuthenticatedImage(
    file: Express.Multer.File | undefined,
    user: User,
    kind: ImageUploadKind,
  ): Promise<{ url: string; key: string }> {
    if (user.role !== UserRole.CATERER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only caterer or admin accounts may upload images',
      );
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Missing file (use multipart field name "file")',
      );
    }

    const mime = file.mimetype.toLowerCase().split(';')[0].trim();
    if (!ALLOWED_MIMES.has(mime)) {
      throw new BadRequestException(
        `Unsupported type ${mime}; allowed: jpeg, png, webp, gif`,
      );
    }

    let optimized: { buffer: Buffer; mimeType: string };
    try {
      optimized = await optimizeUploadedImage(file.buffer, mime, kind);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'invalid_image') {
        throw new BadRequestException('Could not read that image file');
      }
      throw e;
    }

    try {
      const saved = await this.imageStorage.saveImage({
        buffer: optimized.buffer,
        mimeType: optimized.mimeType,
        originalFilename: file.originalname,
        kind,
      });
      return { url: saved.url, key: saved.key };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith('unsupported_image_type:')) {
        throw new BadRequestException('Unsupported image type');
      }
      throw e;
    }
  }
}
