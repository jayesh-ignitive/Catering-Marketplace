import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CityTranslation } from './city-translation.entity';
import { City } from './city.entity';

export type PublicCity = {
  id: string;
  slug: string;
  name: string;
  /** Legacy hero filter id when set (`1`–`10`). */
  legacyCatalogId: string | null;
  displayOrder: number;
};

const SUPPORTED_LOCALES = new Set(['en', 'hi', 'gu']);

function normalizeLocale(locale?: string): string {
  const raw = (locale ?? 'en').trim().toLowerCase();
  return SUPPORTED_LOCALES.has(raw) ? raw : 'en';
}

function resolveName(row: City, locale: string): string {
  const translations = row.translations ?? [];
  const byCode = new Map(translations.map((t) => [t.language.code, t]));
  const hit = byCode.get(locale) ?? byCode.get('en');
  return hit?.name ?? row.name;
}

function toPublic(row: City, locale: string): PublicCity {
  return {
    id: row.id,
    slug: row.slug,
    name: resolveName(row, locale),
    legacyCatalogId: row.legacyCatalogId,
    displayOrder: row.displayOrder,
  };
}

@Injectable()
export class CitiesService {
  private readonly log = new Logger(CitiesService.name);
  private readonly cachedPublic = new Map<string, PublicCity[]>();

  constructor(
    @InjectRepository(City)
    private readonly cities: Repository<City>,
  ) {}

  invalidateCache(): void {
    this.cachedPublic.clear();
    this.log.debug('Cities cache cleared');
  }

  async listPublicActive(locale?: string): Promise<PublicCity[]> {
    const code = normalizeLocale(locale);
    const cached = this.cachedPublic.get(code);
    if (cached) {
      return cached;
    }
    const rows = await this.cities.find({
      where: { isActive: true },
      relations: { translations: { language: true } },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
    const mapped = rows.map((r) => toPublic(r, code));
    this.cachedPublic.set(code, mapped);
    return mapped;
  }

  async listAll(): Promise<City[]> {
    return this.cities.find({
      relations: {
        state: { country: true },
        translations: { language: true },
      },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<City | null> {
    return this.cities.findOne({
      where: { id },
      relations: {
        state: { country: true },
        translations: { language: true },
      },
    });
  }

  async save(row: City): Promise<City> {
    const saved = await this.cities.save(row);
    this.invalidateCache();
    return saved;
  }

  async remove(row: City): Promise<void> {
    await this.cities.remove(row);
    this.invalidateCache();
  }
}
