import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IMAGE_STORAGE } from './image-storage.port';
import { LocalFilesystemImageStorage } from './local-filesystem-image.storage';
import { R2S3ImageStorage } from './r2-s3-image.storage';
import { ImagePublicUrlService } from './image-public-url.service';

function useR2Driver(config: ConfigService): boolean {
  const d = config.get<string>('IMAGE_STORAGE_DRIVER')?.trim().toLowerCase();
  return d === 'r2' || d === 's3';
}

/**
 * Image persistence: local disk (`/uploads`) or Cloudflare R2 (S3-compatible API).
 * Secrets stay on the server; the browser only receives HTTPS URLs returned by `POST /api/upload/image`.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    LocalFilesystemImageStorage,
    R2S3ImageStorage,
    ImagePublicUrlService,
    {
      provide: IMAGE_STORAGE,
      useFactory: (
        config: ConfigService,
        local: LocalFilesystemImageStorage,
        r2: R2S3ImageStorage,
      ) => (useR2Driver(config) ? r2 : local),
      inject: [ConfigService, LocalFilesystemImageStorage, R2S3ImageStorage],
    },
  ],
  exports: [IMAGE_STORAGE, LocalFilesystemImageStorage, R2S3ImageStorage, ImagePublicUrlService],
})
export class StorageModule {}
