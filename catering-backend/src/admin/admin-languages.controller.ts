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
import { AdminLanguagesService } from './admin-languages.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Controller('admin/languages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminLanguagesController {
  constructor(private readonly adminLanguages: AdminLanguagesService) {}

  @Get()
  list() {
    return this.adminLanguages.list();
  }

  @Post()
  create(@Body() dto: CreateLanguageDto) {
    return this.adminLanguages.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLanguageDto) {
    return this.adminLanguages.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminLanguages.remove(id);
  }
}
