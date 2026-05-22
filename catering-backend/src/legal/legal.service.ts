import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '../localization/language.entity';
import { LegalPageTranslation } from './legal-page-translation.entity';
import { LegalPage, LegalPageSlug } from './legal-page.entity';

export type PublicLegalPageDto = {
  slug: LegalPageSlug;
  title: string;
  lastUpdatedLabel: string;
  bodyHtml: string;
  languageCode: string;
  fallback: boolean;
};

const SUPPORTED_LOCALES = new Set(['en', 'hi', 'gu']);

@Injectable()
export class LegalService {
  constructor(
    @InjectRepository(LegalPage)
    private readonly pages: Repository<LegalPage>,
    @InjectRepository(LegalPageTranslation)
    private readonly translations: Repository<LegalPageTranslation>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
    private readonly config: ConfigService,
  ) {}

  async getPublished(slug: string, locale?: string): Promise<PublicLegalPageDto> {
    const normalizedSlug = slug as LegalPageSlug;
    if (normalizedSlug !== 'terms' && normalizedSlug !== 'privacy') {
      throw new NotFoundException('Legal page not found');
    }

    const page = await this.pages.findOne({ where: { slug: normalizedSlug } });
    if (!page?.isPublished) {
      throw new NotFoundException('Legal page not found');
    }

    const code = this.normalizeLocale(locale);
    const language = await this.languages.findOne({ where: { code } });
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new NotFoundException('Legal page not available');
    }

    let translation: LegalPageTranslation | null = null;
    let fallback = false;

    if (language) {
      translation = await this.translations.findOne({
        where: {
          legalPage: { id: page.id },
          language: { id: language.id },
        },
        relations: { language: true },
      });
    }

    if (!translation && language?.id !== english.id) {
      translation = await this.translations.findOne({
        where: {
          legalPage: { id: page.id },
          language: { id: english.id },
        },
        relations: { language: true },
      });
      fallback = true;
    } else if (!translation) {
      translation = await this.translations.findOne({
        where: {
          legalPage: { id: page.id },
          language: { id: english.id },
        },
        relations: { language: true },
      });
    }

    if (!translation) {
      throw new NotFoundException('Legal page content not found');
    }

    return {
      slug: normalizedSlug,
      title: translation.title,
      lastUpdatedLabel: translation.lastUpdatedLabel,
      bodyHtml: this.applyPlaceholders(translation.bodyHtml),
      languageCode: translation.language?.code ?? code,
      fallback,
    };
  }

  applyPlaceholders(html: string): string {
    const siteName = this.config.get('SITE_NAME', 'Bharat Caterers');
    const siteUrl = this.config.get('SITE_URL', 'https://bharatcaterers.com');
    const contactEmail = this.config.get(
      'CONTACT_EMAIL',
      'hello@bharatcaterers.in',
    );
    const phoneDisplay = this.config.get(
      'SUPPORT_PHONE_DISPLAY',
      '+91 01234 56789',
    );
    const phoneTel = this.config.get('SUPPORT_PHONE_TEL', '+910123456789');

    const supportPhoneInline =
      phoneDisplay && phoneTel
        ? ` · <a href="tel:${phoneTel}">${phoneDisplay}</a>`
        : '';

    return html
      .replaceAll('{{siteName}}', siteName)
      .replaceAll('{{siteUrl}}', siteUrl)
      .replaceAll('{{contactEmail}}', contactEmail)
      .replaceAll('{{supportPhoneInline}}', supportPhoneInline);
  }

  private normalizeLocale(locale?: string): string {
    const raw = (locale ?? 'en').trim().toLowerCase();
    return SUPPORTED_LOCALES.has(raw) ? raw : 'en';
  }
}
