import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Language } from '../localization/language.entity';
import { ListingPlanComparisonRowTranslation } from './listing-plan-comparison-row-translation.entity';
import { ListingPlanComparisonRow } from './listing-plan-comparison-row.entity';
import { ListingPlanTranslation } from './listing-plan-translation.entity';
import { ListingPlan } from './listing-plan.entity';
import { ListingPackagesPageTranslation } from './listing-packages-page-translation.entity';

export type PublicListingPlanDto = {
  id: string;
  code: string;
  priceDisplay: string;
  icon: string;
  isRecommended: boolean;
  isDarkTheme: boolean;
  contactTopic: string;
  name: string;
  subtitle: string;
  periodLabel: string;
  ctaLabel: string;
  features: string[];
};

export type PublicComparisonRowDto = {
  id: string;
  label: string;
  essential: boolean | string;
  growth: boolean | string;
  premier: boolean | string;
};

export type PublicPackagesPageDto = {
  page: {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    valueTitle: string;
    valueBody: string;
    discoverTitle: string;
    discoverSubtitle: string;
    comparisonTitle: string;
    comparisonHint: string;
    featureColumnLabel: string;
    tierEssentialLabel: string;
    tierGrowthLabel: string;
    tierPremierLabel: string;
    recommendedBadge: string;
    audienceTitle: string;
    audienceSubtitle: string;
    audienceTags: string[];
    helpTitle: string;
    helpBody: string;
    browseDirectoryLabel: string;
    disclaimerText: string;
  };
  plans: PublicListingPlanDto[];
  comparisonRows: PublicComparisonRowDto[];
  languageCode: string;
  fallback: boolean;
};

const SUPPORTED = new Set(['en', 'hi', 'gu']);

function parseCell(value: string): boolean | string {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function parseFeatures(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    /* empty */
  }
  return [];
}

@Injectable()
export class ListingPackagesService {
  constructor(
    @InjectRepository(ListingPackagesPageTranslation)
    private readonly pageTranslations: Repository<ListingPackagesPageTranslation>,
    @InjectRepository(ListingPlan)
    private readonly plans: Repository<ListingPlan>,
    @InjectRepository(ListingPlanTranslation)
    private readonly planTranslations: Repository<ListingPlanTranslation>,
    @InjectRepository(ListingPlanComparisonRow)
    private readonly comparisonRows: Repository<ListingPlanComparisonRow>,
    @InjectRepository(ListingPlanComparisonRowTranslation)
    private readonly comparisonTranslations: Repository<ListingPlanComparisonRowTranslation>,
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
  ) {}

  normalizeLocale(locale?: string): string {
    const code = (locale ?? 'en').trim().toLowerCase();
    return SUPPORTED.has(code) ? code : 'en';
  }

  async getPublicPage(locale?: string): Promise<PublicPackagesPageDto> {
    const code = this.normalizeLocale(locale);
    const language = await this.languages.findOne({ where: { code } });
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new Error('English language not configured');
    }

    let pageTr = language
      ? await this.pageTranslations.findOne({
          where: { language: { id: language.id } },
          relations: { language: true },
        })
      : null;

    let fallback = false;
    if (!pageTr && language?.id !== english.id) {
      pageTr = await this.pageTranslations.findOne({
        where: { language: { id: english.id } },
        relations: { language: true },
      });
      fallback = true;
    } else if (!pageTr) {
      pageTr = await this.pageTranslations.findOne({
        where: { language: { id: english.id } },
        relations: { language: true },
      });
    }

    if (!pageTr) {
      throw new NotFoundException('Packages page content not found');
    }

    const langId = pageTr.language.id;
    const activePlans = await this.plans.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });

    const planIds = activePlans.map((p) => p.id);
    const planTrs =
      planIds.length > 0
        ? await this.planTranslations.find({
            where: {
              plan: { id: In(planIds) },
              language: { id: langId },
            },
            relations: { plan: true },
          })
        : [];
    const planTrByPlanId = new Map(planTrs.map((t) => [t.plan.id, t]));

    const rows = await this.comparisonRows.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
    const rowIds = rows.map((r) => r.id);
    const rowTrs =
      rowIds.length > 0
        ? await this.comparisonTranslations.find({
            where: {
              row: { id: In(rowIds) },
              language: { id: langId },
            },
            relations: { row: true },
          })
        : [];
    const rowTrByRowId = new Map(rowTrs.map((t) => [t.row.id, t]));

    let audienceTags: string[] = [];
    try {
      const parsed = JSON.parse(pageTr.audienceTagsJson) as unknown;
      if (Array.isArray(parsed)) {
        audienceTags = parsed.filter((x): x is string => typeof x === 'string');
      }
    } catch {
      audienceTags = [];
    }

    const publicPlans: PublicListingPlanDto[] = [];
    for (const plan of activePlans) {
      const tr = planTrByPlanId.get(plan.id);
      if (!tr) continue;
      publicPlans.push({
        id: plan.id,
        code: plan.code,
        priceDisplay: plan.priceDisplay,
        icon: plan.icon,
        isRecommended: plan.isRecommended,
        isDarkTheme: plan.isDarkTheme,
        contactTopic: plan.contactTopic,
        name: tr.name,
        subtitle: tr.subtitle,
        periodLabel: tr.periodLabel,
        ctaLabel: tr.ctaLabel,
        features: parseFeatures(tr.featuresJson),
      });
    }

    const publicRows: PublicComparisonRowDto[] = [];
    for (const row of rows) {
      const tr = rowTrByRowId.get(row.id);
      if (!tr) continue;
      publicRows.push({
        id: row.id,
        label: tr.label,
        essential: parseCell(tr.essentialValue),
        growth: parseCell(tr.growthValue),
        premier: parseCell(tr.premierValue),
      });
    }

    return {
      page: {
        heroEyebrow: pageTr.heroEyebrow,
        heroTitle: pageTr.heroTitle,
        heroSubtitle: pageTr.heroSubtitle,
        valueTitle: pageTr.valueTitle,
        valueBody: pageTr.valueBody,
        discoverTitle: pageTr.discoverTitle,
        discoverSubtitle: pageTr.discoverSubtitle,
        comparisonTitle: pageTr.comparisonTitle,
        comparisonHint: pageTr.comparisonHint,
        featureColumnLabel: pageTr.featureColumnLabel,
        tierEssentialLabel: pageTr.tierEssentialLabel,
        tierGrowthLabel: pageTr.tierGrowthLabel,
        tierPremierLabel: pageTr.tierPremierLabel,
        recommendedBadge: pageTr.recommendedBadge,
        audienceTitle: pageTr.audienceTitle,
        audienceSubtitle: pageTr.audienceSubtitle,
        audienceTags,
        helpTitle: pageTr.helpTitle,
        helpBody: pageTr.helpBody,
        browseDirectoryLabel: pageTr.browseDirectoryLabel,
        disclaimerText: pageTr.disclaimerText,
      },
      plans: publicPlans,
      comparisonRows: publicRows,
      languageCode: pageTr.language?.code ?? code,
      fallback,
    };
  }
}
