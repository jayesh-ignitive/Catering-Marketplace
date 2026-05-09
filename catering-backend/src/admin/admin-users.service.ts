import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatererMarketplaceListing } from '../marketplace/caterer-marketplace-listing.entity';
import { buildMarketplaceProfileSlug } from '../marketplace/marketplace-slug.util';
import type { Tenant } from '../tenant/tenant.entity';
import { User } from '../user/user.entity';
import type {
  AdminUserSortField,
  ListAdminUsersQueryDto,
} from './dto/list-admin-users-query.dto';

export type AdminTenantSnapshot = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  dbName: string | null;
  provisionStatus: string;
  profilePublished: boolean;
  profileOptions: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminMarketplaceProfileSnapshot = {
  tenantId: string;
  profileSlug: string;
  published: boolean;
  tagline: string | null;
  aboutPreview: string | null;
  heroImageUrl: string | null;
  avgRating: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserListItem = {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  role: string;
  emailVerified: boolean;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  createdAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  emailVerifiedAt: string | null;
  emailVerificationExpiresAt: string | null;
  /** User has an unused email verification link token set (value never exposed). */
  hasEmailVerificationLink: boolean;
  /** User has a pending OTP hash on file (raw secret never exposed). */
  hasPendingEmailOtp: boolean;
  updatedAt: string;
  tenant: AdminTenantSnapshot | null;
  /** Tenant row where this user is `tenants.user_id` owner (may overlap with `tenant`). */
  ownedTenant: AdminTenantSnapshot | null;
  marketplaceProfile: AdminMarketplaceProfileSnapshot | null;
};

export type AdminUserListResponse = {
  items: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  sortBy: AdminUserSortField;
  sortDir: 'asc' | 'desc';
};

function toIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

function tenantSnapshot(t: Tenant | null): AdminTenantSnapshot | null {
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    subdomain: t.subdomain,
    dbName: t.dbName,
    provisionStatus: t.provisionStatus,
    profilePublished: t.profilePublished,
    profileOptions: t.profileOptions,
    createdAt: toIso(t.createdAt)!,
    updatedAt: toIso(t.updatedAt)!,
  };
}

function listItemFromUser(user: User): AdminUserListItem {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    businessName: user.businessName,
    phoneCountryCode: user.phoneCountryCode,
    phoneNumber: user.phoneNumber,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    tenantId: user.tenant?.id ?? null,
    tenantSlug: user.tenant?.slug ?? null,
    tenantName: user.tenant?.name ?? null,
    createdAt: toIso(user.createdAt)!,
  };
}

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(CatererMarketplaceListing)
    private readonly listings: Repository<CatererMarketplaceListing>,
  ) {}

  async list(dto: ListAdminUsersQueryDto): Promise<AdminUserListResponse> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const q = dto.q?.trim();

    const sortBy: AdminUserSortField = dto.sortBy ?? 'createdAt';
    const sortDir: 'ASC' | 'DESC' = dto.sortDir === 'asc' ? 'ASC' : 'DESC';

    const orderExpr: Record<AdminUserSortField, string> = {
      createdAt: 'u.createdAt',
      email: 'u.email',
      fullName: 'u.fullName',
      role: 'u.role',
      tenantSlug: 'tenant.slug',
      tenantName: 'tenant.name',
      emailVerified: 'u.emailVerifiedAt',
    };

    const qb = this.users
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.tenant', 'tenant')
      .orderBy(orderExpr[sortBy], sortDir);

    if (q) {
      qb.andWhere(
        '(LOWER(u.email) LIKE :like OR LOWER(u.fullName) LIKE :like)',
        {
          like: `%${q.toLowerCase()}%`,
        },
      );
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map(listItemFromUser),
      total,
      page,
      limit,
      sortBy,
      sortDir: sortDir === 'ASC' ? 'asc' : 'desc',
    };
  }

  async findOne(id: string): Promise<AdminUserDetail> {
    const user = await this.users.findOne({
      where: { id },
      relations: { tenant: true, ownedTenant: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let marketplaceProfile: AdminMarketplaceProfileSnapshot | null = null;
    const tenantId = user.tenant?.id ?? user.ownedTenant?.id ?? null;
    const tenantSlug = user.tenant?.slug ?? user.ownedTenant?.slug ?? null;
    if (tenantId && tenantSlug) {
      const listing = await this.listings.findOne({ where: { tenantId } });
      if (listing) {
        const about = listing.about?.trim() ?? null;
        marketplaceProfile = {
          tenantId: listing.tenantId,
          profileSlug: buildMarketplaceProfileSlug(tenantSlug),
          published: listing.published,
          tagline: listing.tagline,
          aboutPreview: about
            ? about.length > 400
              ? `${about.slice(0, 400)}…`
              : about
            : null,
          heroImageUrl: listing.heroImageUrl,
          avgRating: listing.avgRating,
          reviewCount: listing.reviewCount,
          createdAt: toIso(listing.createdAt)!,
          updatedAt: toIso(listing.updatedAt)!,
        };
      }
    }

    const base = listItemFromUser(user);

    return {
      ...base,
      emailVerifiedAt: toIso(user.emailVerifiedAt),
      emailVerificationExpiresAt: toIso(user.emailVerificationExpiresAt),
      hasEmailVerificationLink: Boolean(user.emailVerificationToken),
      hasPendingEmailOtp: Boolean(
        user.emailVerificationOtpHash && user.emailVerificationExpiresAt,
      ),
      updatedAt: toIso(user.updatedAt)!,
      tenant: tenantSnapshot(user.tenant),
      ownedTenant: tenantSnapshot(user.ownedTenant),
      marketplaceProfile,
    };
  }
}
