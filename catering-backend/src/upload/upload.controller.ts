import { Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Express, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import type { User } from '../user/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

@Controller('upload')
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  /** Single image; multipart field name `file`. Returns a public URL under `/uploads/…`. */
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  async uploadImage(@Req() req: Request & { user: User }, @UploadedFile() file: Express.Multer.File | undefined) {
    return this.upload.uploadAuthenticatedImage(file, req.user);
  }
}
