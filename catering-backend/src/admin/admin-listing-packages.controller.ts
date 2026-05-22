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
import { AdminListingPackagesService } from './admin-listing-packages.service';
import { CreateListingComparisonRowDto } from './dto/create-listing-comparison-row.dto';
import { CreateListingPlanDto } from './dto/create-listing-plan.dto';
import { UpdateListingComparisonRowDto } from './dto/update-listing-comparison-row.dto';
import { UpdateListingPlanDto } from './dto/update-listing-plan.dto';
import { UpsertListingComparisonRowTranslationDto } from './dto/upsert-listing-comparison-row-translation.dto';
import { UpsertListingPackagesPageTranslationDto } from './dto/upsert-listing-packages-page-translation.dto';
import { UpsertListingPlanTranslationDto } from './dto/upsert-listing-plan-translation.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/listing-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminListingPackagesController {
  constructor(private readonly listingPackages: AdminListingPackagesService) {}

  @Get()
  list() {
    return this.listingPackages.getBundle();
  }

  @Post('page/translations')
  upsertPageTranslation(@Body() dto: UpsertListingPackagesPageTranslationDto) {
    return this.listingPackages.upsertPageTranslation(dto);
  }

  @Delete('page/translations/:languageId')
  removePageTranslation(@Param('languageId') languageId: string) {
    return this.listingPackages.removePageTranslation(languageId);
  }

  @Post('plans')
  createPlan(@Body() dto: CreateListingPlanDto) {
    return this.listingPackages.createPlan(dto);
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdateListingPlanDto) {
    return this.listingPackages.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  deletePlan(@Param('id') id: string) {
    return this.listingPackages.deletePlan(id);
  }

  @Post('plans/:id/translations')
  upsertPlanTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertListingPlanTranslationDto,
  ) {
    return this.listingPackages.upsertPlanTranslation(id, dto);
  }

  @Delete('plans/:id/translations/:languageId')
  removePlanTranslation(
    @Param('id') id: string,
    @Param('languageId') languageId: string,
  ) {
    return this.listingPackages.removePlanTranslation(id, languageId);
  }

  @Post('comparison-rows')
  createComparisonRow(@Body() dto: CreateListingComparisonRowDto) {
    return this.listingPackages.createComparisonRow(dto);
  }

  @Patch('comparison-rows/:id')
  updateComparisonRow(
    @Param('id') id: string,
    @Body() dto: UpdateListingComparisonRowDto,
  ) {
    return this.listingPackages.updateComparisonRow(id, dto);
  }

  @Delete('comparison-rows/:id')
  deleteComparisonRow(@Param('id') id: string) {
    return this.listingPackages.deleteComparisonRow(id);
  }

  @Post('comparison-rows/:id/translations')
  upsertComparisonTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertListingComparisonRowTranslationDto,
  ) {
    return this.listingPackages.upsertComparisonTranslation(id, dto);
  }

  @Delete('comparison-rows/:id/translations/:languageId')
  removeComparisonTranslation(
    @Param('id') id: string,
    @Param('languageId') languageId: string,
  ) {
    return this.listingPackages.removeComparisonTranslation(id, languageId);
  }
}
