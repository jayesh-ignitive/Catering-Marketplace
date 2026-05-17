import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../user/user.entity';
import { UserRole } from '../user/user-role.enum';
import { AdminCaterersService } from './admin-caterers.service';
import { ListAdminCaterersQueryDto } from './dto/list-admin-caterers-query.dto';
import { SetCatererMarketplaceApprovalDto } from './dto/set-caterer-marketplace-approval.dto';
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

  @Get(':tenantId/review')
  getReviewDetail(@Param('tenantId') tenantId: string) {
    return this.adminCaterers.getReviewDetail(tenantId);
  }

  @Patch(':tenantId/marketplace-approval')
  setMarketplaceApproval(
    @Param('tenantId') tenantId: string,
    @Body() body: SetCatererMarketplaceApprovalDto,
    @Req() req: Request & { user: User },
  ) {
    return this.adminCaterers.setMarketplaceApproval(
      tenantId,
      body.decision,
      req.user.id,
    );
  }
}
