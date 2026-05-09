import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeTranslation } from '../catalog/attribute-translation.entity';
import { Attribute } from '../catalog/attribute.entity';
import { Language } from '../localization/language.entity';
import {
  CreateAttributeDto,
  CreateAttributeTranslationDto,
} from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { UpsertAttributeTranslationDto } from './dto/upsert-attribute-translation.dto';

export type AdminAttributeTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
};

export type AdminAttributeItem = {
  id: string;
  type: string;
  image: string | null;
  isSearchable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminAttributeTranslationItem[];
};

function toTranslationItem(
  row: AttributeTranslation,
): AdminAttributeTranslationItem {
  return {
    id: row.id,
    languageId: row.language.id,
    languageCode: row.language.code,
    languageName: row.language.name,
    name: row.name,
  };
}

function toAttributeItem(row: Attribute): AdminAttributeItem {
  return {
    id: row.id,
    type: row.type,
    image: row.image,
    isSearchable: row.isSearchable,
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
export class AdminAttributesService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributes: Repository<Attribute>,
    @InjectRepository(AttributeTranslation)
    private readonly translations: Repository<AttributeTranslation>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
  ) {}

  async list(): Promise<AdminAttributeItem[]> {
    const rows = await this.attributes.find({
      relations: {
        translations: { language: true },
      },
      order: { type: 'ASC', id: 'ASC' },
    });
    return rows.map(toAttributeItem);
  }

  async create(dto: CreateAttributeDto): Promise<AdminAttributeItem> {
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new BadRequestException(
        'English language (code: en) must exist before creating attributes',
      );
    }

    const attribute = this.attributes.create({
      type: dto.type,
      image: dto.image?.trim() || null,
      isSearchable: dto.isSearchable ?? true,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.attributes.save(attribute);

    const baseTranslations: CreateAttributeTranslationDto[] = [
      {
        languageId: Number(english.id),
        name: dto.englishName,
      },
      ...(dto.translations ?? []),
    ];

    for (const t of baseTranslations) {
      await this.upsertTranslation(saved.id, {
        languageId: t.languageId,
        name: t.name,
      });
    }

    return this.findOneOrThrow(saved.id);
  }

  async update(
    id: string,
    dto: UpdateAttributeDto,
  ): Promise<AdminAttributeItem> {
    const row = await this.attributes.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Attribute not found');
    }
    if (dto.type !== undefined) row.type = dto.type;
    if (dto.image !== undefined) row.image = dto.image;
    if (dto.isSearchable !== undefined) row.isSearchable = dto.isSearchable;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;

    await this.attributes.save(row);
    return this.findOneOrThrow(id);
  }

  async remove(id: string): Promise<{ success: true }> {
    const row = await this.attributes.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Attribute not found');
    }
    await this.attributes.softRemove(row);
    return { success: true };
  }

  async upsertTranslation(
    attributeId: string,
    dto: UpsertAttributeTranslationDto,
  ): Promise<AdminAttributeItem> {
    const attribute = await this.attributes.findOne({
      where: { id: attributeId },
    });
    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    const existing = await this.translations.findOne({
      where: {
        attribute: { id: attributeId },
        language: { id: String(dto.languageId) },
      },
      relations: { attribute: true, language: true },
    });
    if (existing) {
      existing.name = dto.name;
      await this.translations.save(existing);
    } else {
      await this.translations.save(
        this.translations.create({
          attribute,
          language,
          name: dto.name,
        }),
      );
    }
    return this.findOneOrThrow(attributeId);
  }

  async removeTranslation(
    attributeId: string,
    languageId: string,
  ): Promise<AdminAttributeItem> {
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
      where: { attribute: { id: attributeId }, language: { id: languageId } },
      relations: { language: true },
    });
    if (!hit) {
      throw new NotFoundException('Translation not found');
    }
    await this.translations.delete({ id: hit.id });
    return this.findOneOrThrow(attributeId);
  }

  private async findOneOrThrow(id: string): Promise<AdminAttributeItem> {
    const row = await this.attributes.findOne({
      where: { id },
      relations: { translations: { language: true } },
    });
    if (!row) {
      throw new NotFoundException('Attribute not found');
    }
    return toAttributeItem(row);
  }
}
