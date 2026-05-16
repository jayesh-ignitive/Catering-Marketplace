import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeType } from '../catalog/attribute-type.enum';
import { Attribute } from '../catalog/attribute.entity';
import { IngredientUnit } from '../catalog/ingredient-unit.enum';
import { Ingredient } from '../catalog/ingredient.entity';
import { MenuCategory } from '../catalog/menu-category.entity';
import { MenuItemAttribute } from '../catalog/menu-item-attribute.entity';
import { MenuItemIngredient } from '../catalog/menu-item-ingredient.entity';
import { MenuItemTranslation } from '../catalog/menu-item-translation.entity';
import { MenuItem } from '../catalog/menu-item.entity';
import { Language } from '../localization/language.entity';
import { User } from '../user/user.entity';
import { AddMenuItemAttributeDto } from './dto/add-menu-item-attribute.dto';
import {
  CreateMenuItemDto,
  CreateMenuItemIngredientLineDto,
} from './dto/create-menu-item.dto';
import { CreateMenuItemIngredientDto } from './dto/create-menu-item-ingredient.dto';
import { UpdateMenuItemIngredientDto } from './dto/update-menu-item-ingredient.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpsertMenuItemTranslationDto } from './dto/upsert-menu-item-translation.dto';

export type AdminMenuItemTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  description: string | null;
};

export type AdminMenuItemIngredientRow = {
  id: string;
  ingredientId: string;
  ingredientCode: string;
  ingredientSlug: string;
  quantity: number;
  unit: IngredientUnit;
  isOptional: boolean;
  notes: string | null;
};

export type AdminMenuItemAttributeRow = {
  id: string;
  attributeId: string;
  attributeType: AttributeType;
};

export type AdminMenuItemItem = {
  id: string;
  categoryId: string;
  categorySlug: string;
  subcategoryId: string | null;
  subcategorySlug: string | null;
  itemCode: string;
  slug: string;
  image: string | null;
  gallery: string[] | null;
  videoUrl: string | null;
  preparationTime: number;
  cookingTime: number;
  shelfLifeHours: number | null;
  baseCost: number;
  isActive: boolean;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  translations: AdminMenuItemTranslationItem[];
  ingredients: AdminMenuItemIngredientRow[];
  attributes: AdminMenuItemAttributeRow[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
}

function itemCodeFromName(name: string): string {
  const base = name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 100);
  return base || 'MENU_ITEM';
}

function toTranslationItem(row: MenuItemTranslation): AdminMenuItemTranslationItem {
  return {
    id: row.id,
    languageId: row.language.id,
    languageCode: row.language.code,
    languageName: row.language.name,
    name: row.name,
    description: row.description,
  };
}

function toIngredientRow(row: MenuItemIngredient): AdminMenuItemIngredientRow {
  return {
    id: row.id,
    ingredientId: row.ingredient.id,
    ingredientCode: row.ingredient.ingredientCode,
    ingredientSlug: row.ingredient.slug,
    quantity: Number(row.quantity),
    unit: row.unit,
    isOptional: row.isOptional,
    notes: row.notes,
  };
}

function toAttributeRow(row: MenuItemAttribute): AdminMenuItemAttributeRow {
  return {
    id: row.id,
    attributeId: row.attribute.id,
    attributeType: row.attribute.type,
  };
}

function toMenuItemItem(row: MenuItem): AdminMenuItemItem {
  return {
    id: row.id,
    categoryId: row.category.id,
    categorySlug: row.category.slug,
    subcategoryId: row.subcategory?.id ?? null,
    subcategorySlug: row.subcategory?.slug ?? null,
    itemCode: row.itemCode,
    slug: row.slug,
    image: row.image,
    gallery: row.gallery ?? null,
    videoUrl: row.videoUrl,
    preparationTime: row.preparationTime,
    cookingTime: row.cookingTime,
    shelfLifeHours: row.shelfLifeHours,
    baseCost: Number(row.baseCost),
    isActive: row.isActive,
    createdById: row.createdBy?.id ?? null,
    updatedById: row.updatedBy?.id ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    translations: (row.translations ?? [])
      .slice()
      .sort((a, b) => a.language.code.localeCompare(b.language.code))
      .map(toTranslationItem),
    ingredients: (row.recipeIngredients ?? [])
      .slice()
      .sort((a, b) => a.ingredient.ingredientCode.localeCompare(b.ingredient.ingredientCode))
      .map(toIngredientRow),
    attributes: (row.attributeLinks ?? [])
      .slice()
      .sort((a, b) => a.attribute.id.localeCompare(b.attribute.id))
      .map(toAttributeRow),
  };
}

