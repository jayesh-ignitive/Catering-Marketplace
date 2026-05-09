import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategoryTranslation } from '../catalog/menu-category-translation.entity';
import { MenuCategory } from '../catalog/menu-category.entity';
import { Language } from '../localization/language.entity';
import {
  CreateMenuCategoryDto,
  CreateMenuCategoryTranslationDto,
} from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { UpsertMenuCategoryTranslationDto } from './dto/upsert-menu-category-translation.dto';

export type AdminMenuCategoryTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  description: string | null;
};

export type AdminMenuCategoryItem = {
  id: string;
  parentId: string | null;
  slug: string;
  imageUrl: string | null;
  iconUrl: string | null;
  displayOrder: number;
  categoryType: string | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminMenuCategoryTranslationItem[];
};

function toTranslationItem(
  row: MenuCategoryTranslation,
): AdminMenuCategoryTranslationItem {
  return {
    id: row.id,
    languageId: row.language.id,
    languageCode: row.language.code,
    languageName: row.language.name,
    name: row.name,
    description: row.description,
  };
}

function toCategoryItem(row: MenuCategory): AdminMenuCategoryItem {
  return {
    id: row.id,
    parentId: row.parent?.id ?? null,
    slug: row.slug,
    imageUrl: row.imageUrl,
    iconUrl: row.iconUrl,
    displayOrder: row.displayOrder,
    categoryType: row.categoryType,
    isFeatured: row.isFeatured,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    translations: (row.translations ?? [])
      .slice()
      .sort((a, b) => a.language.code.localeCompare(b.language.code))
      .map(toTranslationItem),
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
}

function normalizeName(input: string): string {
  return input.trim().toLowerCase();
}

@Injectable()
export class AdminMenuCategoriesService {
  constructor(
    @InjectRepository(MenuCategory)
    private readonly categories: Repository<MenuCategory>,
    @InjectRepository(MenuCategoryTranslation)
    private readonly translations: Repository<MenuCategoryTranslation>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
  ) {}

  async list(): Promise<AdminMenuCategoryItem[]> {
    const rows = await this.categories.find({
      relations: {
        parent: true,
        translations: { language: true },
      },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    return rows.map(toCategoryItem);
  }

  async create(dto: CreateMenuCategoryDto): Promise<AdminMenuCategoryItem> {
    const generatedSlug = slugify(dto.englishName);
    const slug = dto.slug?.trim() || generatedSlug;
    if (!slug) {
      throw new BadRequestException(
        'Could not generate slug from English name',
      );
    }
    await this.ensureSlugAvailable(slug);
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new BadRequestException(
        'English language (code: en) must exist before creating categories',
      );
    }

    const parent = dto.parentId
      ? await this.categories.findOne({
          where: { id: String(dto.parentId) },
          relations: { parent: true },
        })
      : null;
    if (dto.parentId && !parent) {
      throw new NotFoundException('Parent category not found');
    }
    this.assertTwoLevelConstraint(parent);
    await this.ensureEnglishNameAvailableAtLevel(
      dto.englishName,
      parent?.id ?? null,
    );

    const category = this.categories.create({
      parent: parent ?? null,
      slug,
      imageUrl: dto.imageUrl ?? null,
      iconUrl: null,
      displayOrder: dto.displayOrder ?? 0,
      categoryType: null,
      isFeatured: dto.isFeatured ?? false,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.categories.save(category);

    const baseTranslations: CreateMenuCategoryTranslationDto[] = [
      {
        languageId: Number(english.id),
        name: dto.englishName,
        description: dto.englishDescription,
      },
      ...(dto.translations ?? []),
    ];

    for (const t of baseTranslations) {
      await this.upsertTranslation(saved.id, {
        languageId: t.languageId,
        name: t.name,
        description: t.description,
      });
    }

    return this.findOneOrThrow(saved.id);
  }

  async update(
    id: string,
    dto: UpdateMenuCategoryDto,
  ): Promise<AdminMenuCategoryItem> {
    const row = await this.categories.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Category not found');
    }
    if (dto.slug && dto.slug !== row.slug) {
      await this.ensureSlugAvailable(dto.slug, id);
      row.slug = dto.slug;
    }
    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        row.parent = null;
      } else {
        const parent = await this.categories.findOne({
          where: { id: String(dto.parentId) },
          relations: { parent: true },
        });
        if (!parent) {
          throw new NotFoundException('Parent category not found');
        }
        if (parent.id === id) {
          throw new BadRequestException('Category cannot be parent of itself');
        }
        this.assertTwoLevelConstraint(parent);
        row.parent = parent;
      }
    }
    const english = await this.translations.findOne({
      where: { category: { id }, language: { code: 'en' } },
      relations: { category: { parent: true }, language: true },
    });
    if (english?.name) {
      await this.ensureEnglishNameAvailableAtLevel(
        english.name,
        row.parent?.id ?? null,
        id,
      );
    }
    if (dto.imageUrl !== undefined) row.imageUrl = dto.imageUrl ?? null;
    if (dto.displayOrder !== undefined) row.displayOrder = dto.displayOrder;
    if (dto.isFeatured !== undefined) row.isFeatured = dto.isFeatured;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    await this.categories.save(row);
    return this.findOneOrThrow(id);
  }

  async remove(id: string): Promise<{ success: true }> {
    const row = await this.categories.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Category not found');
    }
    await this.categories.delete({ id });
    return { success: true };
  }

  async upsertTranslation(
    categoryId: string,
    dto: UpsertMenuCategoryTranslationDto,
  ): Promise<AdminMenuCategoryItem> {
    const category = await this.categories.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    if (language.code === 'en') {
      const categoryWithParent = await this.categories.findOne({
        where: { id: categoryId },
        relations: { parent: true },
      });
      await this.ensureEnglishNameAvailableAtLevel(
        dto.name,
        categoryWithParent?.parent?.id ?? null,
        categoryId,
      );
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
      existing.description = dto.description?.trim() || null;
      await this.translations.save(existing);
    } else {
      await this.translations.save(
        this.translations.create({
          category,
          language,
          name: dto.name,
          description: dto.description?.trim() || null,
        }),
      );
    }
    return this.findOneOrThrow(categoryId);
  }

  async removeTranslation(
    categoryId: string,
    languageId: string,
  ): Promise<AdminMenuCategoryItem> {
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
      relations: { language: true },
    });
    if (!hit) {
      throw new NotFoundException('Translation not found');
    }
    await this.translations.delete({ id: hit.id });
    return this.findOneOrThrow(categoryId);
  }

  private async findOneOrThrow(id: string): Promise<AdminMenuCategoryItem> {
    const row = await this.categories.findOne({
      where: { id },
      relations: { parent: true, translations: { language: true } },
    });
    if (!row) {
      throw new NotFoundException('Category not found');
    }
    return toCategoryItem(row);
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

  private assertTwoLevelConstraint(parent: MenuCategory | null): void {
    if (parent?.parent?.id) {
      throw new BadRequestException(
        'Only two levels are allowed (root and one child level)',
      );
    }
  }

  private async ensureEnglishNameAvailableAtLevel(
    englishName: string,
    parentId: string | null,
    excludeCategoryId?: string,
  ): Promise<void> {
    const normalized = normalizeName(englishName);
    const qb = this.translations
      .createQueryBuilder('t')
      .innerJoin('t.category', 'c')
      .innerJoin('t.language', 'l')
      .where('l.code = :code', { code: 'en' })
      .andWhere('LOWER(TRIM(t.name)) = :name', { name: normalized });

    if (parentId) {
      qb.andWhere('c.parent_id = :parentId', { parentId });
    } else {
      qb.andWhere('c.parent_id IS NULL');
    }
    if (excludeCategoryId) {
      qb.andWhere('c.id != :excludeCategoryId', { excludeCategoryId });
    }

    const hit = await qb.getOne();
    if (hit) {
      throw new BadRequestException(
        'Category name must be unique on the same level',
      );
    }
  }
}
