import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSubmission } from '../contact/contact-submission.entity';
import { UpdateContactInquiryStatusDto } from '../admin/dto/update-contact-inquiry-status.dto';
import type {
  ListWorkspaceInquiriesQueryDto,
  WorkspaceInquirySortField,
} from './dto/list-workspace-inquiries-query.dto';
import { MarketplaceService } from './marketplace.service';

export type WorkspaceInquiryListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  messagePreview: string;
  solved: boolean;
  solvedAt: string | null;
  createdAt: string;
};

export type WorkspaceInquiryDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  solved: boolean;
  solvedAt: string | null;
  createdAt: string;
};

export type WorkspaceInquiryListResponse = {
  items: WorkspaceInquiryListItem[];
  total: number;
  page: number;
  limit: number;
  sortBy: WorkspaceInquirySortField;
  sortDir: 'asc' | 'desc';
  openCount: number;
};

function toIso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

function messagePreview(message: string, max = 140): string {
  const t = message.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function listItemFromRow(row: ContactSubmission): WorkspaceInquiryListItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    messagePreview: messagePreview(row.message),
    solved: Boolean(row.solved),
    solvedAt: toIso(row.solvedAt),
    createdAt: toIso(row.createdAt)!,
  };
}

function detailFromRow(row: ContactSubmission): WorkspaceInquiryDetail {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    solved: Boolean(row.solved),
    solvedAt: toIso(row.solvedAt),
    createdAt: toIso(row.createdAt)!,
  };
}

@Injectable()
export class WorkspaceInquiriesService {
  constructor(
    @InjectRepository(ContactSubmission)
    private readonly submissions: Repository<ContactSubmission>,
    private readonly marketplace: MarketplaceService,
  ) {}

  private async tenantIdForUser(userId: string): Promise<string> {
    return this.marketplace.resolveTenantIdForWorkspaceUser(userId);
  }

  async listForUser(
    userId: string,
    dto: ListWorkspaceInquiriesQueryDto,
  ): Promise<WorkspaceInquiryListResponse> {
    const tenantId = await this.tenantIdForUser(userId);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const q = dto.q?.trim();

    const sortBy: WorkspaceInquirySortField = dto.sortBy ?? 'createdAt';
    const sortDir: 'ASC' | 'DESC' = dto.sortDir === 'asc' ? 'ASC' : 'DESC';

    const orderExpr: Record<WorkspaceInquirySortField, string> = {
      createdAt: 'c.createdAt',
      name: 'c.name',
      email: 'c.email',
      subject: 'c.subject',
      solved: 'c.solved',
    };

    const qb = this.submissions
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .orderBy(orderExpr[sortBy], sortDir);

    const statusFilter = dto.status ?? 'all';
    if (statusFilter === 'open') {
      qb.andWhere('c.solved = :solved', { solved: false });
    } else if (statusFilter === 'solved') {
      qb.andWhere('c.solved = :solved', { solved: true });
    }

    if (q) {
      qb.andWhere(
        `(LOWER(c.name) LIKE :like OR LOWER(c.email) LIKE :like OR LOWER(c.subject) LIKE :like OR LOWER(c.message) LIKE :like)`,
        { like: `%${q.toLowerCase()}%` },
      );
    }

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const openCount = await this.submissions.count({
      where: { tenantId, solved: false },
    });

    return {
      items: rows.map(listItemFromRow),
      total,
      page,
      limit,
      sortBy,
      sortDir: sortDir === 'ASC' ? 'asc' : 'desc',
      openCount,
    };
  }

  async findOneForUser(
    userId: string,
    id: string,
  ): Promise<WorkspaceInquiryDetail> {
    const tenantId = await this.tenantIdForUser(userId);
    const row = await this.submissions.findOne({ where: { id, tenantId } });
    if (!row) {
      throw new NotFoundException('Inquiry not found');
    }
    return detailFromRow(row);
  }

  async setStatusForUser(
    userId: string,
    id: string,
    dto: UpdateContactInquiryStatusDto,
  ): Promise<WorkspaceInquiryDetail> {
    const tenantId = await this.tenantIdForUser(userId);
    const row = await this.submissions.findOne({ where: { id, tenantId } });
    if (!row) {
      throw new NotFoundException('Inquiry not found');
    }
    row.solved = dto.solved;
    row.solvedAt = dto.solved ? new Date() : null;
    await this.submissions.save(row);
    return detailFromRow(row);
  }
}
