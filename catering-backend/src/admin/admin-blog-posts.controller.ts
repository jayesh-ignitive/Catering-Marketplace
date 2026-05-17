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
import { AdminBlogPostsService } from './admin-blog-posts.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('admin/blog-posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBlogPostsController {
  constructor(private readonly adminBlogPosts: AdminBlogPostsService) {}

  @Get()
  list() {
    return this.adminBlogPosts.list();
  }

  @Post()
  create(@Body() dto: CreateBlogPostDto) {
    return this.adminBlogPosts.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.adminBlogPosts.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminBlogPosts.remove(id);
  }
}
