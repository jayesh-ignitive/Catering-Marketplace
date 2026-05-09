import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

function toIso(d: Date | null | undefined): string {
  return (d ?? new Date()).toISOString();
}

function listItemFromTenant(t: Tenant): AdminCatererListItem {
  const owner = t.ownerUser;
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    subdomain: t.subdomain,
    dbName: t.dbName,
    provisionStatus: t.provisionStatus,
    profilePublished: t.profilePublished,
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
      profilePublished: 't.profilePublished',
      updatedAt: 't.updatedAt',
      ownerEmail: 'owner.email',
      ownerFullName: 'owner.fullName',
    };

    const qb = this.tenants
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.ownerUser', 'owner')
      .orderBy(orderExpr[sortBy], sortDir);

    if (q) {
      const like = `%${q.toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(t.name) LIKE :like OR LOWER(t.slug) LIKE :like OR LOWER(COALESCE(t.subdomain, '')) LIKE :like OR LOWER(COALESCE(owner.email, '')) LIKE :like OR LOWER(COALESCE(owner.fullName, '')) LIKE :like)",
        { like },
      );
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map(listItemFromTenant),
      total,
      page,
      limit,
      sortBy,
      sortDir: sortDir === 'ASC' ? 'asc' : 'desc',
    };
  }
}
