import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryTranslation } from '../marketplace/category-translation.entity';
import { Category } from '../marketplace/category.entity';
import { ServiceCategoriesService } from '../marketplace/service-categories.service';
import { Language } from '../localization/language.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { UpsertCategoryTranslationDto } from './dto/upsert-category-translation.dto';

export type AdminServiceCategoryTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  shortDescription: string;
};

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
  translations: AdminServiceCategoryTranslationItem[];
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function toTranslationItem(
  row: CategoryTranslation,
): AdminServiceCategoryTranslationItem {
  return {
    id: row.id,
    languageId: row.language.id,
    languageCode: row.language.code,
    languageName: row.language.name,
    name: row.name,
    shortDescription: row.shortDescription,
  };
}

function englishTranslation(row: Category): CategoryTranslation | undefined {
  return row.translations?.find((t) => t.language.code === 'en');
}

function toAdminItem(
  row: Category,
  profileLinkCount: number,
): AdminServiceCategoryItem {
  const en = englishTranslation(row);
  return {
    id: row.id,
    code: row.code,
    name: en?.name ?? row.name,
    slug: row.slug,
    shortDescription: en?.shortDescription ?? row.shortDescription,
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
    translations: (row.translations ?? [])
      .slice()
      .sort((a, b) => a.language.code.localeCompare(b.language.code))
      .map(toTranslationItem),
  };
}

@Injectable()
export class AdminServiceCategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(CategoryTranslation)
    private readonly translations: Repository<CategoryTranslation>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
    private readonly serviceCategories: ServiceCategoriesService,
  ) {}

  async list(): Promise<AdminServiceCategoryItem[]> {
    const rows = await this.serviceCategories.listAll();
    const counts = await this.profileLinkCounts();
    return rows.map((r) => toAdminItem(r, counts.get(r.id) ?? 0));
  }

  async create(dto: CreateServiceCategoryDto): Promise<AdminServiceCategoryItem> {
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new BadRequestException(
        'English language (code: en) must exist before creating categories',
      );
    }

    await this.ensureCodeAvailable(dto.code);
    const slug = dto.slug?.trim() || slugify(dto.englishName);
    await this.ensureSlugAvailable(slug);

    const row = this.categories.create({
      code: dto.code,
      name: dto.englishName,
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

    await this.translations.save(
      this.translations.create({
        category: saved,
        language: english,
        name: dto.englishName,
        shortDescription: dto.shortDescription,
      }),
    );

    return this.findOneOrThrow(saved.id);
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
    if (dto.slug != null) {
      await this.ensureSlugAvailable(dto.slug, id);
      row.slug = dto.slug;
    }
    if (dto.iconKey != null) row.iconKey = dto.iconKey;
    if (dto.iconUrl !== undefined) row.imageUrl = dto.iconUrl;
    if (dto.borderClass != null) row.borderClass = dto.borderClass;
    if (dto.iconWrapClass != null) row.iconWrapClass = dto.iconWrapClass;
    if (dto.titleHoverClass != null) row.titleHoverClass = dto.titleHoverClass;
    if (dto.displayOrder != null) row.displayOrder = dto.displayOrder;
    if (dto.isActive != null) row.isActive = dto.isActive;

    await this.serviceCategories.save(row);
    return this.findOneOrThrow(id);
  }

  async upsertTranslation(
    categoryId: string,
    dto: UpsertCategoryTranslationDto,
  ): Promise<AdminServiceCategoryItem> {
    const category = await this.categories.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Service category not found');
    }
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    const existing = await this.translations.findOne({
      where: {
        category: { id: categoryId },
        language: { id: String(dto.languageId) },
      },
      relations: { category: true, language: true },
    });

    if (existing) {
      existing.name = dto.name;
      existing.shortDescription = dto.shortDescription;
      await this.translations.save(existing);
    } else {
      await this.translations.save(
        this.translations.create({
          category,
          language,
          name: dto.name,
          shortDescription: dto.shortDescription,
        }),
      );
    }

    if (language.code === 'en') {
      category.name = dto.name;
      category.shortDescription = dto.shortDescription;
      await this.serviceCategories.save(category);
    }

    this.serviceCategories.invalidateCache();
    return this.findOneOrThrow(categoryId);
  }

  async removeTranslation(
    categoryId: string,
    languageId: string,
  ): Promise<AdminServiceCategoryItem> {
    const language = await this.languages.findOne({
      where: { id: languageId },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    if (language.code === 'en') {
      throw new BadRequestException('English translation cannot be removed');
    }
    const hit = await this.translations.findOne({
      where: { category: { id: categoryId }, language: { id: languageId } },
    });
    if (!hit) {
      throw new NotFoundException('Translation not found');
    }
    await this.translations.delete({ id: hit.id });
    this.serviceCategories.invalidateCache();
    return this.findOneOrThrow(categoryId);
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

  private async findOneOrThrow(id: string): Promise<AdminServiceCategoryItem> {
    const row = await this.categories.findOne({
      where: { id },
      relations: { translations: { language: true } },
    });
    if (!row) {
      throw new NotFoundException('Service category not found');
    }
    const counts = await this.profileLinkCounts();
    return toAdminItem(row, counts.get(row.id) ?? 0);
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
