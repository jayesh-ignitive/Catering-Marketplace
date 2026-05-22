import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListingPlanComparisonRowTranslation } from '../listing-packages/listing-plan-comparison-row-translation.entity';
import { ListingPlanComparisonRow } from '../listing-packages/listing-plan-comparison-row.entity';
import { ListingPlanTranslation } from '../listing-packages/listing-plan-translation.entity';
import { ListingPlan, ListingPlanCode } from '../listing-packages/listing-plan.entity';
import { ListingPackagesPageTranslation } from '../listing-packages/listing-packages-page-translation.entity';
import { Language } from '../localization/language.entity';
import { CreateListingComparisonRowDto } from './dto/create-listing-comparison-row.dto';
import { CreateListingPlanDto } from './dto/create-listing-plan.dto';
import { UpdateListingComparisonRowDto } from './dto/update-listing-comparison-row.dto';
import { UpdateListingPlanDto } from './dto/update-listing-plan.dto';
import { UpsertListingComparisonRowTranslationDto } from './dto/upsert-listing-comparison-row-translation.dto';
import { UpsertListingPackagesPageTranslationDto } from './dto/upsert-listing-packages-page-translation.dto';
import { UpsertListingPlanTranslationDto } from './dto/upsert-listing-plan-translation.dto';

export type AdminPageTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
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
  updatedAt: string;
};

export type AdminPlanTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  subtitle: string;
  periodLabel: string;
  ctaLabel: string;
  features: string[];
  updatedAt: string;
};

export type AdminListingPlanItem = {
  id: string;
  code: ListingPlanCode;
  priceDisplay: string;
  icon: string;
  isRecommended: boolean;
  isDarkTheme: boolean;
  displayOrder: number;
  isActive: boolean;
  contactTopic: string;
  createdAt: string;
  updatedAt: string;
  translations: AdminPlanTranslationItem[];
};

export type AdminComparisonTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  label: string;
  essentialValue: string;
  growthValue: string;
  premierValue: string;
  updatedAt: string;
};

export type AdminComparisonRowItem = {
  id: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminComparisonTranslationItem[];
};

export type AdminListingPackagesBundle = {
  pageTranslations: AdminPageTranslationItem[];
  plans: AdminListingPlanItem[];
  comparisonRows: AdminComparisonRowItem[];
};

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

