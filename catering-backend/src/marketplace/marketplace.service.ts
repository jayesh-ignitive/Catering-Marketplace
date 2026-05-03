import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { ImagePublicUrlService } from '../storage/image-public-url.service';
import { TenantProvisioningService } from '../tenant-provisioning/tenant-provisioning.service';
import { mysqlDbNameFromTenantSlug, slugify, subdomainLabelFrom } from '../tenant/slug.util';
import { Tenant } from '../tenant/tenant.entity';
import { User } from '../user/user.entity';
import { UserRole } from '../user/user-role.enum';
import { City } from './city.entity';
import { CatererMarketplaceListing } from './caterer-marketplace-listing.entity';
import { CatererProfileCategory } from './caterer-profile-category.entity';
import { CatererProfileGalleryImage } from './caterer-profile-gallery-image.entity';
import { CatererProfileKeyword } from './caterer-profile-keyword.entity';
import { CatererProfileServiceOffering } from './caterer-profile-service-offering.entity';
import { CatererReview } from './caterer-review.entity';
import { Category } from './category.entity';
import { Keyword } from './keyword.entity';
import { ServiceOffering } from './service-offering.entity';
import type { CreateCatererReviewDto } from './dto/create-caterer-review.dto';
import type { ListCatererReviewsQueryDto } from './dto/list-caterer-reviews-query.dto';
import type { ListMarketplaceQueryDto } from './dto/list-marketplace-query.dto';
import type { UpsertCatererWorkspaceProfileDto } from './dto/upsert-caterer-workspace-profile.dto';
import type { WorkspaceProfileStep0Dto } from './dto/workspace-profile-step-0.dto';
import type { WorkspaceProfileStep1Dto } from './dto/workspace-profile-step-1.dto';
import type { WorkspaceProfileStep2Dto } from './dto/workspace-profile-step-2.dto';
import { buildMarketplaceProfileSlug, parseMarketplaceProfileSlug } from './marketplace-slug.util';

export type MarketplaceCategoryRef = { code: string; name: string };

export type MarketplaceKeywordRef = { slug: string; label: string };

export type MarketplaceListItem = {
  profileSlug: string;
  tenantId: string;
  businessName: string;
  city: string | null;
  state: string | null;
  country: string | null;
  streetAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  /** First category by `sort_order` on the junction (legacy list cards). */
  primaryCategoryId: string | null;
  primaryCategoryName: string | null;
  /** All linked categories, ordered by `sort_order`. */
  categories: MarketplaceCategoryRef[];
  cuisines: string[];
  /** Search tags linked to the profile (ordered). */
  keywords: MarketplaceKeywordRef[];
  priceBand: string | null;
  /** Indicative minimum price per guest in INR; `null` when unknown or custom-quote-only. */
  priceFrom: number | null;
  tagline: string | null;
  avgRating: number;
  reviewCount: number;
  heroImageUrl: string | null;
  yearsInBusiness: number | null;
  capacityGuestMin: number | null;
  capacityGuestMax: number | null;
};

export type CatererReviewView = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
};

export type MarketplaceDetail = MarketplaceListItem & {
  about: string | null;
  galleryImages: string[];
  servicesOffered: string[];
  subdomain: string | null;
  /** Latest reviews for profile page (newest first). */
  reviews: CatererReviewView[];
};

export type WorkspaceCompletionStatus = {
  isComplete: boolean;
  missingFields: string[];
};

export type CatererWorkspaceProfile = {
  cityId: string | null;
  streetAddress: string | null;
  tagline: string | null;
  about: string | null;
  heroImageUrl: string | null;
  priceBand: string | null;
  priceFrom: number | null;
  yearsInBusiness: number | null;
  capacityGuestMin: number | null;
  capacityGuestMax: number | null;
  categoryCodes: string[];
  serviceOfferingIds: string[];
  keywords: string[];
  galleryImageUrls: string[];
  published: boolean;
  completion: WorkspaceCompletionStatus;
};

@Injectable()
export class MarketplaceService {
  private static readonly PROFILE_REVIEWS_PREVIEW = 12;

  private readonly log = new Logger(MarketplaceService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(CatererMarketplaceListing)
    private readonly listings: Repository<CatererMarketplaceListing>,
    @InjectRepository(CatererReview)
    private readonly reviews: Repository<CatererReview>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(City)
    private readonly cities: Repository<City>,
    @InjectRepository(Keyword)
    private readonly keywords: Repository<Keyword>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(ServiceOffering)
    private readonly serviceOfferings: Repository<ServiceOffering>,
    @InjectRepository(CatererProfileCategory)
    private readonly profileCategories: Repository<CatererProfileCategory>,
    @InjectRepository(CatererProfileServiceOffering)
    private readonly profileServiceOfferings: Repository<CatererProfileServiceOffering>,
    @InjectRepository(CatererProfileKeyword)
    private readonly profileKeywords: Repository<CatererProfileKeyword>,
    @InjectRepository(CatererProfileGalleryImage)
    private readonly galleryImages: Repository<CatererProfileGalleryImage>,
    private readonly provisioning: TenantProvisioningService,
    private readonly imageUrls: ImagePublicUrlService,
  ) {}

