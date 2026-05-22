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
import { AdminCitiesService } from './admin-cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { UpsertCityTranslationDto } from './dto/upsert-city-translation.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/cities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCitiesController {
  constructor(private readonly cities: AdminCitiesService) {}

  @Get('states')
  listStates() {
    return this.cities.listStates();
  }

  @Get()
  list() {
    return this.cities.list();
  }

  @Post()
  create(@Body() dto: CreateCityDto) {
    return this.cities.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.cities.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cities.remove(id);
  }

  @Post(':id/translations')
  upsertTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertCityTranslationDto,
  ) {
    return this.cities.upsertTranslation(id, dto);
  }

  @Delete(':id/translations/:languageId')
  removeTranslation(
    @Param('id') id: string,
    @Param('languageId') languageId: string,
  ) {
    return this.cities.removeTranslation(id, languageId);
  }
}
