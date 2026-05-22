import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

export type PublicServiceCategory = {
  /** Legacy filter id — stable `code` (e.g. `c1`). */
  id: string;
  code: string;
  uuid: string;
  name: string;
  slug: string;
  shortDescription: string;
  iconKey: string;
  /** Uploaded icon asset URL (stored in `image_url` column). */
  iconUrl: string | null;
  borderClass: string;
  iconWrapClass: string;
  titleHoverClass: string;
  displayOrder: number;
};

const SUPPORTED_LOCALES = new Set(['en', 'hi', 'gu']);

function normalizeLocale(locale?: string): string {
  const raw = (locale ?? 'en').trim().toLowerCase();
  return SUPPORTED_LOCALES.has(raw) ? raw : 'en';
}

function resolveCopy(
  row: Category,
  locale: string,
): { name: string; shortDescription: string } {
  const translations = row.translations ?? [];
  const byCode = new Map(translations.map((t) => [t.language.code, t]));
  const hit = byCode.get(locale) ?? byCode.get('en');
  return {
    name: hit?.name ?? row.name,
    shortDescription: hit?.shortDescription ?? row.shortDescription,
  };
}

function toPublic(row: Category, locale: string): PublicServiceCategory {
  const copy = resolveCopy(row, locale);
  return {
    id: row.code,
    code: row.code,
    uuid: row.id,
    name: copy.name,
    slug: row.slug,
    shortDescription: copy.shortDescription,
    iconKey: row.iconKey,
    iconUrl: row.imageUrl,
    borderClass: row.borderClass,
    iconWrapClass: row.iconWrapClass,
    titleHoverClass: row.titleHoverClass,
    displayOrder: row.displayOrder,
  };
}

@Injectable()
export class ServiceCategoriesService {
  private readonly log = new Logger(ServiceCategoriesService.name);
  private readonly cachedPublic = new Map<string, PublicServiceCategory[]>();

  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  /** In-memory cache for public catalog reads; cleared on admin writes. */
  invalidateCache(): void {
    this.cachedPublic.clear();
    this.log.debug('Service categories cache cleared');
  }

  async listPublicActive(locale?: string): Promise<PublicServiceCategory[]> {
    const code = normalizeLocale(locale);
    const cached = this.cachedPublic.get(code);
    if (cached) {
      return cached;
    }
    const rows = await this.categories.find({
      where: { isActive: true },
      relations: { translations: { language: true } },
      order: { displayOrder: 'ASC', code: 'ASC' },
    });
    const mapped = rows.map((r) => toPublic(r, code));
    this.cachedPublic.set(code, mapped);
    return mapped;
  }

  async listAll(): Promise<Category[]> {
    return this.categories.find({
      relations: { translations: { language: true } },
      order: { displayOrder: 'ASC', code: 'ASC' },
    });
  }

  async findByUuid(id: string): Promise<Category | null> {
    return this.categories.findOne({
      where: { id },
      relations: { translations: { language: true } },
    });
  }

  async findByCode(code: string): Promise<Category | null> {
    return this.categories.findOne({
      where: { code },
      relations: { translations: { language: true } },
    });
  }

  async save(row: Category): Promise<Category> {
    const saved = await this.categories.save(row);
    this.invalidateCache();
    return saved;
  }

  async remove(row: Category): Promise<void> {
    await this.categories.remove(row);
    this.invalidateCache();
  }
}
