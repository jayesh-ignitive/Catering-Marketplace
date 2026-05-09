import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngredientCategory } from '../catalog/ingredient-category.entity';
import { IngredientTranslation } from '../catalog/ingredient-translation.entity';
import { Ingredient } from '../catalog/ingredient.entity';
import { IngredientUnit } from '../catalog/ingredient-unit.enum';
import { Language } from '../localization/language.entity';
import {
  CreateIngredientDto,
  CreateIngredientTranslationDto,
} from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpsertIngredientTranslationDto } from './dto/upsert-ingredient-translation.dto';

export type AdminIngredientTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  shortName: string | null;
  description: string | null;
};

export type AdminIngredientItem = {
  id: string;
  ingredientCategoryId: string | null;
  ingredientCategorySlug: string | null;
  ingredientCode: string;
  sku: string | null;
  slug: string;
  image: string | null;
  purchaseUnit: IngredientUnit;
  consumptionUnit: IngredientUnit;
  conversionFactor: number;
  shelfLifeDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminIngredientTranslationItem[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
}

function ingredientCodeFromName(name: string): string {
  const base = name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 100);
  return base || 'INGREDIENT';
}

function toTranslationItem(
  row: IngredientTranslation,
): AdminIngredientTranslationItem {
  return {
    id: row.id,
    languageId: row.language.id,
    languageCode: row.language.code,
    languageName: row.language.name,
    name: row.name,
    shortName: row.shortName,
    description: row.description,
  };
}

function toIngredientItem(row: Ingredient): AdminIngredientItem {
  return {
    id: row.id,
    ingredientCategoryId: row.ingredientCategory?.id ?? null,
    ingredientCategorySlug: row.ingredientCategory?.slug ?? null,
    ingredientCode: row.ingredientCode,
    sku: row.sku,
    slug: row.slug,
    image: row.image,
    purchaseUnit: row.purchaseUnit,
    consumptionUnit: row.consumptionUnit,
    conversionFactor: Number(row.conversionFactor),
    shelfLifeDays: row.shelfLifeDays,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    translations: (row.translations ?? [])
      .slice()
      .sort((a, b) => a.language.code.localeCompare(b.language.code))
      .map(toTranslationItem),
  };
}

