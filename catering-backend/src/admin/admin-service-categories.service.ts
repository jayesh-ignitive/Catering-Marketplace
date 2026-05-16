import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../marketplace/category.entity';
import { ServiceCategoriesService } from '../marketplace/service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

export type AdminServiceCategoryItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  shortDescription: string;
  iconKey: string;
  iconUrl: string | null;
  borderClass: string;
  iconWrapClass: string;
  titleHoverClass: string;
  displayOrder: number;
  isActive: boolean;
  profileLinkCount: number;
  createdAt: string;
  updatedAt: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function toAdminItem(
  row: Category,
  profileLinkCount: number,
): AdminServiceCategoryItem {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    iconKey: row.iconKey,
    iconUrl: row.imageUrl,
    borderClass: row.borderClass,
    iconWrapClass: row.iconWrapClass,
    titleHoverClass: row.titleHoverClass,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
    profileLinkCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class AdminServiceCategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    private readonly serviceCategories: ServiceCategoriesService,
  ) {}

  async list(): Promise<AdminServiceCategoryItem[]> {
    const rows = await this.serviceCategories.listAll();
    const counts = await this.profileLinkCounts();
    return rows.map((r) => toAdminItem(r, counts.get(r.id) ?? 0));
  }

  async create(dto: CreateServiceCategoryDto): Promise<AdminServiceCategoryItem> {
    await this.ensureCodeAvailable(dto.code);
    const slug = dto.slug?.trim() || slugify(dto.name);
    await this.ensureSlugAvailable(slug);

    const row = this.categories.create({
      code: dto.code,
      name: dto.name,
      slug,
      shortDescription: dto.shortDescription,
      iconKey: dto.iconKey ?? 'bowl-food',
      imageUrl: dto.iconUrl ?? null,
      borderClass: dto.borderClass ?? 'border-brand-red',
      iconWrapClass:
        dto.iconWrapClass ??
        'bg-red-50 text-brand-red group-hover:bg-brand-red group-hover:text-white',
      titleHoverClass: dto.titleHoverClass ?? 'group-hover:text-brand-red',
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.serviceCategories.save(row);
    return toAdminItem(saved, 0);
  }

  async update(
    id: string,
    dto: UpdateServiceCategoryDto,
  ): Promise<AdminServiceCategoryItem> {
    const row = await this.categories.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Service category not found');
    }
    if (dto.code && dto.code !== row.code) {
      await this.ensureCodeAvailable(dto.code, id);
      row.code = dto.code;
    }
    if (dto.name != null) row.name = dto.name;
    if (dto.slug != null) {
      await this.ensureSlugAvailable(dto.slug, id);
      row.slug = dto.slug;
    } else if (dto.name != null && !dto.slug) {
      const nextSlug = slugify(dto.name);
      if (nextSlug !== row.slug) {
        await this.ensureSlugAvailable(nextSlug, id);
        row.slug = nextSlug;
      }
    }
    if (dto.shortDescription != null) row.shortDescription = dto.shortDescription;
    if (dto.iconKey != null) row.iconKey = dto.iconKey;
    if (dto.iconUrl !== undefined) row.imageUrl = dto.iconUrl;
    if (dto.borderClass != null) row.borderClass = dto.borderClass;
    if (dto.iconWrapClass != null) row.iconWrapClass = dto.iconWrapClass;
    if (dto.titleHoverClass != null) row.titleHoverClass = dto.titleHoverClass;
    if (dto.displayOrder != null) row.displayOrder = dto.displayOrder;
    if (dto.isActive != null) row.isActive = dto.isActive;

    const saved = await this.serviceCategories.save(row);
    const counts = await this.profileLinkCounts();
    return toAdminItem(saved, counts.get(saved.id) ?? 0);
  }

  async remove(id: string): Promise<{ success: true }> {
    const row = await this.categories.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Service category not found');
    }
    const count = await this.categories.manager.query(
      `SELECT COUNT(*) AS c FROM caterer_profile_categories WHERE category_id = ?`,
      [id],
    );
    const linked = Number(count?.[0]?.c ?? 0);
    if (linked > 0) {
      throw new BadRequestException(
        `Cannot delete: ${linked} caterer profile(s) use this category. Deactivate instead.`,
      );
    }
    await this.serviceCategories.remove(row);
    return { success: true };
  }

  private async profileLinkCounts(): Promise<Map<string, number>> {
    const raw = (await this.categories.manager.query(
      `SELECT category_id AS categoryId, COUNT(*) AS c
       FROM caterer_profile_categories
       GROUP BY category_id`,
    )) as { categoryId: string; c: string }[];
    const map = new Map<string, number>();
    for (const r of raw) {
      map.set(r.categoryId, Number(r.c));
    }
    return map;
  }

  private async ensureCodeAvailable(
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const hit = await this.categories.findOne({ where: { code } });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('Category code already exists');
    }
  }

  private async ensureSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const hit = await this.categories.findOne({ where: { slug } });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('Category slug already exists');
    }
  }
}
