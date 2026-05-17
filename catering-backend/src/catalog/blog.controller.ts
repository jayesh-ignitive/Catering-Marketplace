import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ListBlogQueryDto } from './dto/list-blog-query.dto';
import { BlogService } from './blog.service';

@Controller('catalog/blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  list(@Query() query: ListBlogQueryDto) {
    return this.blog.listPublished(query.page ?? 1, query.limit ?? 12);
  }

  @Get('slugs')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  slugs() {
    return this.blog.listPublishedSlugs();
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  detail(@Param('slug') slug: string) {
    return this.blog.getPublishedBySlug(slug);
  }
}
