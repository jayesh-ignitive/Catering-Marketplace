import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './blog-post.entity';

export type BlogPostSummaryDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  featuredImageUrl: string | null;
  publishedAt: string;
};

export type BlogPostDetailDto = BlogPostSummaryDto & {
  bodyHtml: string;
};

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly repo: Repository<BlogPost>,
  ) {}

  private toSummary(row: BlogPost): BlogPostSummaryDto {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      categoryLabel: row.categoryLabel,
      featuredImageUrl: row.featuredImageUrl,
      publishedAt: row.publishedAt.toISOString(),
    };
  }

  async listPublished(page: number, limit: number): Promise<{
    items: BlogPostSummaryDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const p = Number(page);
    const l = Number(limit);
    const safePage = Math.max(1, Number.isFinite(p) ? p : 1);
    const safeLimit = Math.min(50, Math.max(1, Number.isFinite(l) ? l : 12));
    const [rows, total] = await this.repo.findAndCount({
      order: { publishedAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return {
      items: rows.map((r) => this.toSummary(r)),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async getBySlug(slug: string): Promise<BlogPostDetailDto> {
    const row = await this.repo.findOne({ where: { slug } });
    if (!row) {
      throw new NotFoundException('Blog post not found');
    }
    return {
      ...this.toSummary(row),
      bodyHtml: row.bodyHtml,
    };
  }
}
