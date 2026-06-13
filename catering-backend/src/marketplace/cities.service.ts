import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '../localization/language.entity';
import { CityTranslation } from './city-translation.entity';
import { City } from './city.entity';
import { Country } from './country.entity';
import { State } from './state.entity';

export type PublicCity = {
  id: string;
  slug: string;
  name: string;
  /** Legacy hero filter id when set (`1`–`10`). */
  legacyCatalogId: string | null;
  displayOrder: number;
};

export type FindOrCreateCityInput = {
  cityName: string;
  stateName?: string;
  countryName?: string;
};

const SUPPORTED_LOCALES = new Set(['en', 'hi', 'gu']);
const DEFAULT_COUNTRY_NAME = 'India';

function normalizeLocale(locale?: string): string {
  const raw = (locale ?? 'en').trim().toLowerCase();
  return SUPPORTED_LOCALES.has(raw) ? raw : 'en';
}

function slugifyCityName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
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
    @InjectRepository(CityTranslation)
    private readonly translations: Repository<CityTranslation>,
    @InjectRepository(State)
    private readonly states: Repository<State>,
    @InjectRepository(Country)
    private readonly countries: Repository<Country>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
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

  /**
   * Match an existing catalog city or insert a new row when Google Places returns
   * a locality that is not yet in the cities table.
   */
  async findOrCreateCityFromAddress(
    input: FindOrCreateCityInput,
  ): Promise<City> {
    const cityName = input.cityName.trim().slice(0, 120);
    if (!cityName) {
      throw new BadRequestException('cityName is required');
    }

    const country = await this.findOrCreateCountry(input.countryName);
    const state = await this.findOrCreateState(country, input.stateName);

    const existing = await this.findCityInState(state.id, cityName);
    if (existing) {
      return existing;
    }

    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new BadRequestException(
        'English language (code: en) must exist before creating cities',
      );
    }

    const slug = await this.ensureUniqueSlug(slugifyCityName(cityName) || 'city');

    const row = this.cities.create({
      state,
      name: cityName,
      slug,
      legacyCatalogId: null,
      displayOrder: 0,
      isActive: true,
    });
    const saved = await this.save(row);

    await this.translations.save(
      this.translations.create({
        city: saved,
        language: english,
        name: cityName,
      }),
    );

    this.log.log(
      `Created city "${cityName}" (${saved.id}) in ${state.name}, ${country.name}`,
    );
    return saved;
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

  private async findOrCreateCountry(countryName?: string): Promise<Country> {
    const name = (countryName?.trim() || DEFAULT_COUNTRY_NAME).slice(0, 120);
    const existing = await this.countries
      .createQueryBuilder('country')
      .where('LOWER(country.name) = LOWER(:name)', { name })
      .getOne();
    if (existing) {
      return existing;
    }

    const code =
      name.toLowerCase() === DEFAULT_COUNTRY_NAME.toLowerCase() ? 'IN' : null;
    return this.countries.save(this.countries.create({ name, code }));
  }

  private async findOrCreateState(
    country: Country,
    stateName?: string,
  ): Promise<State> {
    const name = (stateName?.trim() || 'Other').slice(0, 120);
    const existing = await this.states
      .createQueryBuilder('state')
      .where('state.country_id = :countryId', { countryId: country.id })
      .andWhere('LOWER(state.name) = LOWER(:name)', { name })
      .getOne();
    if (existing) {
      return existing;
    }

    return this.states.save(this.states.create({ country, name }));
  }

  private async findCityInState(
    stateId: string,
    cityName: string,
  ): Promise<City | null> {
    return this.cities
      .createQueryBuilder('city')
      .where('city.state_id = :stateId', { stateId })
      .andWhere('LOWER(city.name) = LOWER(:name)', { name: cityName.trim() })
      .getOne();
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let slug = base || 'city';
    for (let n = 0; n < 100; n++) {
      const candidate = (n === 0 ? slug : `${slug}-${n}`).slice(0, 120);
      const hit = await this.cities.findOne({ where: { slug: candidate } });
      if (!hit) {
        return candidate;
      }
    }
    throw new BadRequestException('Could not allocate a unique city slug');
  }
}