  private persistHeroRef(raw: string | null | undefined): string | null {
    const n = this.normalizeString(raw);
    if (!n) return null;
    return this.imageUrls.stripToStorageKey(n);
  }

  private persistGalleryRefs(urls: string[]): string[] {
    const out: string[] = [];
    for (const u of urls) {
      const t = u.trim();
      if (!t) continue;
      const k = this.imageUrls.stripToStorageKey(t);
      if (k) out.push(k);
    }
    return [...new Set(out)];
  }

  /** Public/marketplace responses — browser-ready URLs. */
  private resolvedGalleryDisplayUrls(m: CatererMarketplaceListing): string[] {
    return this.sortedGalleryUrls(m)
      .map((u) => this.imageUrls.resolveToPublicUrl(u))
      .filter((x): x is string => x != null && x.length > 0);
  }

  private normalizeString(v: string | null | undefined): string | null {
    if (v == null) return null;
    const t = v.trim();
    return t.length ? t : null;
  }

  private normalizeKeywordSlug(v: string): string {
    return v
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  private normalizeKeywordLabel(v: string): string {
    return v.trim().replace(/\s+/g, ' ').slice(0, 120);
  }

  private computeCompletion(profile: CatererWorkspaceProfile): WorkspaceCompletionStatus {
    const missingFields: string[] = [];
    if (!profile.cityId) missingFields.push('city');
    if (!profile.about) missingFields.push('about');
    if (profile.categoryCodes.length < 1) missingFields.push('category');
    if (profile.serviceOfferingIds.length < 1) missingFields.push('services');
    if (profile.keywords.length < 1) missingFields.push('keywords');
    if (profile.galleryImageUrls.length < 1) missingFields.push('gallery');
    if (!profile.heroImageUrl?.trim()) missingFields.push('banner');
    return { isComplete: missingFields.length === 0, missingFields };
  }

  private async loadWorkspaceListingOrThrow(tenantId: string): Promise<CatererMarketplaceListing> {
    await this.ensureDraftListingForTenant(tenantId);
    const profile = await this.listings.findOne({
      where: { tenantId },
      relations: {
        cityRef: true,
        profileCategories: { category: true },
        profileServiceOfferings: { serviceOffering: true },
        profileKeywords: { keyword: true },
        galleryItems: true,
      },
    });
    if (!profile) {
      throw new NotFoundException('Caterer workspace profile not found');
    }
    return profile;
  }

  private toWorkspaceProfile(profile: CatererMarketplaceListing): CatererWorkspaceProfile {
    const dto: CatererWorkspaceProfile = {
      cityId: profile.cityRef?.id ?? null,
      streetAddress: profile.streetAddress,
      tagline: profile.tagline,
      about: profile.about,
      heroImageUrl: this.imageUrls.resolveToPublicUrl(profile.heroImageUrl),
      priceBand: profile.priceBand,
      priceFrom: this.decimalToNumberOrNull(profile.priceFrom),
      yearsInBusiness: profile.yearsInBusiness,
      capacityGuestMin: profile.capacityGuestMin,
      capacityGuestMax: profile.capacityGuestMax,
      categoryCodes: this.orderedCategoryRefs(profile).map((x) => x.code),
      serviceOfferingIds: [...(profile.profileServiceOfferings ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((x) => x.serviceOfferingId),
      keywords: this.orderedKeywordRefs(profile).map((x) => x.label),
      galleryImageUrls: this.resolvedGalleryDisplayUrls(profile),
      published: profile.published,
      completion: { isComplete: false, missingFields: [] },
    };
    dto.completion = this.computeCompletion(dto);
    return dto;
  }

  /** Distinct keywords attached to at least one published profile (filter dropdown). */
  async listPublishedKeywordFilters(): Promise<MarketplaceKeywordRef[]> {
    return this.keywords
      .createQueryBuilder('k')
      .select('k.slug', 'slug')
      .addSelect('k.label', 'label')
      .innerJoin('caterer_profile_keywords', 'cpk', 'cpk.keyword_id = k.id')
      .innerJoin(
        'caterer_profiles',
        'cp',
        'cp.id = cpk.caterer_profile_id AND cp.published = :pub',
        { pub: true },
      )
      .distinct(true)
      .orderBy('k.label', 'ASC')
      .getRawMany<MarketplaceKeywordRef>();
  }

  /** Keyword autocomplete for search (published profiles only; uses indexed slug + label). */
  async suggestPublishedKeywords(term: string): Promise<MarketplaceKeywordRef[]> {
    const t = term.trim().slice(0, 80);
    if (t.length < 1) {
      return [];
    }
    const like = `%${t}%`;
    return this.keywords
      .createQueryBuilder('k')
      .select('k.slug', 'slug')
      .addSelect('k.label', 'label')
      .innerJoin('caterer_profile_keywords', 'cpk', 'cpk.keyword_id = k.id')
      .innerJoin(
        'caterer_profiles',
        'cp',
        'cp.id = cpk.caterer_profile_id AND cp.published = :pub',
        { pub: true },
      )
      .where('(k.label LIKE :like OR k.slug LIKE :like)', { like })
      .distinct(true)
      .orderBy('k.label', 'ASC')
      .take(15)
      .getRawMany<MarketplaceKeywordRef>();
  }

  private applyListingTextSearch(
    qb: SelectQueryBuilder<CatererMarketplaceListing>,
    q: string,
  ): void {
    const qv = `%${q}%`;
    qb.andWhere(
      `(t.name LIKE :qv OR m.tagline LIKE :qv OR m.about LIKE :qv OR EXISTS (
        SELECT 1 FROM caterer_profile_keywords qx
        INNER JOIN keywords qxk ON qxk.id = qx.keyword_id
        WHERE qx.caterer_profile_id = m.id
        AND (qxk.label LIKE :qv OR qxk.slug LIKE :qv)
      ))`,
      { qv },
    );
  }

  private applyListingKeywordSlugFilter(
    qb: SelectQueryBuilder<CatererMarketplaceListing>,
    slug: string,
  ): void {
    qb.andWhere(
      `EXISTS (
        SELECT 1 FROM caterer_profile_keywords kf
        INNER JOIN keywords kfk ON kfk.id = kf.keyword_id
        WHERE kf.caterer_profile_id = m.id AND kfk.slug = :kwSlug
      )`,
      { kwSlug: slug },
    );
  }

  private toReviewView(r: CatererReview): CatererReviewView {
    return {
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    };
  }

  private orderedCategoryRefs(m: CatererMarketplaceListing): MarketplaceCategoryRef[] {
    const links = [...(m.profileCategories ?? [])].sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.categoryId.localeCompare(b.categoryId),
    );
    return links
      .filter((l): l is typeof l & { category: NonNullable<typeof l.category> } => l.category != null)
      .map((l) => ({ code: l.category.code, name: l.category.name }));
  }

  private gallerySortKey(g: CatererProfileGalleryImage): number {
    const ca = g.createdAt as unknown;
    if (ca instanceof Date && !Number.isNaN(ca.getTime())) {
      return ca.getTime();
    }
    const parsed = new Date(String(ca ?? '')).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private sortedGalleryUrls(m: CatererMarketplaceListing): string[] {
    return [...(m.galleryItems ?? [])]
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || this.gallerySortKey(a) - this.gallerySortKey(b) || a.url.localeCompare(b.url),
      )
      .map((g) => g.url);
  }

  private orderedKeywordRefs(m: CatererMarketplaceListing): MarketplaceKeywordRef[] {
    return [...(m.profileKeywords ?? [])]
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.keywordId.localeCompare(b.keywordId),
      )
      .filter((l): l is typeof l & { keyword: NonNullable<typeof l.keyword> } => l.keyword != null)
      .map((l) => ({ slug: l.keyword.slug, label: l.keyword.label }));
  }

  private orderedCuisineNames(m: CatererMarketplaceListing): string[] {
    return [...(m.profileCuisines ?? [])]
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.cuisineId.localeCompare(b.cuisineId),
      )
      .map((l) => l.cuisine?.name)
      .filter((n): n is string => !!n);
  }

