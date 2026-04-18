import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { City } from './city.entity';
import { CatererMarketplaceListing } from './caterer-marketplace-listing.entity';
import { CatererReview } from './caterer-review.entity';
import { Keyword } from './keyword.entity';
import type { CreateCatererReviewDto } from './dto/create-caterer-review.dto';
import type { ListCatererReviewsQueryDto } from './dto/list-caterer-reviews-query.dto';
import type { ListMarketplaceQueryDto } from './dto/list-marketplace-query.dto';
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

@Injectable()
export class MarketplaceService {
  private static readonly PROFILE_REVIEWS_PREVIEW = 12;

  constructor(
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
  ) {}

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
    return links.map((l) => ({ code: l.category.code, name: l.category.name }));
  }

  private sortedGalleryUrls(m: CatererMarketplaceListing): string[] {
    return [...(m.galleryItems ?? [])]
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      )
      .map((g) => g.url);
  }

  private orderedKeywordRefs(m: CatererMarketplaceListing): MarketplaceKeywordRef[] {
    return [...(m.profileKeywords ?? [])]
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.keywordId.localeCompare(b.keywordId),
      )
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
      heroImageUrl: m.heroImageUrl,
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
      galleryImages: this.sortedGalleryUrls(profile),
      servicesOffered: this.orderedServiceOfferingNames(profile),
      subdomain: tenant.subdomain,
      reviews: preview.map((r) => this.toReviewView(r)),
    };
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