@Injectable()
export class AdminMenuItemsService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItems: Repository<MenuItem>,
    @InjectRepository(MenuItemTranslation)
    private readonly translations: Repository<MenuItemTranslation>,
    @InjectRepository(MenuItemIngredient)
    private readonly recipeIngredients: Repository<MenuItemIngredient>,
    @InjectRepository(MenuItemAttribute)
    private readonly menuItemAttributes: Repository<MenuItemAttribute>,
    @InjectRepository(MenuCategory)
    private readonly menuCategories: Repository<MenuCategory>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
    @InjectRepository(Ingredient)
    private readonly ingredients: Repository<Ingredient>,
    @InjectRepository(Attribute)
    private readonly attributes: Repository<Attribute>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async list(): Promise<AdminMenuItemItem[]> {
    const rows = await this.menuItems.find({
      relations: {
        category: true,
        subcategory: true,
        createdBy: true,
        updatedBy: true,
        translations: { language: true },
        recipeIngredients: { ingredient: true },
        attributeLinks: { attribute: true },
      },
      order: { itemCode: 'ASC' },
    });
    return rows.map(toMenuItemItem);
  }

  async getById(id: string): Promise<AdminMenuItemItem> {
    return this.findOneOrThrow(id);
  }

  async create(
    actorUserId: string | undefined,
    dto: CreateMenuItemDto,
  ): Promise<AdminMenuItemItem> {
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new BadRequestException(
        'English language (code: en) must exist before creating menu items',
      );
    }

    const { category, subcategory } = await this.validateCategoryPair(
      String(dto.categoryId),
      dto.subcategoryId != null ? String(dto.subcategoryId) : null,
    );

    const baseCode =
      dto.itemCode?.trim().toUpperCase() || itemCodeFromName(dto.englishName);
    const itemCode = await this.allocateItemCode(baseCode);

    const generatedSlug = slugify(dto.englishName);
    const slug = dto.slug?.trim() || generatedSlug;
    if (!slug) {
      throw new BadRequestException('Could not generate slug from English name');
    }
    const uniqueSlug = await this.allocateSlug(slug);

    const actor =
      actorUserId != null
        ? await this.users.findOne({ where: { id: actorUserId } })
        : null;

    const menuItem = this.menuItems.create({
      category,
      subcategory,
      itemCode,
      slug: uniqueSlug,
      image: dto.image?.trim() || null,
      gallery:
        dto.gallery != null && dto.gallery.length > 0 ? dto.gallery : null,
      videoUrl: dto.videoUrl?.trim() || null,
      preparationTime: dto.preparationTime ?? 0,
      cookingTime: dto.cookingTime ?? 0,
      shelfLifeHours:
        dto.shelfLifeHours === undefined ? null : dto.shelfLifeHours,
      baseCost: String(dto.baseCost ?? 0),
      isActive: dto.isActive ?? true,
      createdBy: actor ?? null,
      updatedBy: actor ?? null,
    });
    const saved = await this.menuItems.save(menuItem);

    await this.upsertTranslation(saved.id, {
      languageId: Number(english.id),
      name: dto.englishName,
      description: dto.englishDescription?.trim() || undefined,
    });

    const englishLangNum = Number(english.id);
    for (const t of dto.translations ?? []) {
      if (t.languageId === englishLangNum) continue;
      await this.upsertTranslation(saved.id, {
        languageId: t.languageId,
        name: t.name,
        description: t.description,
      });
    }

    for (const line of dto.ingredients ?? []) {
      await this.addIngredient(saved.id, line);
    }

    for (const aid of dto.attributeIds ?? []) {
      await this.addAttribute(saved.id, actorUserId, { attributeId: aid });
    }

    return this.findOneOrThrow(saved.id);
  }

  async update(
    actorUserId: string | undefined,
    id: string,
    dto: UpdateMenuItemDto,
  ): Promise<AdminMenuItemItem> {
    const row = await this.menuItems.findOne({
      where: { id },
      relations: { category: true, subcategory: true },
    });
    if (!row) {
      throw new NotFoundException('Menu item not found');
    }

    if (dto.categoryId !== undefined || dto.subcategoryId !== undefined) {
      const nextCategoryId =
        dto.categoryId !== undefined ? String(dto.categoryId) : row.category.id;
      const nextSubId =
        dto.subcategoryId !== undefined
          ? dto.subcategoryId === null
            ? null
            : String(dto.subcategoryId)
          : row.subcategory?.id ?? null;
      const { category, subcategory } = await this.validateCategoryPair(
        nextCategoryId,
        nextSubId,
      );
      row.category = category;
      row.subcategory = subcategory;
    }

    if (dto.itemCode !== undefined && dto.itemCode !== row.itemCode) {
      await this.ensureItemCodeAvailable(dto.itemCode, id);
      row.itemCode = dto.itemCode.trim().toUpperCase();
    }
    if (dto.slug !== undefined && dto.slug !== row.slug) {
      await this.ensureSlugAvailable(dto.slug, id);
      row.slug = dto.slug.trim();
    }
    if (dto.image !== undefined) row.image = dto.image?.trim() || null;
    if (dto.gallery !== undefined) {
      row.gallery =
        dto.gallery != null && dto.gallery.length > 0 ? dto.gallery : null;
    }
    if (dto.videoUrl !== undefined) {
      row.videoUrl = dto.videoUrl?.trim() || null;
    }
    if (dto.preparationTime !== undefined) {
      row.preparationTime = dto.preparationTime;
    }
    if (dto.cookingTime !== undefined) row.cookingTime = dto.cookingTime;
    if (dto.shelfLifeHours !== undefined) {
      row.shelfLifeHours = dto.shelfLifeHours;
    }
    if (dto.baseCost !== undefined) row.baseCost = String(dto.baseCost);
    if (dto.isActive !== undefined) row.isActive = dto.isActive;

    if (actorUserId != null) {
      const actor = await this.users.findOne({ where: { id: actorUserId } });
      row.updatedBy = actor ?? null;
    }

    await this.menuItems.save(row);

    if (dto.attributeIds !== undefined) {
      await this.syncReplaceAttributeLinks(id, dto.attributeIds);
    }
    if (dto.ingredients !== undefined) {
      await this.syncReplaceRecipeLines(id, dto.ingredients);
    }

    return this.findOneOrThrow(id);
  }

  async remove(id: string): Promise<{ success: true }> {
    const row = await this.menuItems.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Menu item not found');
    }

    const translationRows = await this.translations.find({
      where: { menuItem: { id } },
    });
    for (const t of translationRows) {
      await this.translations.softRemove(t);
    }

    await this.recipeIngredients
      .createQueryBuilder()
      .delete()
      .where('menu_item_id = :id', { id })
      .execute();

    await this.menuItemAttributes
      .createQueryBuilder()
      .delete()
      .where('menu_item_id = :id', { id })
      .execute();

    await this.menuItems.softRemove(row);
    return { success: true };
  }

  async upsertTranslation(
    menuItemId: string,
    dto: UpsertMenuItemTranslationDto,
  ): Promise<AdminMenuItemItem> {
    const menuItem = await this.menuItems.findOne({ where: { id: menuItemId } });
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    const name = dto.name.trim();
    const description = dto.description?.trim() || null;

    const existing = await this.translations.findOne({
      where: {
        menuItem: { id: menuItemId },
        language: { id: String(dto.languageId) },
      },
      relations: { menuItem: true, language: true },
      withDeleted: true,
    });

    if (existing) {
      if (existing.deletedAt) {
        await this.translations.recover(existing);
      }
      existing.name = name;
      existing.description = description;
      await this.translations.save(existing);
    } else {
      await this.translations.save(
        this.translations.create({
          menuItem,
          language,
          name,
          description,
        }),
      );
    }
    return this.findOneOrThrow(menuItemId);
  }

  async removeTranslation(
    menuItemId: string,
    languageId: string,
  ): Promise<AdminMenuItemItem> {
    const language = await this.languages.findOne({ where: { id: languageId } });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    if (language.code === 'en') {
      throw new BadRequestException('English translation cannot be removed');
    }
    const hit = await this.translations.findOne({
      where: { menuItem: { id: menuItemId }, language: { id: languageId } },
      relations: { language: true },
    });
    if (!hit) {
      throw new NotFoundException('Translation not found');
    }
    await this.translations.softRemove(hit);
    return this.findOneOrThrow(menuItemId);
  }

  async addIngredient(
    menuItemId: string,
    dto: CreateMenuItemIngredientDto | CreateMenuItemIngredientLineDto,
  ): Promise<AdminMenuItemItem> {
    const menuItem = await this.menuItems.findOne({ where: { id: menuItemId } });
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }
    const ingredient = await this.ingredients.findOne({
      where: { id: String(dto.ingredientId) },
    });
    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    const dup = await this.recipeIngredients.findOne({
      where: {
        menuItem: { id: menuItemId },
        ingredient: { id: ingredient.id },
      },
    });
    if (dup) {
      throw new BadRequestException(
        'This ingredient is already linked to the menu item',
      );
    }

    await this.recipeIngredients.save(
      this.recipeIngredients.create({
        menuItem,
        ingredient,
        quantity: String(dto.quantity),
        unit: dto.unit ?? IngredientUnit.GM,
        isOptional: dto.isOptional ?? false,
        notes: dto.notes?.trim() || null,
      }),
    );
    return this.findOneOrThrow(menuItemId);
  }

  async updateIngredient(
    menuItemId: string,
    rowId: string,
    dto: UpdateMenuItemIngredientDto,
  ): Promise<AdminMenuItemItem> {
    const row = await this.recipeIngredients.findOne({
      where: { id: rowId, menuItem: { id: menuItemId } },
    });
    if (!row) {
      throw new NotFoundException('Recipe line not found');
    }
    if (dto.quantity !== undefined) row.quantity = String(dto.quantity);
    if (dto.unit !== undefined) row.unit = dto.unit;
    if (dto.isOptional !== undefined) row.isOptional = dto.isOptional;
    if (dto.notes !== undefined) row.notes = dto.notes?.trim() || null;
    await this.recipeIngredients.save(row);
    return this.findOneOrThrow(menuItemId);
  }

  async removeIngredient(menuItemId: string, rowId: string): Promise<AdminMenuItemItem> {
    const row = await this.recipeIngredients.findOne({
      where: { id: rowId, menuItem: { id: menuItemId } },
    });
    if (!row) {
      throw new NotFoundException('Recipe line not found');
    }
    await this.recipeIngredients.remove(row);
    return this.findOneOrThrow(menuItemId);
  }

  async addAttribute(
    menuItemId: string,
    actorUserId: string | undefined,
    dto: AddMenuItemAttributeDto,
  ): Promise<AdminMenuItemItem> {
    const menuItem = await this.menuItems.findOne({ where: { id: menuItemId } });
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }
    const attribute = await this.attributes.findOne({
      where: { id: String(dto.attributeId) },
    });
    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    const dup = await this.menuItemAttributes.findOne({
      where: {
        menuItem: { id: menuItemId },
        attribute: { id: attribute.id },
      },
    });
    if (dup) {
      throw new BadRequestException('Attribute already linked to this menu item');
    }

    await this.menuItemAttributes.save(
      this.menuItemAttributes.create({ menuItem, attribute }),
    );

    if (actorUserId != null) {
      const actor = await this.users.findOne({ where: { id: actorUserId } });
      menuItem.updatedBy = actor ?? null;
      await this.menuItems.save(menuItem);
    }

    return this.findOneOrThrow(menuItemId);
  }

  async removeAttribute(
    menuItemId: string,
    actorUserId: string | undefined,
    attributeId: string,
  ): Promise<AdminMenuItemItem> {
    const link = await this.menuItemAttributes.findOne({
      where: {
        menuItem: { id: menuItemId },
        attribute: { id: attributeId },
      },
      relations: { menuItem: true },
    });
    if (!link) {
      throw new NotFoundException('Attribute link not found');
    }
    await this.menuItemAttributes.remove(link);

    if (actorUserId != null) {
      const menuItem = await this.menuItems.findOne({ where: { id: menuItemId } });
      if (menuItem) {
        const actor = await this.users.findOne({ where: { id: actorUserId } });
        menuItem.updatedBy = actor ?? null;
        await this.menuItems.save(menuItem);
      }
    }

    return this.findOneOrThrow(menuItemId);
  }

  private async validateCategoryPair(
    categoryId: string,
    subcategoryId: string | null,
  ): Promise<{ category: MenuCategory; subcategory: MenuCategory | null }> {
    const category = await this.menuCategories.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Menu category not found');
    }
    if (subcategoryId == null) {
      return { category, subcategory: null };
    }
    const sub = await this.menuCategories.findOne({
      where: { id: subcategoryId },
      relations: { parent: true },
    });
    if (!sub) {
      throw new NotFoundException('Menu subcategory not found');
    }
    if (sub.parent?.id !== category.id) {
      throw new BadRequestException(
        'Subcategory must be a direct child of the selected category',
      );
    }
    return { category, subcategory: sub };
  }

  private async syncReplaceAttributeLinks(
    menuItemId: string,
    ids: number[],
  ): Promise<void> {
    const unique = [...new Set(ids)];
    for (const n of unique) {
      const hit = await this.attributes.findOne({ where: { id: String(n) } });
      if (!hit) {
        throw new NotFoundException(`Attribute not found: ${n}`);
      }
    }

    await this.menuItemAttributes
      .createQueryBuilder()
      .delete()
      .where('menu_item_id = :id', { id: menuItemId })
      .execute();

    const menuItem = await this.menuItems.findOne({ where: { id: menuItemId } });
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    for (const n of unique) {
      const attribute = await this.attributes.findOne({
        where: { id: String(n) },
      });
      if (!attribute) {
        continue;
      }
      await this.menuItemAttributes.save(
        this.menuItemAttributes.create({ menuItem, attribute }),
      );
    }
  }

  private async syncReplaceRecipeLines(
    menuItemId: string,
    lines: CreateMenuItemIngredientLineDto[],
  ): Promise<void> {
    const seen = new Set<number>();
    for (const line of lines) {
      if (seen.has(line.ingredientId)) {
        throw new BadRequestException(
          'Duplicate ingredient in recipe payload',
        );
      }
      seen.add(line.ingredientId);
    }

    await this.recipeIngredients
      .createQueryBuilder()
      .delete()
      .where('menu_item_id = :id', { id: menuItemId })
      .execute();

    const menuItem = await this.menuItems.findOne({ where: { id: menuItemId } });
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    for (const line of lines) {
      const ingredient = await this.ingredients.findOne({
        where: { id: String(line.ingredientId) },
      });
      if (!ingredient) {
        throw new NotFoundException(
          `Ingredient not found: ${line.ingredientId}`,
        );
      }
      await this.recipeIngredients.save(
        this.recipeIngredients.create({
          menuItem,
          ingredient,
          quantity: String(line.quantity),
          unit: line.unit ?? IngredientUnit.GM,
          isOptional: line.isOptional ?? false,
          notes: line.notes?.trim() || null,
        }),
      );
    }
  }

  private async findOneOrThrow(id: string): Promise<AdminMenuItemItem> {
    const row = await this.menuItems.findOne({
      where: { id },
      relations: {
        category: true,
        subcategory: true,
        createdBy: true,
        updatedBy: true,
        translations: { language: true },
        recipeIngredients: { ingredient: true },
        attributeLinks: { attribute: true },
      },
    });
    if (!row) {
      throw new NotFoundException('Menu item not found');
    }
    return toMenuItemItem(row);
  }

  private async allocateItemCode(base: string, excludeId?: string): Promise<string> {
    let candidate = base.slice(0, 100);
    let n = 0;
    for (;;) {
      const hit = await this.menuItems.findOne({
        where: { itemCode: candidate },
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
      const hit = await this.menuItems.findOne({
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

  private async ensureItemCodeAvailable(code: string, excludeId?: string): Promise<void> {
    const normalized = code.trim().toUpperCase();
    const hit = await this.menuItems.findOne({
      where: { itemCode: normalized },
    });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('Item code already exists');
    }
  }

  private async ensureSlugAvailable(slug: string, excludeId?: string): Promise<void> {
    const hit = await this.menuItems.findOne({
      where: { slug: slug.trim() },
    });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('Slug already exists');
    }
  }
}
