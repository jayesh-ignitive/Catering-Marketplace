import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../user/user-role.enum';
import { AdminContactSubmissionsService } from './admin-contact-submissions.service';
import { ListAdminContactSubmissionsQueryDto } from './dto/list-admin-contact-submissions-query.dto';
import { UpdateContactInquiryStatusDto } from './dto/update-contact-inquiry-status.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/contact-inquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminContactSubmissionsController {
  constructor(
    private readonly contactSubmissions: AdminContactSubmissionsService,
  ) {}

  @Get()
  list(@Query() query: ListAdminContactSubmissionsQueryDto) {
    return this.contactSubmissions.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactSubmissions.findOne(id);
  }

  @Patch(':id/status')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateContactInquiryStatusDto,
  ) {
    return this.contactSubmissions.setSolved(id, body.solved);
  }
}
