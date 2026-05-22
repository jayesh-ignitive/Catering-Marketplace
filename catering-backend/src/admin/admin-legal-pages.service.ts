import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalPageTranslation } from '../legal/legal-page-translation.entity';
import { LegalPage, LegalPageSlug } from '../legal/legal-page.entity';
import { Language } from '../localization/language.entity';
import { UpdateLegalPageDto } from './dto/update-legal-page.dto';
import { UpsertLegalPageTranslationDto } from './dto/upsert-legal-page-translation.dto';

export type AdminLegalPageTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  title: string;
  lastUpdatedLabel: string;
  bodyHtml: string;
  updatedAt: string;
};

export type AdminLegalPageItem = {
  id: string;
  slug: LegalPageSlug;
  label: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminLegalPageTranslationItem[];
};

const SLUG_LABELS: Record<LegalPageSlug, string> = {
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
};

function toTranslationItem(
  row: LegalPageTranslation,
): AdminLegalPageTranslationItem {
  return {
    id: row.id,
    languageId: row.language.id,
    languageCode: row.language.code,
    languageName: row.language.name,
    title: row.title,
    lastUpdatedLabel: row.lastUpdatedLabel,
    bodyHtml: row.bodyHtml,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPageItem(row: LegalPage): AdminLegalPageItem {
  return {
    id: row.id,
    slug: row.slug,
    label: SLUG_LABELS[row.slug],
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    translations: (row.translations ?? [])
      .slice()
      .sort((a, b) => a.language.code.localeCompare(b.language.code))
      .map(toTranslationItem),
  };
}

@Injectable()
export class AdminLegalPagesService {
  constructor(
    @InjectRepository(LegalPage)
    private readonly pages: Repository<LegalPage>,
    @InjectRepository(LegalPageTranslation)
    private readonly translations: Repository<LegalPageTranslation>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
  ) {}

  async list(): Promise<AdminLegalPageItem[]> {
    const rows = await this.pages.find({
      relations: { translations: { language: true } },
      order: { slug: 'ASC' },
    });
    return rows.map(toPageItem);
  }

  async findOne(id: string): Promise<AdminLegalPageItem> {
    return this.findOneOrThrow(id);
  }

  async update(id: string, dto: UpdateLegalPageDto): Promise<AdminLegalPageItem> {
    const page = await this.pages.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException('Legal page not found');
    }
    if (dto.isPublished !== undefined) {
      page.isPublished = dto.isPublished;
      await this.pages.save(page);
    }
    return this.findOneOrThrow(id);
  }

  async upsertTranslation(
    pageId: string,
    dto: UpsertLegalPageTranslationDto,
  ): Promise<AdminLegalPageItem> {
    const page = await this.pages.findOne({ where: { id: pageId } });
    if (!page) {
      throw new NotFoundException('Legal page not found');
    }
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    const existing = await this.translations.findOne({
      where: {
        legalPage: { id: pageId },
        language: { id: String(dto.languageId) },
      },
      relations: { legalPage: true, language: true },
    });

    if (existing) {
      existing.title = dto.title;
      existing.lastUpdatedLabel = dto.lastUpdatedLabel;
      existing.bodyHtml = dto.bodyHtml;
      await this.translations.save(existing);
    } else {
      await this.translations.save(
        this.translations.create({
          legalPage: page,
          language,
          title: dto.title,
          lastUpdatedLabel: dto.lastUpdatedLabel,
          bodyHtml: dto.bodyHtml,
        }),
      );
    }

    return this.findOneOrThrow(pageId);
  }

  async removeTranslation(
    pageId: string,
    languageId: string,
  ): Promise<AdminLegalPageItem> {
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
      where: { legalPage: { id: pageId }, language: { id: languageId } },
    });
    if (!hit) {
      throw new NotFoundException('Translation not found');
    }
    await this.translations.delete({ id: hit.id });
    return this.findOneOrThrow(pageId);
  }

  private async findOneOrThrow(id: string): Promise<AdminLegalPageItem> {
    const row = await this.pages.findOne({
      where: { id },
      relations: { translations: { language: true } },
    });
    if (!row) {
      throw new NotFoundException('Legal page not found');
    }
    return toPageItem(row);
  }
}
