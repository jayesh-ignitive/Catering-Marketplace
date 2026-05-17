import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatererMarketplaceListing } from '../marketplace/caterer-marketplace-listing.entity';
import type { CatererProfileApprovalStatus } from '../marketplace/caterer-profile-approval-status';
import { buildMarketplaceProfileSlug } from '../marketplace/marketplace-slug.util';
import { MarketplaceService } from '../marketplace/marketplace.service';
import type { WorkspaceCompletionStatus } from '../marketplace/marketplace.service';
import { Tenant } from '../tenant/tenant.entity';
import type {
  AdminCatererSortField,
  ListAdminCaterersQueryDto,
} from './dto/list-admin-caterers-query.dto';

export type AdminCatererListItem = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  dbName: string | null;
  provisionStatus: string;
  profilePublished: boolean;
  marketplaceApprovalStatus: CatererProfileApprovalStatus;
  submittedForReviewAt: string | null;
  ownerUserId: string | null;
  ownerEmail: string | null;
  ownerFullName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCatererListResponse = {
  items: AdminCatererListItem[];
  total: number;
  page: number;
  limit: number;
  sortBy: AdminCatererSortField;
  sortDir: 'asc' | 'desc';
};

export type AdminCatererReviewOwner = {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
};

export type AdminCatererReviewCategory = { code: string; name: string };
export type AdminCatererReviewServiceOffering = { id: string; name: string };

export type AdminCatererReviewDetail = {
  tenantId: string;
  workspaceName: string;
  workspaceSlug: string;
  profileSlug: string;
  subdomain: string | null;
  provisionStatus: string;
  owner: AdminCatererReviewOwner | null;
  published: boolean;
  approvalStatus: CatererProfileApprovalStatus;
  submittedForReviewAt: string | null;
  reviewedAt: string | null;
  completion: WorkspaceCompletionStatus;
  business: {
    cityName: string | null;
    streetAddress: string | null;
    tagline: string | null;
    about: string | null;
    yearsInBusiness: number | null;
    capacityGuestMin: number | null;
    capacityGuestMax: number | null;
    priceBand: string | null;
    priceFrom: number | null;
  };
  categories: AdminCatererReviewCategory[];
  serviceOfferings: AdminCatererReviewServiceOffering[];
  keywords: string[];
  portfolio: {
    heroImageUrl: string | null;
    galleryImageUrls: string[];
  };
  profileCreatedAt: string;
  profileUpdatedAt: string;
};

type TenantWithListing = Tenant & { listing?: CatererMarketplaceListing | null };

function toIso(d: Date | null | undefined): string {
  return (d ?? new Date()).toISOString();
}

function listItemFromTenant(t: TenantWithListing): AdminCatererListItem {
  const owner = t.ownerUser;
  const listing = t.listing;
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    subdomain: t.subdomain,
    dbName: t.dbName,
    provisionStatus: t.provisionStatus,
    profilePublished: listing?.published ?? t.profilePublished,
    marketplaceApprovalStatus: listing?.approvalStatus ?? 'draft',
    submittedForReviewAt: listing?.submittedForReviewAt
      ? listing.submittedForReviewAt.toISOString()
      : null,
    ownerUserId: owner?.id ?? null,
    ownerEmail: owner?.email ?? null,
    ownerFullName: owner?.fullName ?? null,
    createdAt: toIso(t.createdAt),
    updatedAt: toIso(t.updatedAt),
  };
}