  private decimalToNumberOrNull(v: string | null | undefined): number | null {
    if (v == null || v === '') {
      return null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private orderedServiceOfferingNames(m: CatererMarketplaceListing): string[] {
    return [...(m.profileServiceOfferings ?? [])]
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.serviceOfferingId.localeCompare(b.serviceOfferingId),
      )
      .map((l) => l.serviceOffering?.name)
      .filter((n): n is string => !!n);
  }

  private toListItem(m: CatererMarketplaceListing, t: Tenant): MarketplaceListItem {
    const profileSlug = buildMarketplaceProfileSlug(t.slug);
    const cats = this.orderedCategoryRefs(m);
    const primary = cats[0];
    return {
      profileSlug,
      tenantId: t.id,
      businessName: t.name,
      city: m.cityRef?.name ?? null,
      state: m.cityRef?.state?.name ?? null,
      country: m.cityRef?.state?.country?.name ?? null,
      streetAddress: m.streetAddress,
      latitude:
        m.latitude != null && m.latitude !== '' ? Number(m.latitude) : null,
      longitude:
        m.longitude != null && m.longitude !== '' ? Number(m.longitude) : null,
      primaryCategoryId: primary?.code ?? null,
      primaryCategoryName: primary?.name ?? null,
      categories: cats,
      cuisines: this.orderedCuisineNames(m),
      keywords: this.orderedKeywordRefs(m),
      priceBand: m.priceBand,
      priceFrom: this.decimalToNumberOrNull(m.priceFrom),
      tagline: m.tagline,
      avgRating: Number(m.avgRating),
      reviewCount: m.reviewCount,
      heroImageUrl: this.imageUrls.resolveToPublicUrl(m.heroImageUrl),
      yearsInBusiness: m.yearsInBusiness,
      capacityGuestMin: m.capacityGuestMin,
      capacityGuestMax: m.capacityGuestMax,
    };
  }

  /** Resolves public profile slug to a published caterer profile. */
  private async resolvePublishedProfile(
    slugParam: string,
  ): Promise<{ tenant: Tenant; profile: CatererMarketplaceListing }> {
    const parsed = parseMarketplaceProfileSlug(slugParam);
    if (!parsed) {
      throw new NotFoundException('Caterer profile not found');
    }

    let tenant: Tenant | null = null;
    for (const slug of parsed.slugCandidates) {
      tenant = await this.tenants
        .createQueryBuilder('t')
        .where('LOWER(t.slug) = :slug', { slug: slug.toLowerCase() })
        .getOne();
      if (tenant) {
        break;
      }
    }
    if (!tenant) {
      throw new NotFoundException('Caterer profile not found');
    }

    const profile = await this.listings.findOne({
      where: { tenantId: tenant.id, published: true },
      relations: {
        tenant: true,
        cityRef: { state: { country: true } },
        profileCategories: { category: true },
        galleryItems: true,
        profileCuisines: { cuisine: true },
        profileServiceOfferings: { serviceOffering: true },
        profileKeywords: { keyword: true },
      },
    });
    if (!profile?.tenant) {
      throw new NotFoundException('Caterer profile not found');
    }

    return { tenant: profile.tenant, profile };
  }

  async refreshReviewAggregatesForTenant(tenantId: string): Promise<void> {
    const row = await this.reviews
      .createQueryBuilder('r')
      .select('COUNT(*)', 'cnt')
      .addSelect('AVG(r.rating)', 'avg')
      .where('r.tenantId = :tid', { tid: tenantId })
      .getRawOne<{ cnt: string; avg: string | null }>();

    const cnt = Number(row?.cnt ?? 0);
    const avg = cnt === 0 || row?.avg == null ? 0 : Number(row.avg);
    await this.listings.update(
      { tenantId },
      { avgRating: avg.toFixed(1), reviewCount: cnt },
    );
  }

  async listCities(): Promise<{ city: string }[]> {
    return this.cities
      .createQueryBuilder('cy')
      .innerJoin('caterer_profiles', 'cp', 'cp.city_id = cy.id AND cp.published = :pub', {
        pub: true,
      })
      .select('cy.name', 'city')
      .distinct(true)
      .orderBy('cy.name', 'ASC')
      .getRawMany<{ city: string }>();
  }

  async listAllCitiesForWorkspace(): Promise<{ id: string; name: string }[]> {
    const rows = await this.cities.find({
      order: { name: 'ASC' },
      select: { id: true, name: true },
    });
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }

  async listPublished(dto: ListMarketplaceQueryDto): Promise<{
    items: MarketplaceListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 12;

    const countQb = this.listings
      .createQueryBuilder('m')
      .innerJoin('m.tenant', 't')
      .where('m.published = :pub', { pub: true });

    const q = dto.q?.trim();
    if (q) {
      this.applyListingTextSearch(countQb, q);
    }
    if (dto.city?.trim()) {
      countQb.innerJoin('m.cityRef', 'cyCnt').andWhere('cyCnt.name = :city', {
        city: dto.city.trim(),
      });
    }
    if (dto.categoryId?.trim()) {
      countQb.andWhere(
        `EXISTS (SELECT 1 FROM caterer_profile_categories x INNER JOIN categories xc ON xc.id = x.category_id WHERE x.caterer_profile_id = m.id AND xc.code = :cat)`,
        { cat: dto.categoryId.trim() },
      );
    }
    if (dto.priceBand) {
      countQb.andWhere('m.priceBand = :pb', { pb: dto.priceBand });
    }
    const kw = dto.keyword?.trim().toLowerCase();
    if (kw) {
      this.applyListingKeywordSlugFilter(countQb, kw);
    }

    const total = await countQb.getCount();

    const rowQb = this.listings
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.tenant', 't')
      .leftJoinAndSelect('m.cityRef', 'cy')
      .leftJoinAndSelect('cy.state', 'st')
      .leftJoinAndSelect('st.country', 'cnt')
      .leftJoinAndSelect('m.profileCategories', 'pc')
      .leftJoinAndSelect('pc.category', 'pcat')
      .leftJoinAndSelect('m.profileCuisines', 'pccui')
      .leftJoinAndSelect('pccui.cuisine', 'pcu')
      .leftJoinAndSelect('m.profileKeywords', 'pkw')
      .leftJoinAndSelect('pkw.keyword', 'pkwk')
      .where('m.published = :pub', { pub: true });

    if (q) {
      this.applyListingTextSearch(rowQb, q);
    }
    if (dto.city?.trim()) {
      rowQb.andWhere('cy.name = :city', { city: dto.city.trim() });
    }
    if (dto.categoryId?.trim()) {
      rowQb.andWhere(
        `EXISTS (SELECT 1 FROM caterer_profile_categories x2 INNER JOIN categories xc2 ON xc2.id = x2.category_id WHERE x2.caterer_profile_id = m.id AND xc2.code = :cat2)`,
        { cat2: dto.categoryId.trim() },
      );
    }
    if (dto.priceBand) {
      rowQb.andWhere('m.priceBand = :pb', { pb: dto.priceBand });
    }
    if (kw) {
      this.applyListingKeywordSlugFilter(rowQb, kw);
    }

    const rows = await rowQb
      .orderBy('m.avgRating', 'DESC')
      .addOrderBy('m.reviewCount', 'DESC')
      .addOrderBy('t.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const items = rows.map((m) => this.toListItem(m, m.tenant));
    return { items, total, page, limit };
  }

  async getByProfileSlug(slugParam: string): Promise<MarketplaceDetail> {
    const { tenant, profile } = await this.resolvePublishedProfile(slugParam);

    const preview = await this.reviews.find({
      where: { tenantId: tenant.id },
      order: { createdAt: 'DESC' },
      take: MarketplaceService.PROFILE_REVIEWS_PREVIEW,
    });

    const base = this.toListItem(profile, tenant);
    return {
      ...base,
      about: profile.about,
      galleryImages: this.resolvedGalleryDisplayUrls(profile),
      servicesOffered: this.orderedServiceOfferingNames(profile),
      subdomain: tenant.subdomain,
      reviews: preview.map((r) => this.toReviewView(r)),
    };
  }

  async listServiceOfferings(): Promise<{ id: string; name: string }[]> {
    const rows = await this.serviceOfferings.find({
      order: { name: 'ASC' },
      select: { id: true, name: true },
    });
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }

  /** Caterer workspace: resolves tenant id, provisioning tenant + draft listing if missing (legacy accounts). */
  async resolveTenantIdForWorkspaceUser(userId: string): Promise<string> {
    const initial = await this.users.findOne({
      where: { id: userId },
      relations: { tenant: true },
    });
    if (!initial) {
      throw new UnauthorizedException();
    }
    if (initial.role !== UserRole.CATERER) {
      throw new ForbiddenException('Workspace profile is only available for caterer accounts');
    }
    if (initial.tenant?.id) {
      return initial.tenant.id;
    }

    let tenantIdOut = '';
    await this.users.manager.transaction(async (em) => {
      const userRepo = em.getRepository(User);
      const tenantRepo = em.getRepository(Tenant);
      const row = await userRepo.findOne({
        where: { id: userId },
        relations: { tenant: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row) {
        throw new UnauthorizedException();
      }
      if (row.role !== UserRole.CATERER) {
        throw new ForbiddenException('Workspace profile is only available for caterer accounts');
      }
      if (row.tenant?.id) {
        tenantIdOut = row.tenant.id;
        return;
      }

      const businessName = (row.businessName ?? row.fullName ?? 'My catering').trim();
      const tenantId = randomUUID();
      const slug = await this.ensureUniqueTenantSlug(tenantRepo, businessName);
      const dbName = await this.ensureUniqueDbName(tenantRepo, slug);
      const subdomain = await this.ensureUniqueSubdomain(tenantRepo, businessName);

      const tenant = tenantRepo.create({
        id: tenantId,
        name: businessName.slice(0, 120),
        slug,
        subdomain,
        dbName,
        provisionStatus: 'pending',
        profilePublished: false,
        profileOptions: null,
      });
      await tenantRepo.save(tenant);

      row.tenant = tenant;
      await userRepo.save(row);

      const tenantForOwner = await tenantRepo.findOneByOrFail({ id: tenantId });
      tenantForOwner.ownerUser = row;
      await tenantRepo.save(tenantForOwner);

      tenantIdOut = tenantId;
    });

    await this.ensureDraftListingForTenant(tenantIdOut);
    await this.provisioning.provisionTenant(tenantIdOut).catch((e) => {
      this.log.warn(`provisionTenant after auto-link failed (${tenantIdOut})`, e);
    });

    return tenantIdOut;
  }

  async getWorkspaceProfileForUser(userId: string): Promise<CatererWorkspaceProfile> {
    const tenantId = await this.resolveTenantIdForWorkspaceUser(userId);
    return this.getWorkspaceProfile(tenantId);
  }

  async upsertWorkspaceProfileForUser(
    userId: string,
    dto: UpsertCatererWorkspaceProfileDto,
  ): Promise<CatererWorkspaceProfile> {
    const tenantId = await this.resolveTenantIdForWorkspaceUser(userId);
    return this.upsertWorkspaceProfile(tenantId, dto);
  }

  async patchWorkspaceProfileStep0ForUser(
    userId: string,
    dto: WorkspaceProfileStep0Dto,
  ): Promise<CatererWorkspaceProfile> {
    const tenantId = await this.resolveTenantIdForWorkspaceUser(userId);
    const profile = await this.loadWorkspaceListingOrThrow(tenantId);

    if (
      dto.capacityGuestMin != null &&
      dto.capacityGuestMax != null &&
      dto.capacityGuestMin > dto.capacityGuestMax
    ) {
      throw new BadRequestException('capacityGuestMin cannot exceed capacityGuestMax');
    }

    const cityRef = await this.cities.findOne({ where: { id: dto.cityId.trim() } });
    if (!cityRef) throw new BadRequestException('Invalid cityId');

    profile.cityRef = cityRef;
    profile.about = this.normalizeString(dto.about);

    if (dto.streetAddress !== undefined) {
      profile.streetAddress = this.normalizeString(dto.streetAddress);
    }
    if (dto.tagline !== undefined) {
      profile.tagline = this.normalizeString(dto.tagline);
    }
    if (dto.heroImageUrl !== undefined) {
      profile.heroImageUrl = this.persistHeroRef(dto.heroImageUrl);
    }
    if (dto.priceBand !== undefined) {
      profile.priceBand = dto.priceBand ?? null;
    }
    if (dto.priceFrom !== undefined) {
      profile.priceFrom = dto.priceFrom != null ? Number(dto.priceFrom).toFixed(2) : null;
    }
    if (dto.yearsInBusiness !== undefined) {
      profile.yearsInBusiness = dto.yearsInBusiness ?? null;
    }
    if (dto.capacityGuestMin !== undefined) {
      profile.capacityGuestMin = dto.capacityGuestMin ?? null;
    }
    if (dto.capacityGuestMax !== undefined) {
      profile.capacityGuestMax = dto.capacityGuestMax ?? null;
    }

    await this.listings.save(profile);
    await this.refreshPublishedFlag(tenantId);
    return this.getWorkspaceProfile(tenantId);
  }

  async patchWorkspaceProfileStep1ForUser(
    userId: string,
    dto: WorkspaceProfileStep1Dto,
  ): Promise<CatererWorkspaceProfile> {
    const tenantId = await this.resolveTenantIdForWorkspaceUser(userId);
    const profile = await this.loadWorkspaceListingOrThrow(tenantId);

    if (
      dto.capacityGuestMin != null &&
      dto.capacityGuestMax != null &&
      dto.capacityGuestMin > dto.capacityGuestMax
    ) {
      throw new BadRequestException('capacityGuestMin cannot exceed capacityGuestMax');
    }

    await this.syncProfileCategories(profile, dto.categoryCodes);
    await this.syncProfileServiceOfferings(profile, dto.serviceOfferingIds);
    await this.syncProfileKeywords(profile, dto.keywords);

    let needsSave = false;
    if (dto.priceBand !== undefined) {
      profile.priceBand = dto.priceBand ?? null;
      needsSave = true;
    }
    if (dto.priceFrom !== undefined) {
      profile.priceFrom = dto.priceFrom != null ? Number(dto.priceFrom).toFixed(2) : null;
      needsSave = true;
    }
    if (dto.yearsInBusiness !== undefined) {
      profile.yearsInBusiness = dto.yearsInBusiness ?? null;
      needsSave = true;
    }
    if (dto.capacityGuestMin !== undefined) {
      profile.capacityGuestMin = dto.capacityGuestMin ?? null;
      needsSave = true;
    }
    if (dto.capacityGuestMax !== undefined) {
      profile.capacityGuestMax = dto.capacityGuestMax ?? null;
      needsSave = true;
    }
    if (needsSave) {
      await this.listings.save(profile);
    }

    await this.refreshPublishedFlag(tenantId);
    return this.getWorkspaceProfile(tenantId);
  }

  async patchWorkspaceProfileStep2ForUser(
    userId: string,
    dto: WorkspaceProfileStep2Dto,
  ): Promise<CatererWorkspaceProfile> {
    const tenantId = await this.resolveTenantIdForWorkspaceUser(userId);
    const profile = await this.loadWorkspaceListingOrThrow(tenantId);
    await this.syncProfileGallery(profile, dto.galleryImageUrls);
    /** Avoid `save(profile)` while `galleryItems` may still be attached from the pre-sync load. */
    await this.listings.update({ id: profile.id }, { heroImageUrl: this.persistHeroRef(dto.heroImageUrl) });
    await this.refreshPublishedFlag(tenantId);
    return this.getWorkspaceProfile(tenantId);
  }

  async publishWorkspaceProfileForUser(userId: string): Promise<CatererWorkspaceProfile> {
    const tenantId = await this.resolveTenantIdForWorkspaceUser(userId);
    const refreshed = await this.loadWorkspaceListingOrThrow(tenantId);
    const workspace = this.toWorkspaceProfile(refreshed);
    if (!workspace.completion.isComplete) {
      throw new BadRequestException({
        message: workspace.completion.missingFields.map((f) => `Missing required field: ${f}`),
        missingFields: workspace.completion.missingFields,
      });
    }
    refreshed.published = true;
    await this.listings.save(refreshed);
    return this.getWorkspaceProfile(tenantId);
  }

  private async ensureUniqueTenantSlug(tenantRepo: Repository<Tenant>, baseInput: string): Promise<string> {
    const base = slugify(baseInput).slice(0, 50) || 'catering';
    let candidate = base;
    for (let i = 0; i < 24; i++) {
      const taken = await tenantRepo.exist({ where: { slug: candidate } });
      if (!taken) {
        return candidate;
      }
      const suffix = randomBytes(3).toString('hex');
      candidate = `${base}-${suffix}`.slice(0, 80);
    }
    return `${base}-${randomUUID().slice(0, 8)}`.slice(0, 80);
  }

  private async ensureUniqueSubdomain(tenantRepo: Repository<Tenant>, baseInput: string): Promise<string> {
    const base = subdomainLabelFrom(baseInput) || 'catering';
    let candidate = base;
    for (let i = 0; i < 24; i++) {
      const taken = await tenantRepo.exist({ where: { subdomain: candidate } });
      if (!taken) {
        return candidate;
      }
      const suffix = randomBytes(2).toString('hex');
      candidate = `${base}-${suffix}`.slice(0, 63);
    }
    return `${base}-${randomUUID().slice(0, 8)}`.slice(0, 63);
  }

  private async ensureUniqueDbName(tenantRepo: Repository<Tenant>, tenantSlug: string): Promise<string> {
    const base = mysqlDbNameFromTenantSlug(tenantSlug);
    let candidate = base;
    for (let i = 0; i < 24; i++) {
      const taken = await tenantRepo.exist({ where: { dbName: candidate } });
      if (!taken) {
        return candidate;
      }
      const suffix = `_${randomBytes(2).toString('hex')}`;
      const maxBaseLen = Math.max(1, 64 - suffix.length);
      candidate = `${base.slice(0, maxBaseLen)}${suffix}`;
    }
    return `${base.slice(0, 40)}_${randomUUID().replace(/-/g, '')}`.slice(0, 64);
  }

  async getWorkspaceProfile(tenantId: string): Promise<CatererWorkspaceProfile> {
    const profile = await this.loadWorkspaceListingOrThrow(tenantId);
    return this.toWorkspaceProfile(profile);
  }

  /** Unpublish when the profile is incomplete; do not auto-publish when complete (wizard uses PATCH step/3). */
  private async refreshPublishedFlag(tenantId: string): Promise<void> {
    const refreshed = await this.loadWorkspaceListingOrThrow(tenantId);
    const workspace = this.toWorkspaceProfile(refreshed);
    if (!workspace.completion.isComplete) {
      refreshed.published = false;
      await this.listings.save(refreshed);
    }
  }

  private async syncProfileCategories(
    profile: CatererMarketplaceListing,
    categoryCodesRaw: string[],
  ): Promise<void> {
    const categoryCodes = [...new Set(categoryCodesRaw.map((x) => x.trim()).filter(Boolean))];
    const categories = await this.categories.findBy({ code: In(categoryCodes) });
    if (categories.length !== categoryCodes.length) {
      throw new BadRequestException('One or more category codes are invalid');
    }
    await this.profileCategories.delete({ catererProfileId: profile.id });
    await this.profileCategories.save(
      categoryCodes.map((code, index) =>
        this.profileCategories.create({
          catererProfileId: profile.id,
          categoryId: categories.find((c) => c.code === code)!.id,
          sortOrder: index,
        }),
      ),
    );
  }

  private async syncProfileServiceOfferings(
    profile: CatererMarketplaceListing,
    serviceOfferingIdsRaw: string[],
  ): Promise<void> {
    const serviceIds = [...new Set(serviceOfferingIdsRaw.map((x) => x.trim()).filter(Boolean))];
    const services = await this.serviceOfferings.findBy({ id: In(serviceIds) });
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('One or more serviceOfferingIds are invalid');
    }
    await this.profileServiceOfferings.delete({ catererProfileId: profile.id });
    await this.profileServiceOfferings.save(
      serviceIds.map((id, index) =>
        this.profileServiceOfferings.create({
          catererProfileId: profile.id,
          serviceOfferingId: id,
          sortOrder: index,
        }),
      ),
    );
  }

  private async syncProfileKeywords(
    profile: CatererMarketplaceListing,
    keywordsRaw: string[],
  ): Promise<void> {
    const keywordLabels = [...new Set(keywordsRaw.map((x) => this.normalizeKeywordLabel(x)).filter(Boolean))];
    const keywordSlugs = keywordLabels.map((x) => this.normalizeKeywordSlug(x));
    if (keywordSlugs.some((s) => !s)) {
      throw new BadRequestException('Invalid keywords: only letters and numbers are allowed');
    }

    const existingKeywords = await this.keywords
      .createQueryBuilder('k')
      .where('k.slug IN (:...slugs)', { slugs: keywordSlugs })
      .getMany();
    const keywordBySlug = new Map(existingKeywords.map((k) => [k.slug, k]));
    for (let i = 0; i < keywordSlugs.length; i += 1) {
      const slug = keywordSlugs[i]!;
      if (keywordBySlug.has(slug)) continue;
      const created = this.keywords.create({
        slug,
        label: keywordLabels[i]!,
      });
      const saved = await this.keywords.save(created);
      keywordBySlug.set(saved.slug, saved);
    }

    await this.profileKeywords.delete({ catererProfileId: profile.id });
    await this.profileKeywords.save(
      keywordSlugs.map((slug, index) =>
        this.profileKeywords.create({
          catererProfileId: profile.id,
          keywordId: keywordBySlug.get(slug)!.id,
          sortOrder: index,
        }),
      ),
    );
  }

  private async syncProfileGallery(
    profile: CatererMarketplaceListing,
    galleryUrlsRaw: string[],
  ): Promise<void> {
    const galleryUrls = this.persistGalleryRefs(galleryUrlsRaw);
    await this.galleryImages.manager.transaction(async (manager) => {
      await manager.delete(CatererProfileGalleryImage, { catererProfileId: profile.id });
      if (galleryUrls.length === 0) {
        return;
      }
      await manager.insert(
        CatererProfileGalleryImage,
        galleryUrls.map((url, index) => ({
          id: randomUUID(),
          catererProfileId: profile.id,
          url,
          sortOrder: index,
        })),
      );
    });
  }

  async upsertWorkspaceProfile(
    tenantId: string,
    dto: UpsertCatererWorkspaceProfileDto,
  ): Promise<CatererWorkspaceProfile> {
    const profile = await this.loadWorkspaceListingOrThrow(tenantId);

    if (
      dto.capacityGuestMin != null &&
      dto.capacityGuestMax != null &&
      dto.capacityGuestMin > dto.capacityGuestMax
    ) {
      throw new BadRequestException('capacityGuestMin cannot exceed capacityGuestMax');
    }

    const cityRef = await this.cities.findOne({ where: { id: dto.cityId.trim() } });
    if (!cityRef) throw new BadRequestException('Invalid cityId');

    profile.cityRef = cityRef;
    profile.streetAddress = this.normalizeString(dto.streetAddress);
    profile.tagline = this.normalizeString(dto.tagline);
    profile.about = this.normalizeString(dto.about);
    profile.heroImageUrl = this.persistHeroRef(dto.heroImageUrl);
    profile.priceBand = dto.priceBand ?? null;
    profile.priceFrom = dto.priceFrom != null ? Number(dto.priceFrom).toFixed(2) : null;
    profile.yearsInBusiness = dto.yearsInBusiness ?? null;
    profile.capacityGuestMin = dto.capacityGuestMin ?? null;
    profile.capacityGuestMax = dto.capacityGuestMax ?? null;

    await this.listings.save(profile);

    await this.syncProfileCategories(profile, dto.categoryCodes);
    await this.syncProfileServiceOfferings(profile, dto.serviceOfferingIds);
    await this.syncProfileKeywords(profile, dto.keywords);
    await this.syncProfileGallery(profile, dto.galleryImageUrls);

    await this.refreshPublishedFlag(tenantId);
    return this.toWorkspaceProfile(await this.loadWorkspaceListingOrThrow(tenantId));
  }

  async listReviewsForSlug(
    slugParam: string,
    dto: ListCatererReviewsQueryDto,
  ): Promise<{
    items: CatererReviewView[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { tenant } = await this.resolvePublishedProfile(slugParam);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;

    const [rows, total] = await this.reviews.findAndCount({
      where: { tenantId: tenant.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: rows.map((r) => this.toReviewView(r)),
      total,
      page,
      limit,
    };
  }

  async createReviewForSlug(
    slugParam: string,
    dto: CreateCatererReviewDto,
  ): Promise<{
    review: CatererReviewView;
    avgRating: number;
    reviewCount: number;
  }> {
    const { tenant } = await this.resolvePublishedProfile(slugParam);

    const rev = this.reviews.create({
      id: randomUUID(),
      tenantId: tenant.id,
      authorName: dto.authorName.trim(),
      rating: dto.rating,
      title: dto.title?.trim() ? dto.title.trim().slice(0, 200) : null,
      comment: dto.comment.trim().slice(0, 2000),
    });
    await this.reviews.save(rev);

    await this.refreshReviewAggregatesForTenant(tenant.id);
    const updated = await this.listings.findOne({ where: { tenantId: tenant.id } });

    return {
      review: this.toReviewView(rev),
      avgRating: Number(updated?.avgRating ?? 0),
      reviewCount: updated?.reviewCount ?? 0,
    };
  }

  async publishedCount(): Promise<number> {
    return this.listings.count({ where: { published: true } });
  }

  /** Creates an unpublished marketplace row for a new caterer (idempotent). */
  async ensureDraftListingForTenant(tenantId: string): Promise<void> {
    if (await this.listings.exist({ where: { tenantId } })) {
      return;
    }
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      return;
    }
    const m = this.listings.create({
      id: randomUUID(),
      tenantId,
      cityRef: null,
      priceBand: null,
      tagline: `Catering by ${tenant.name}`,
      about: null,
      heroImageUrl: null,
      yearsInBusiness: null,
      capacityGuestMin: null,
      capacityGuestMax: null,
      avgRating: '0.0',
      reviewCount: 0,
      priceFrom: null,
      published: false,
    });
    await this.listings.save(m);
  }
}
