import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../user/user.entity';
import { UserRole } from '../user/user-role.enum';
import { AdminMenuItemsService } from './admin-menu-items.service';
import { AddMenuItemAttributeDto } from './dto/add-menu-item-attribute.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateMenuItemIngredientDto } from './dto/create-menu-item-ingredient.dto';
import { UpdateMenuItemIngredientDto } from './dto/update-menu-item-ingredient.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpsertMenuItemTranslationDto } from './dto/upsert-menu-item-translation.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

type AuthedRequest = Request & { user: User };

@Controller('admin/menu-items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminMenuItemsController {
  constructor(private readonly menuItems: AdminMenuItemsService) {}

  @Get()
  list() {
    return this.menuItems.list();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.menuItems.getById(id);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateMenuItemDto) {
    return this.menuItems.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuItems.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuItems.remove(id);
  }

  @Post(':id/translations')
  upsertTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertMenuItemTranslationDto,
  ) {
    return this.menuItems.upsertTranslation(id, dto);
  }

  @Delete(':id/translations/:languageId')
  removeTranslation(
    @Param('id') id: string,
    @Param('languageId') languageId: string,
  ) {
    return this.menuItems.removeTranslation(id, languageId);
  }

  @Post(':id/ingredients')
  addIngredient(@Param('id') id: string, @Body() dto: CreateMenuItemIngredientDto) {
    return this.menuItems.addIngredient(id, dto);
  }

  @Patch(':id/ingredients/:rowId')
  updateIngredient(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateMenuItemIngredientDto,
  ) {
    return this.menuItems.updateIngredient(id, rowId, dto);
  }

  @Delete(':id/ingredients/:rowId')
  removeIngredient(@Param('id') id: string, @Param('rowId') rowId: string) {
    return this.menuItems.removeIngredient(id, rowId);
  }

  @Post(':id/attributes')
  addAttribute(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: AddMenuItemAttributeDto,
  ) {
    return this.menuItems.addAttribute(id, req.user.id, dto);
  }

  @Delete(':id/attributes/:attributeId')
  removeAttribute(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Param('attributeId') attributeId: string,
  ) {
    return this.menuItems.removeAttribute(id, req.user.id, attributeId);
  }
}
