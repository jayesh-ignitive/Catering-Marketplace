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
import { AdminAttributesService } from './admin-attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { UpsertAttributeTranslationDto } from './dto/upsert-attribute-translation.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/attributes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAttributesController {
  constructor(private readonly attributes: AdminAttributesService) {}

  @Get()
  list() {
    return this.attributes.list();
  }

  @Post()
  create(@Body() dto: CreateAttributeDto) {
    return this.attributes.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributes.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attributes.remove(id);
  }

  @Post(':id/translations')
  upsertTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertAttributeTranslationDto,
  ) {
    return this.attributes.upsertTranslation(id, dto);
  }

  @Delete(':id/translations/:languageId')
  removeTranslation(
    @Param('id') id: string,
    @Param('languageId') languageId: string,
  ) {
    return this.attributes.removeTranslation(id, languageId);
  }
}
