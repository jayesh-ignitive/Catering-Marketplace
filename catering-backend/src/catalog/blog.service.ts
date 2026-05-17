import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagePublicUrlService } from '../storage/image-public-url.service';
import { BlogPost } from './blog-post.entity';

export type BlogPostSeoDto = {
  title: string;
  description: string;
  ogImageUrl: string | null;
};

export type BlogPostSummaryDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  featuredImageUrl: string | null;
  publishedAt: string;
  seo: BlogPostSeoDto;
};

export type BlogPostDetailDto = BlogPostSummaryDto & {
  bodyHtml: string;
};

@Injectable()
export class BlogService {
  private readonly log = new Logger(BlogService.name);
  private cachedPublished: BlogPostSummaryDto[] | null = null;

  constructor(
    @InjectRepository(BlogPost)
    private readonly repo: Repository<BlogPost>,
    private readonly imageUrls: ImagePublicUrlService,
  ) {}

  invalidateCache(): void {
    this.cachedPublished = null;
    this.log.debug('Blog posts cache cleared');
  }

  resolveImage(stored: string | null | undefined): string | null {
    return this.imageUrls.resolveToPublicUrl(stored);
  }

  normalizeImage(stored: string | null | undefined): string | null {
    if (stored == null) return null;
    const t = stored.trim();
    if (!t.length) return null;
    return this.imageUrls.stripToStorageKey(t) ?? t;
  }

  buildSeo(row: BlogPost): BlogPostSeoDto {
    return {
      title: (row.metaTitle?.trim() || row.title).slice(0, 70),
      description: (row.metaDescription?.trim() || row.excerpt).slice(0, 320),
      ogImageUrl:
        this.resolveImage(row.ogImageUrl) ??
        this.resolveImage(row.featuredImageUrl),
    };
  }

  private toSummary(row: BlogPost): BlogPostSummaryDto {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      categoryLabel: row.categoryLabel,
      featuredImageUrl: this.resolveImage(row.featuredImageUrl),
      publishedAt: row.publishedAt.toISOString(),
      seo: this.buildSeo(row),
    };
  }

  private async loadPublishedRows(): Promise<BlogPost[]> {
    return this.repo.find({
      where: { isPublished: true },
      order: { publishedAt: 'DESC' },
    });
  }

  private async getCachedPublishedSummaries(): Promise<BlogPostSummaryDto[]> {
    if (this.cachedPublished) {
      return this.cachedPublished;
    }
    const rows = await this.loadPublishedRows();
    this.cachedPublished = rows.map((r) => this.toSummary(r));
    return this.cachedPublished;
  }

  async listPublished(
    page: number,
    limit: number,
  ): Promise<{
    items: BlogPostSummaryDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const p = Number(page);
    const l = Number(limit);
    const safePage = Math.max(1, Number.isFinite(p) ? p : 1);
    const safeLimit = Math.min(50, Math.max(1, Number.isFinite(l) ? l : 12));
    const all = await this.getCachedPublishedSummaries();
    const start = (safePage - 1) * safeLimit;
    return {
      items: all.slice(start, start + safeLimit),
      total: all.length,
      page: safePage,
      limit: safeLimit,
    };
  }

  /** All published slugs for sitemap generation. */
  async listPublishedSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
    const rows = await this.loadPublishedRows();
    return rows.map((r) => ({
      slug: r.slug,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async getPublishedBySlug(slug: string): Promise<BlogPostDetailDto> {
    const row = await this.repo.findOne({
      where: { slug, isPublished: true },
    });
    if (!row) {
      throw new NotFoundException('Blog post not found');
    }
    return {
      ...this.toSummary(row),
      bodyHtml: row.bodyHtml,
    };
  }

  async listAll(): Promise<BlogPost[]> {
    return this.repo.find({
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<BlogPost | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findBySlugAny(slug: string): Promise<BlogPost | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async save(row: BlogPost): Promise<BlogPost> {
    const saved = await this.repo.save(row);
    this.invalidateCache();
    return saved;
  }

  async remove(row: BlogPost): Promise<void> {
    await this.repo.remove(row);
    this.invalidateCache();
  }
}
