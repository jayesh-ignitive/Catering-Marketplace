import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IMAGE_STORAGE } from './image-storage.port';
import { LocalFilesystemImageStorage } from './local-filesystem-image.storage';

/**
 * Image persistence. Today: local disk + `/uploads` static route.
 * Replace `IMAGE_STORAGE` binding with an S3/R2 adapter when ready.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    LocalFilesystemImageStorage,
    {
      provide: IMAGE_STORAGE,
      useExisting: LocalFilesystemImageStorage,
    },
  ],
  exports: [IMAGE_STORAGE, LocalFilesystemImageStorage],
})
export class StorageModule {}
