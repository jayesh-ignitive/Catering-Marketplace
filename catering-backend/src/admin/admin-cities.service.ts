import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CityTranslation } from '../marketplace/city-translation.entity';
import { City } from '../marketplace/city.entity';
import { CitiesService } from '../marketplace/cities.service';
import { State } from '../marketplace/state.entity';
import { Language } from '../localization/language.entity';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { UpsertCityTranslationDto } from './dto/upsert-city-translation.dto';

export type AdminStateOption = {
  id: string;
  name: string;
  countryName: string;
};

export type AdminCityTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
};

export type AdminCityItem = {
  id: string;
  slug: string;
  legacyCatalogId: string | null;
  stateId: string;
  stateName: string;
  countryName: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  profileLinkCount: number;
  createdAt: string;
  updatedAt: string;
  translations: AdminCityTranslationItem[];
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function toTranslationItem(row: CityTranslation): AdminCityTranslationItem {
  return {
    id: row.id,
    languageId: row.language.id,
    languageCode: row.language.code,
    languageName: row.language.name,
    name: row.name,
  };
}

function englishTranslation(row: City): CityTranslation | undefined {
  return row.translations?.find((t) => t.language.code === 'en');
}

function toCityItem(row: City, profileLinkCount: number): AdminCityItem {
  const en = englishTranslation(row);
  return {
    id: row.id,
    slug: row.slug,
    legacyCatalogId: row.legacyCatalogId,
    stateId: row.state.id,
    stateName: row.state.name,
    countryName: row.state.country?.name ?? '',
    name: en?.name ?? row.name,
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
export class AdminCitiesService {
  constructor(
    @InjectRepository(City)
    private readonly cities: Repository<City>,
    @InjectRepository(CityTranslation)
    private readonly translations: Repository<CityTranslation>,
    @InjectRepository(State)
    private readonly states: Repository<State>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
    private readonly citiesService: CitiesService,
  ) {}

  async listStates(): Promise<AdminStateOption[]> {
    const rows = await this.states.find({
      relations: { country: true },
      order: { country: { name: 'ASC' }, name: 'ASC' },
    });
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      countryName: s.country?.name ?? '',
    }));
  }

  async list(): Promise<AdminCityItem[]> {
    const rows = await this.citiesService.listAll();
    const counts = await this.profileLinkCounts();
    return rows.map((r) => toCityItem(r, counts.get(r.id) ?? 0));
  }

  async create(dto: CreateCityDto): Promise<AdminCityItem> {
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new BadRequestException(
        'English language (code: en) must exist before creating cities',
      );
    }
    const state = await this.states.findOne({
      where: { id: dto.stateId },
      relations: { country: true },
    });
    if (!state) {
      throw new NotFoundException('State not found');
    }

    const slug = dto.slug?.trim() || slugify(dto.englishName);
    await this.ensureSlugAvailable(slug);
    if (dto.legacyCatalogId) {
      await this.ensureLegacyIdAvailable(dto.legacyCatalogId);
    }

    const row = this.cities.create({
      state,
      name: dto.englishName,
      slug,
      legacyCatalogId: dto.legacyCatalogId?.trim() || null,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.citiesService.save(row);

    await this.translations.save(
      this.translations.create({
        city: saved,
        language: english,
        name: dto.englishName,
      }),
    );

    return this.findOneOrThrow(saved.id);
  }

  async update(id: string, dto: UpdateCityDto): Promise<AdminCityItem> {
    const row = await this.cities.findOne({
      where: { id },
      relations: { state: { country: true } },
    });
    if (!row) {
      throw new NotFoundException('City not found');
    }
    if (dto.stateId) {
      const state = await this.states.findOne({
        where: { id: dto.stateId },
        relations: { country: true },
      });
      if (!state) {
        throw new NotFoundException('State not found');
      }
      row.state = state;
    }
    if (dto.slug != null) {
      await this.ensureSlugAvailable(dto.slug, id);
      row.slug = dto.slug;
    }
    if (dto.legacyCatalogId !== undefined) {
      if (dto.legacyCatalogId) {
        await this.ensureLegacyIdAvailable(dto.legacyCatalogId, id);
      }
      row.legacyCatalogId = dto.legacyCatalogId;
    }
    if (dto.displayOrder != null) row.displayOrder = dto.displayOrder;
    if (dto.isActive != null) row.isActive = dto.isActive;

    await this.citiesService.save(row);
    return this.findOneOrThrow(id);
  }

  async upsertTranslation(
    cityId: string,
    dto: UpsertCityTranslationDto,
  ): Promise<AdminCityItem> {
    const city = await this.cities.findOne({ where: { id: cityId } });
    if (!city) {
      throw new NotFoundException('City not found');
    }
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    const existing = await this.translations.findOne({
      where: {
        city: { id: cityId },
        language: { id: String(dto.languageId) },
      },
      relations: { city: true, language: true },
    });

    if (existing) {
      existing.name = dto.name;
      await this.translations.save(existing);
    } else {
      await this.translations.save(
        this.translations.create({
          city,
          language,
          name: dto.name,
        }),
      );
    }

    if (language.code === 'en') {
      city.name = dto.name;
      await this.citiesService.save(city);
    }

    this.citiesService.invalidateCache();
    return this.findOneOrThrow(cityId);
  }

  async removeTranslation(
    cityId: string,
    languageId: string,
  ): Promise<AdminCityItem> {
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
      where: { city: { id: cityId }, language: { id: languageId } },
    });
    if (!hit) {
      throw new NotFoundException('Translation not found');
    }
    await this.translations.delete({ id: hit.id });
    this.citiesService.invalidateCache();
    return this.findOneOrThrow(cityId);
  }

  async remove(id: string): Promise<{ success: true }> {
    const row = await this.cities.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('City not found');
    }
    const count = await this.cities.manager.query(
      `SELECT COUNT(*) AS c FROM caterer_profiles WHERE city_id = ?`,
      [id],
    );
    const linked = Number(count?.[0]?.c ?? 0);
    if (linked > 0) {
      throw new BadRequestException(
        `Cannot delete: ${linked} caterer profile(s) use this city. Deactivate instead.`,
      );
    }
    await this.citiesService.remove(row);
    return { success: true };
  }

  private async findOneOrThrow(id: string): Promise<AdminCityItem> {
    const row = await this.cities.findOne({
      where: { id },
      relations: {
        state: { country: true },
        translations: { language: true },
      },
    });
    if (!row) {
      throw new NotFoundException('City not found');
    }
    const counts = await this.profileLinkCounts();
    return toCityItem(row, counts.get(row.id) ?? 0);
  }

  private async profileLinkCounts(): Promise<Map<string, number>> {
    const raw = (await this.cities.manager.query(
      `SELECT city_id AS cityId, COUNT(*) AS c
       FROM caterer_profiles
       WHERE city_id IS NOT NULL
       GROUP BY city_id`,
    )) as { cityId: string; c: string }[];
    const map = new Map<string, number>();
    for (const r of raw) {
      map.set(r.cityId, Number(r.c));
    }
    return map;
  }

  private async ensureSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const hit = await this.cities.findOne({ where: { slug } });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('City slug already exists');
    }
  }

  private async ensureLegacyIdAvailable(
    legacyCatalogId: string,
    excludeId?: string,
  ): Promise<void> {
    const hit = await this.cities.findOne({ where: { legacyCatalogId } });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('Legacy catalog id already exists');
    }
  }
}