function parseAudienceTags(json: string): string[] {
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
export class AdminListingPackagesService {
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

  async getBundle(): Promise<AdminListingPackagesBundle> {
    const [pageRows, planRows, compRows] = await Promise.all([
      this.pageTranslations.find({ relations: { language: true } }),
      this.plans.find({
        relations: { translations: { language: true } },
        order: { displayOrder: 'ASC' },
      }),
      this.comparisonRows.find({
        relations: { translations: { language: true } },
        order: { sortOrder: 'ASC' },
      }),
    ]);

    return {
      pageTranslations: pageRows
        .slice()
        .sort((a, b) => a.language.code.localeCompare(b.language.code))
        .map((row) => ({
          id: row.id,
          languageId: row.language.id,
          languageCode: row.language.code,
          languageName: row.language.name,
          heroEyebrow: row.heroEyebrow,
          heroTitle: row.heroTitle,
          heroSubtitle: row.heroSubtitle,
          valueTitle: row.valueTitle,
          valueBody: row.valueBody,
          discoverTitle: row.discoverTitle,
          discoverSubtitle: row.discoverSubtitle,
          comparisonTitle: row.comparisonTitle,
          comparisonHint: row.comparisonHint,
          featureColumnLabel: row.featureColumnLabel,
          tierEssentialLabel: row.tierEssentialLabel,
          tierGrowthLabel: row.tierGrowthLabel,
          tierPremierLabel: row.tierPremierLabel,
          recommendedBadge: row.recommendedBadge,
          audienceTitle: row.audienceTitle,
          audienceSubtitle: row.audienceSubtitle,
          audienceTags: parseAudienceTags(row.audienceTagsJson),
          helpTitle: row.helpTitle,
          helpBody: row.helpBody,
          browseDirectoryLabel: row.browseDirectoryLabel,
          disclaimerText: row.disclaimerText,
          updatedAt: row.updatedAt.toISOString(),
        })),
      plans: planRows.map((plan) => ({
        id: plan.id,
        code: plan.code,
        priceDisplay: plan.priceDisplay,
        icon: plan.icon,
        isRecommended: plan.isRecommended,
        isDarkTheme: plan.isDarkTheme,
        displayOrder: plan.displayOrder,
        isActive: plan.isActive,
        contactTopic: plan.contactTopic,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
        translations: (plan.translations ?? [])
          .slice()
          .sort((a, b) => a.language.code.localeCompare(b.language.code))
          .map((t) => ({
            id: t.id,
            languageId: t.language.id,
            languageCode: t.language.code,
            languageName: t.language.name,
            name: t.name,
            subtitle: t.subtitle,
            periodLabel: t.periodLabel,
            ctaLabel: t.ctaLabel,
            features: parseFeatures(t.featuresJson),
            updatedAt: t.updatedAt.toISOString(),
          })),
      })),
      comparisonRows: compRows.map((row) => ({
        id: row.id,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        translations: (row.translations ?? [])
          .slice()
          .sort((a, b) => a.language.code.localeCompare(b.language.code))
          .map((t) => ({
            id: t.id,
            languageId: t.language.id,
            languageCode: t.language.code,
            languageName: t.language.name,
            label: t.label,
            essentialValue: t.essentialValue,
            growthValue: t.growthValue,
            premierValue: t.premierValue,
            updatedAt: t.updatedAt.toISOString(),
          })),
      })),
    };
  }

  async upsertPageTranslation(
    dto: UpsertListingPackagesPageTranslationDto,
  ): Promise<AdminListingPackagesBundle> {
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    const existing = await this.pageTranslations.findOne({
      where: { language: { id: language.id } },
      relations: { language: true },
    });

    const payload = {
      heroEyebrow: dto.heroEyebrow,
      heroTitle: dto.heroTitle,
      heroSubtitle: dto.heroSubtitle,
      valueTitle: dto.valueTitle,
      valueBody: dto.valueBody,
      discoverTitle: dto.discoverTitle,
      discoverSubtitle: dto.discoverSubtitle,
      comparisonTitle: dto.comparisonTitle,
      comparisonHint: dto.comparisonHint,
      featureColumnLabel: dto.featureColumnLabel,
      tierEssentialLabel: dto.tierEssentialLabel,
      tierGrowthLabel: dto.tierGrowthLabel,
      tierPremierLabel: dto.tierPremierLabel,
      recommendedBadge: dto.recommendedBadge,
      audienceTitle: dto.audienceTitle,
      audienceSubtitle: dto.audienceSubtitle,
      audienceTagsJson: JSON.stringify(dto.audienceTags),
      helpTitle: dto.helpTitle,
      helpBody: dto.helpBody,
      browseDirectoryLabel: dto.browseDirectoryLabel,
      disclaimerText: dto.disclaimerText,
    };

    if (existing) {
      Object.assign(existing, payload);
      await this.pageTranslations.save(existing);
    } else {
      await this.pageTranslations.save(
        this.pageTranslations.create({ language, ...payload }),
      );
    }

    return this.getBundle();
  }

  async removePageTranslation(languageId: string): Promise<AdminListingPackagesBundle> {
    const language = await this.languages.findOne({ where: { id: languageId } });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    if (language.code === 'en') {
      throw new BadRequestException('English page translation cannot be removed');
    }
    const hit = await this.pageTranslations.findOne({
      where: { language: { id: languageId } },
    });
    if (hit) {
      await this.pageTranslations.remove(hit);
    }
    return this.getBundle();
  }

  async createPlan(dto: CreateListingPlanDto): Promise<AdminListingPackagesBundle> {
    const existing = await this.plans.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException(`Plan code "${dto.code}" already exists`);
    }
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new NotFoundException('English language not found');
    }

    const plan = await this.plans.save(
      this.plans.create({
        code: dto.code,
        priceDisplay: dto.priceDisplay,
        icon: dto.icon,
        isRecommended: dto.isRecommended ?? false,
        isDarkTheme: dto.isDarkTheme ?? false,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
        contactTopic: dto.contactTopic,
      }),
    );

    await this.planTranslations.save(
      this.planTranslations.create({
        plan,
        language: english,
        name: dto.englishName,
        subtitle: dto.englishSubtitle,
        periodLabel: dto.englishPeriodLabel,
        ctaLabel: dto.englishCtaLabel,
        featuresJson: JSON.stringify(dto.englishFeatures),
      }),
    );

    return this.getBundle();
  }

  async updatePlan(
    id: string,
    dto: UpdateListingPlanDto,
  ): Promise<AdminListingPackagesBundle> {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Listing plan not found');
    }
    if (dto.priceDisplay != null) plan.priceDisplay = dto.priceDisplay;
    if (dto.icon != null) plan.icon = dto.icon;
    if (dto.isRecommended != null) plan.isRecommended = dto.isRecommended;
    if (dto.isDarkTheme != null) plan.isDarkTheme = dto.isDarkTheme;
    if (dto.displayOrder != null) plan.displayOrder = dto.displayOrder;
    if (dto.isActive != null) plan.isActive = dto.isActive;
    if (dto.contactTopic != null) plan.contactTopic = dto.contactTopic;
    await this.plans.save(plan);
    return this.getBundle();
  }

  async deletePlan(id: string): Promise<AdminListingPackagesBundle> {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Listing plan not found');
    }
    await this.plans.remove(plan);
    return this.getBundle();
  }

  async upsertPlanTranslation(
    planId: string,
    dto: UpsertListingPlanTranslationDto,
  ): Promise<AdminListingPackagesBundle> {
    const plan = await this.plans.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Listing plan not found');
    }
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    const existing = await this.planTranslations.findOne({
      where: { plan: { id: planId }, language: { id: language.id } },
      relations: { plan: true, language: true },
    });

    const featuresJson = JSON.stringify(dto.features);
    if (existing) {
      existing.name = dto.name;
      existing.subtitle = dto.subtitle;
      existing.periodLabel = dto.periodLabel;
      existing.ctaLabel = dto.ctaLabel;
      existing.featuresJson = featuresJson;
      await this.planTranslations.save(existing);
    } else {
      await this.planTranslations.save(
        this.planTranslations.create({
          plan,
          language,
          name: dto.name,
          subtitle: dto.subtitle,
          periodLabel: dto.periodLabel,
          ctaLabel: dto.ctaLabel,
          featuresJson,
        }),
      );
    }

    return this.getBundle();
  }

  async removePlanTranslation(
    planId: string,
    languageId: string,
  ): Promise<AdminListingPackagesBundle> {
    const language = await this.languages.findOne({ where: { id: languageId } });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    if (language.code === 'en') {
      throw new BadRequestException('English plan translation cannot be removed');
    }
    const hit = await this.planTranslations.findOne({
      where: { plan: { id: planId }, language: { id: languageId } },
    });
    if (hit) {
      await this.planTranslations.remove(hit);
    }
    return this.getBundle();
  }

  async createComparisonRow(
    dto: CreateListingComparisonRowDto,
  ): Promise<AdminListingPackagesBundle> {
    const english = await this.languages.findOne({ where: { code: 'en' } });
    if (!english) {
      throw new NotFoundException('English language not found');
    }

    const maxOrder = await this.comparisonRows
      .createQueryBuilder('r')
      .select('MAX(r.sort_order)', 'max')
      .getRawOne<{ max: number | null }>();
    const sortOrder =
      dto.sortOrder ?? (maxOrder?.max != null ? Number(maxOrder.max) + 1 : 0);

    const row = await this.comparisonRows.save(
      this.comparisonRows.create({
        sortOrder,
        isActive: dto.isActive ?? true,
      }),
    );

    await this.comparisonTranslations.save(
      this.comparisonTranslations.create({
        row,
        language: english,
        label: dto.englishLabel,
        essentialValue: dto.englishEssentialValue,
        growthValue: dto.englishGrowthValue,
        premierValue: dto.englishPremierValue,
      }),
    );

    return this.getBundle();
  }

  async updateComparisonRow(
    id: string,
    dto: UpdateListingComparisonRowDto,
  ): Promise<AdminListingPackagesBundle> {
    const row = await this.comparisonRows.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Comparison row not found');
    }
    if (dto.sortOrder != null) row.sortOrder = dto.sortOrder;
    if (dto.isActive != null) row.isActive = dto.isActive;
    await this.comparisonRows.save(row);
    return this.getBundle();
  }

  async deleteComparisonRow(id: string): Promise<AdminListingPackagesBundle> {
    const row = await this.comparisonRows.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Comparison row not found');
    }
    await this.comparisonRows.remove(row);
    return this.getBundle();
  }

  async upsertComparisonTranslation(
    rowId: string,
    dto: UpsertListingComparisonRowTranslationDto,
  ): Promise<AdminListingPackagesBundle> {
    const row = await this.comparisonRows.findOne({ where: { id: rowId } });
    if (!row) {
      throw new NotFoundException('Comparison row not found');
    }
    const language = await this.languages.findOne({
      where: { id: String(dto.languageId) },
    });
    if (!language) {
      throw new NotFoundException('Language not found');
    }

    const existing = await this.comparisonTranslations.findOne({
      where: { row: { id: rowId }, language: { id: language.id } },
      relations: { row: true, language: true },
    });

    if (existing) {
      existing.label = dto.label;
      existing.essentialValue = dto.essentialValue;
      existing.growthValue = dto.growthValue;
      existing.premierValue = dto.premierValue;
      await this.comparisonTranslations.save(existing);
    } else {
      await this.comparisonTranslations.save(
        this.comparisonTranslations.create({
          row,
          language,
          label: dto.label,
          essentialValue: dto.essentialValue,
          growthValue: dto.growthValue,
          premierValue: dto.premierValue,
        }),
      );
    }

    return this.getBundle();
  }

  async removeComparisonTranslation(
    rowId: string,
    languageId: string,
  ): Promise<AdminListingPackagesBundle> {
    const language = await this.languages.findOne({ where: { id: languageId } });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    if (language.code === 'en') {
      throw new BadRequestException('English comparison translation cannot be removed');
    }
    const hit = await this.comparisonTranslations.findOne({
      where: { row: { id: rowId }, language: { id: languageId } },
    });
    if (hit) {
      await this.comparisonTranslations.remove(hit);
    }
    return this.getBundle();
  }
}
