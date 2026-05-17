import {
  BadRequestException,
  Controller,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Express, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import type { User } from '../user/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

@Controller('upload')
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  /** Single image; multipart field name `file`. Query `kind=banner|gallery|home` chooses upload folder under `images/`. */
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  async uploadImage(
    @Query('kind') kindRaw: string | undefined,
    @Req() req: Request & { user: User },
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const k = kindRaw?.trim().toLowerCase();
    if (k !== 'banner' && k !== 'gallery' && k !== 'home') {
      throw new BadRequestException(
        'Query parameter "kind" must be "banner", "gallery", or "home"',
      );
    }
    return this.upload.uploadAuthenticatedImage(file, req.user, k);
  }
}
