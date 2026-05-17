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
import { AdminHomeBannersService } from './admin-home-banners.service';
import { CreateHomeBannerDto } from './dto/create-home-banner.dto';
import { UpdateHomeBannerDto } from './dto/update-home-banner.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/home-banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminHomeBannersController {
  constructor(private readonly adminHomeBanners: AdminHomeBannersService) {}

  @Get()
  list() {
    return this.adminHomeBanners.list();
  }

  @Post()
  create(@Body() dto: CreateHomeBannerDto) {
    return this.adminHomeBanners.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHomeBannerDto) {
    return this.adminHomeBanners.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminHomeBanners.remove(id);
  }
}
