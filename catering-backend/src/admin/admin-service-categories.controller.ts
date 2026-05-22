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
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { AdminServiceCategoriesService } from './admin-service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { UpsertCategoryTranslationDto } from './dto/upsert-category-translation.dto';

@Controller('admin/service-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminServiceCategoriesController {
  constructor(
    private readonly adminServiceCategories: AdminServiceCategoriesService,
  ) {}

  @Get()
  list() {
    return this.adminServiceCategories.list();
  }

  @Post()
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.adminServiceCategories.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.adminServiceCategories.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminServiceCategories.remove(id);
  }

  @Post(':id/translations')
  upsertTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertCategoryTranslationDto,
  ) {
    return this.adminServiceCategories.upsertTranslation(id, dto);
  }

  @Delete(':id/translations/:languageId')
  removeTranslation(
    @Param('id') id: string,
    @Param('languageId') languageId: string,
  ) {
    return this.adminServiceCategories.removeTranslation(id, languageId);
  }
}