@Injectable()
export class AdminIngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredients: Repository<Ingredient>,
    @InjectRepository(IngredientTranslation)
    private readonly translations: Repository<IngredientTranslation>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
    @InjectRepository(IngredientCategory)
    private readonly categories: Repository<IngredientCategory>,
  ) {}

  async list(): Promise<AdminIngredientItem[]> {
    const rows = await this.ingredients.find({
      relations: {
        ingredientCategory: true,
        translations: { language: true },
      },
      order: { ingredientCode: 'ASC' },
    });
    return rows.map(toIngredientItem);
  }

  async create(dto: CreateIngredientDto): Promise<AdminIngredientItem> {
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new BadRequestException(
        'English language (code: en) must exist before creating ingredients',
      );
    }

    let category: IngredientCategory | null = null;
    if (dto.ingredientCategoryId != null) {
      category = await this.categories.findOne({
        where: { id: String(dto.ingredientCategoryId) },
      });
      if (!category) {
        throw new NotFoundException('Ingredient category not found');
      }
    }

    const baseCode =
      dto.ingredientCode?.trim() || ingredientCodeFromName(dto.englishName);
    const ingredientCode = await this.allocateIngredientCode(baseCode);

    const generatedSlug = slugify(dto.englishName);
    const slug = dto.slug?.trim() || generatedSlug;
    if (!slug) {
      throw new BadRequestException('Could not generate slug from English name');
    }
    const uniqueSlug = await this.allocateSlug(slug);

    const ingredient = this.ingredients.create({
      ingredientCategory: category,
      ingredientCode,
      sku: dto.sku?.trim() || null,
      slug: uniqueSlug,
      image: dto.image?.trim() || null,
      purchaseUnit: dto.purchaseUnit ?? IngredientUnit.KG,
      consumptionUnit: dto.consumptionUnit ?? IngredientUnit.GM,
      conversionFactor: String(dto.conversionFactor ?? 1),
      shelfLifeDays:
        dto.shelfLifeDays === undefined ? null : dto.shelfLifeDays,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.ingredients.save(ingredient);

    const baseTranslations: CreateIngredientTranslationDto[] = [
      {
        languageId: Number(english.id),
        name: dto.englishName,
        shortName: dto.englishShortName,
        description: dto.englishDescription,
      },
      ...(dto.translations ?? []),
    ];

    for (const t of baseTranslations) {
      await this.upsertTranslation(saved.id, {
        languageId: t.languageId,
        name: t.name,
        shortName: t.shortName,
        description: t.description,
      });
    }

    return this.findOneOrThrow(saved.id);
  }

  async update(
    id: string,
    dto: UpdateIngredientDto,
  ): Promise<AdminIngredientItem> {
    const row = await this.ingredients.findOne({
      where: { id },
      relations: { ingredientCategory: true },
    });
    if (!row) {
      throw new NotFoundException('Ingredient not found');
    }

    if (dto.ingredientCategoryId !== undefined) {
      if (dto.ingredientCategoryId === null) {
        row.ingredientCategory = null;
      } else {
        const cat = await this.categories.findOne({
          where: { id: String(dto.ingredientCategoryId) },
        });
        if (!cat) {
          throw new NotFoundException('Ingredient category not found');
        }
        row.ingredientCategory = cat;
      }
    }

    if (dto.ingredientCode !== undefined && dto.ingredientCode !== row.ingredientCode) {
      await this.ensureIngredientCodeAvailable(dto.ingredientCode, id);
      row.ingredientCode = dto.ingredientCode;
    }
    if (dto.slug !== undefined && dto.slug !== row.slug) {
      await this.ensureSlugAvailable(dto.slug, id);
      row.slug = dto.slug;
    }
    if (dto.sku !== undefined) row.sku = dto.sku?.trim() || null;
    if (dto.image !== undefined) row.image = dto.image?.trim() || null;
    if (dto.purchaseUnit !== undefined) row.purchaseUnit = dto.purchaseUnit;
    if (dto.consumptionUnit !== undefined) {
      row.consumptionUnit = dto.consumptionUnit;
    }
    if (dto.conversionFactor !== undefined) {
      row.conversionFactor = String(dto.conversionFactor);
    }
    if (dto.shelfLifeDays !== undefined) {
      row.shelfLifeDays = dto.shelfLifeDays;
    }
    if (dto.isActive !== undefined) row.isActive = dto.isActive;

    await this.ingredients.save(row);
    return this.findOneOrThrow(id);
  }

  async remove(id: string): Promise<{ success: true }> {
    const row = await this.ingredients.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Ingredient not found');
    }
    const translationRows = await this.translations.find({
      where: { ingredient: { id } },
    });
    for (const t of translationRows) {
      await this.translations.softRemove(t);
    }
    await this.ingredients.softRemove(row);
    return { success: true };
  }

  async upsertTranslation(
    ingredientId: string,
    dto: UpsertIngredientTranslationDto,
  ): Promise<AdminIngredientItem> {
    const ingredient = await this.ingredients.findOne({
      where: { id: ingredientId },
    });
    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    const existing = await this.translations.findOne({
      where: {
        ingredient: { id: ingredientId },
        language: { id: String(dto.languageId) },
      },
      relations: { ingredient: true, language: true },
      withDeleted: true,
    });

    const shortName = dto.shortName?.trim() || null;
    const description = dto.description?.trim() || null;

    if (existing) {
      if (existing.deletedAt) {
        await this.translations.recover(existing);
      }
      existing.name = dto.name;
      existing.shortName = shortName;
      existing.description = description;
      await this.translations.save(existing);
    } else {
      await this.translations.save(
        this.translations.create({
          ingredient,
          language,
          name: dto.name,
          shortName,
          description,
        }),
      );
    }
    return this.findOneOrThrow(ingredientId);
  }

  async removeTranslation(
    ingredientId: string,
    languageId: string,
  ): Promise<AdminIngredientItem> {
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
      where: { ingredient: { id: ingredientId }, language: { id: languageId } },
      relations: { language: true },
    });
    if (!hit) {
      throw new NotFoundException('Translation not found');
    }
    await this.translations.softRemove(hit);
    return this.findOneOrThrow(ingredientId);
  }

  private async findOneOrThrow(id: string): Promise<AdminIngredientItem> {
    const row = await this.ingredients.findOne({
      where: { id },
      relations: {
        ingredientCategory: true,
        translations: { language: true },
      },
    });
    if (!row) {
      throw new NotFoundException('Ingredient not found');
    }
    return toIngredientItem(row);
  }

  private async allocateIngredientCode(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    let candidate = base.slice(0, 100);
    let n = 0;
    for (;;) {
      const hit = await this.ingredients.findOne({
        where: { ingredientCode: candidate },
      });
      if (!hit || (excludeId !== undefined && hit.id === excludeId)) {
        return candidate;
      }
      n += 1;
      const suffix = `_${n}`;
      candidate = `${base.slice(0, Math.max(1, 100 - suffix.length))}${suffix}`;
    }
  }

  private async allocateSlug(base: string, excludeId?: string): Promise<string> {
    let candidate = base.slice(0, 255);
    let n = 0;
    for (;;) {
      const hit = await this.ingredients.findOne({
        where: { slug: candidate },
      });
      if (!hit || (excludeId !== undefined && hit.id === excludeId)) {
        return candidate;
      }
      n += 1;
      const suffix = `-${n}`;
      candidate = `${base.slice(0, Math.max(1, 255 - suffix.length))}${suffix}`;
    }
  }

  private async ensureIngredientCodeAvailable(
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const hit = await this.ingredients.findOne({
      where: { ingredientCode: code },
    });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('Ingredient code already exists');
    }
  }

  private async ensureSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const hit = await this.ingredients.findOne({ where: { slug } });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('Ingredient slug already exists');
    }
  }
}
