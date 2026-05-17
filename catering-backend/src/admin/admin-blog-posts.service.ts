import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from '../catalog/blog-post.entity';
import { BlogService } from '../catalog/blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

export type AdminBlogPostItem = {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  excerpt: string;
  metaDescription: string | null;
  bodyHtml: string;
  categoryLabel: string;
  featuredImageUrl: string | null;
  featuredImageResolved: string | null;
  ogImageUrl: string | null;
  ogImageResolved: string | null;
  publishedAt: string;
  isPublished: boolean;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function toAdminItem(row: BlogPost, blog: BlogService): AdminBlogPostItem {
  const seo = blog.buildSeo(row);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    metaTitle: row.metaTitle,
    excerpt: row.excerpt,
    metaDescription: row.metaDescription,
    bodyHtml: row.bodyHtml,
    categoryLabel: row.categoryLabel,
    featuredImageUrl: row.featuredImageUrl,
    featuredImageResolved: blog.resolveImage(row.featuredImageUrl),
    ogImageUrl: row.ogImageUrl,
    ogImageResolved: blog.resolveImage(row.ogImageUrl),
    publishedAt: row.publishedAt.toISOString(),
    isPublished: row.isPublished,
    seoTitle: seo.title,
    seoDescription: seo.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class AdminBlogPostsService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly posts: Repository<BlogPost>,
    private readonly blog: BlogService,
  ) {}

  async list(): Promise<AdminBlogPostItem[]> {
    const rows = await this.blog.listAll();
    return rows.map((r) => toAdminItem(r, this.blog));
  }

  async create(dto: CreateBlogPostDto): Promise<AdminBlogPostItem> {
    const slug = dto.slug?.trim() || slugify(dto.title);
    await this.ensureSlugAvailable(slug);

    const row = this.posts.create({
      slug,
      title: dto.title,
      metaTitle: dto.metaTitle ?? null,
      excerpt: dto.excerpt,
      metaDescription: dto.metaDescription ?? null,
      bodyHtml: dto.bodyHtml,
      categoryLabel: dto.categoryLabel?.trim() || 'Insights',
      featuredImageUrl: this.blog.normalizeImage(dto.featuredImageUrl),
      ogImageUrl: this.blog.normalizeImage(dto.ogImageUrl),
      publishedAt: new Date(dto.publishedAt),
      isPublished: dto.isPublished ?? true,
    });
    const saved = await this.blog.save(row);
    return toAdminItem(saved, this.blog);
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<AdminBlogPostItem> {
    const row = await this.posts.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Blog post not found');
    }
    if (dto.slug && dto.slug !== row.slug) {
      await this.ensureSlugAvailable(dto.slug, id);
      row.slug = dto.slug;
    }
    if (dto.title != null) row.title = dto.title;
    if (dto.metaTitle !== undefined) row.metaTitle = dto.metaTitle;
    if (dto.excerpt != null) row.excerpt = dto.excerpt;
    if (dto.metaDescription !== undefined) row.metaDescription = dto.metaDescription;
    if (dto.bodyHtml != null) row.bodyHtml = dto.bodyHtml;
    if (dto.categoryLabel != null) row.categoryLabel = dto.categoryLabel;
    if (dto.featuredImageUrl !== undefined) {
      row.featuredImageUrl = this.blog.normalizeImage(dto.featuredImageUrl);
    }
    if (dto.ogImageUrl !== undefined) {
      row.ogImageUrl = this.blog.normalizeImage(dto.ogImageUrl);
    }
    if (dto.publishedAt != null) row.publishedAt = new Date(dto.publishedAt);
    if (dto.isPublished != null) row.isPublished = dto.isPublished;

    const saved = await this.blog.save(row);
    return toAdminItem(saved, this.blog);
  }

  async remove(id: string): Promise<{ success: true }> {
    const row = await this.posts.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Blog post not found');
    }
    await this.blog.remove(row);
    return { success: true };
  }

  private async ensureSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const hit = await this.posts.findOne({ where: { slug } });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('Slug already in use');
    }
  }
}
