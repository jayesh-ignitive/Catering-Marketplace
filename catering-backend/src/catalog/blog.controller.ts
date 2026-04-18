import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListBlogQueryDto } from './dto/list-blog-query.dto';
import { BlogService } from './blog.service';

@Controller('catalog/blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  list(@Query() query: ListBlogQueryDto) {
    return this.blog.listPublished(query.page ?? 1, query.limit ?? 12);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.blog.getBySlug(slug);
  }
}
