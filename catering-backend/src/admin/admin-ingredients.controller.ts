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
import { AdminIngredientsService } from './admin-ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpsertIngredientTranslationDto } from './dto/upsert-ingredient-translation.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/ingredients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminIngredientsController {
  constructor(private readonly ingredients: AdminIngredientsService) {}

  @Get()
  list() {
    return this.ingredients.list();
  }

  @Post()
  create(@Body() dto: CreateIngredientDto) {
    return this.ingredients.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.ingredients.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ingredients.remove(id);
  }

  @Post(':id/translations')
  upsertTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertIngredientTranslationDto,
  ) {
    return this.ingredients.upsertTranslation(id, dto);
  }

  @Delete(':id/translations/:languageId')
  removeTranslation(
    @Param('id') id: string,
    @Param('languageId') languageId: string,
  ) {
    return this.ingredients.removeTranslation(id, languageId);
  }
}
