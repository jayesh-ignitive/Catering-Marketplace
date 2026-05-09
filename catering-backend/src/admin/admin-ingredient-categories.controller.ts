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
import { AdminIngredientCategoriesService } from './admin-ingredient-categories.service';
import { CreateIngredientCategoryDto } from './dto/create-ingredient-category.dto';
import { UpdateIngredientCategoryDto } from './dto/update-ingredient-category.dto';
import { UpsertIngredientCategoryTranslationDto } from './dto/upsert-ingredient-category-translation.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/ingredient-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminIngredientCategoriesController {
  constructor(private readonly categories: AdminIngredientCategoriesService) {}

  @Get()
  list() {
    return this.categories.list();
  }

  @Post()
  create(@Body() dto: CreateIngredientCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIngredientCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }

  @Post(':id/translations')
  upsertTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertIngredientCategoryTranslationDto,
  ) {
    return this.categories.upsertTranslation(id, dto);
  }

  @Delete(':id/translations/:languageId')
  removeTranslation(
    @Param('id') id: string,
    @Param('languageId') languageId: string,
  ) {
    return this.categories.removeTranslation(id, languageId);
  }
}
