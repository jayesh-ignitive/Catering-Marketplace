import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../user/user-role.enum';
import { AdminCaterersService } from './admin-caterers.service';
import { ListAdminCaterersQueryDto } from './dto/list-admin-caterers-query.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/caterers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCaterersController {
  constructor(private readonly adminCaterers: AdminCaterersService) {}

  @Get()
  list(@Query() query: ListAdminCaterersQueryDto) {
    return this.adminCaterers.list(query);
  }
}