@Injectable()
export class AdminCaterersService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
    @InjectRepository(CatererMarketplaceListing)
    private readonly listings: Repository<CatererMarketplaceListing>,
    private readonly marketplace: MarketplaceService,
  ) {}

  async list(
    dto: ListAdminCaterersQueryDto,
  ): Promise<AdminCatererListResponse> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const q = dto.q?.trim();

    const sortBy: AdminCatererSortField = dto.sortBy ?? 'createdAt';
    const sortDir: 'ASC' | 'DESC' = dto.sortDir === 'asc' ? 'ASC' : 'DESC';

    const orderExpr: Record<AdminCatererSortField, string> = {
      createdAt: 't.createdAt',
      name: 't.name',
      slug: 't.slug',
      subdomain: 't.subdomain',
      provisionStatus: 't.provisionStatus',
      profilePublished: 'cp.published',
      updatedAt: 't.updatedAt',
      ownerEmail: 'owner.email',
      ownerFullName: 'owner.fullName',
    };

    const qb = this.tenants
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.ownerUser', 'owner')
      .leftJoinAndMapOne(
        't.listing',
        CatererMarketplaceListing,
        'cp',
        'cp.tenantId = t.id',
      )
      .orderBy(orderExpr[sortBy], sortDir);

    if (q) {
      const like = `%${q.toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(t.name) LIKE :like OR LOWER(t.slug) LIKE :like OR LOWER(COALESCE(t.subdomain, '')) LIKE :like OR LOWER(COALESCE(owner.email, '')) LIKE :like OR LOWER(COALESCE(owner.fullName, '')) LIKE :like)",
        { like },
      );
    }

    if (dto.approvalStatus) {
      qb.andWhere('cp.approval_status = :approvalStatus', {
        approvalStatus: dto.approvalStatus,
      });
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map((row) => listItemFromTenant(row as TenantWithListing)),
      total,
      page,
      limit,
      sortBy,
      sortDir: sortDir === 'ASC' ? 'asc' : 'desc',
    };
  }

  async getReviewDetail(tenantId: string): Promise<AdminCatererReviewDetail> {
    const tenant = await this.tenants.findOne({
      where: { id: tenantId },
      relations: { ownerUser: true },
    });
    if (!tenant) {
      throw new NotFoundException('Caterer workspace not found');
    }

    const listing = await this.listings.findOne({
      where: { tenantId },
      relations: {
        cityRef: true,
        profileCategories: { category: true },
        profileServiceOfferings: { serviceOffering: true },
        profileKeywords: { keyword: true },
        galleryItems: true,
      },
    });
    if (!listing) {
      throw new NotFoundException('Marketplace profile not found');
    }

    const workspace = await this.marketplace.getWorkspaceProfile(tenantId);
    const owner = tenant.ownerUser;

    const categories = [...(listing.profileCategories ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        code: row.category.code,
        name: row.category.name,
      }));

    const serviceOfferings = [...(listing.profileServiceOfferings ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        id: row.serviceOfferingId,
        name: row.serviceOffering?.name ?? row.serviceOfferingId,
      }));

    const keywords = [...(listing.profileKeywords ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => row.keyword.label);

    return {
      tenantId: tenant.id,
      workspaceName: tenant.name,
      workspaceSlug: tenant.slug,
      profileSlug: buildMarketplaceProfileSlug(tenant.slug),
      subdomain: tenant.subdomain,
      provisionStatus: tenant.provisionStatus,
      owner: owner
        ? {
            id: owner.id,
            email: owner.email,
            fullName: owner.fullName,
            businessName: owner.businessName,
            phoneCountryCode: owner.phoneCountryCode,
            phoneNumber: owner.phoneNumber,
          }
        : null,
      published: listing.published,
      approvalStatus: listing.approvalStatus ?? 'draft',
      submittedForReviewAt: listing.submittedForReviewAt
        ? listing.submittedForReviewAt.toISOString()
        : null,
      reviewedAt: listing.reviewedAt ? listing.reviewedAt.toISOString() : null,
      completion: workspace.completion,
      business: {
        cityName: listing.cityRef?.name ?? null,
        streetAddress: workspace.streetAddress,
        tagline: workspace.tagline,
        about: workspace.about,
        yearsInBusiness: workspace.yearsInBusiness,
        capacityGuestMin: workspace.capacityGuestMin,
        capacityGuestMax: workspace.capacityGuestMax,
        priceBand: workspace.priceBand,
        priceFrom: workspace.priceFrom,
      },
      categories,
      serviceOfferings,
      keywords,
      portfolio: {
        heroImageUrl: workspace.heroImageUrl,
        galleryImageUrls: workspace.galleryImageUrls,
      },
      profileCreatedAt: toIso(listing.createdAt),
      profileUpdatedAt: toIso(listing.updatedAt),
    };
  }

  setMarketplaceApproval(
    tenantId: string,
    decision: 'approve' | 'reject',
    adminUserId: string,
  ) {
    return this.marketplace.setWorkspaceListingApprovalForAdmin(
      tenantId,
      decision,
      adminUserId,
    );
  }
}
