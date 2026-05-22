import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../user/user-role.enum';
import { AdminLegalPagesService } from './admin-legal-pages.service';
import { UpdateLegalPageDto } from './dto/update-legal-page.dto';
import { UpsertLegalPageTranslationDto } from './dto/upsert-legal-page-translation.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/legal-pages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminLegalPagesController {
  constructor(private readonly legalPages: AdminLegalPagesService) {}

  @Get()
  list() {
    return this.legalPages.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.legalPages.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLegalPageDto) {
    return this.legalPages.update(id, dto);
  }

  @Post(':id/translations')
  upsertTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertLegalPageTranslationDto,
  ) {
    return this.legalPages.upsertTranslation(id, dto);
  }

  @Delete(':id/translations/:languageId')
  removeTranslation(
    @Param('id') id: string,
    @Param('languageId') languageId: string,
  ) {
    return this.legalPages.removeTranslation(id, languageId);
  }
}
