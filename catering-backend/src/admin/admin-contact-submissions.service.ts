import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSubmission } from '../contact/contact-submission.entity';
import type {
  AdminContactSortField,
  ListAdminContactSubmissionsQueryDto,
} from './dto/list-admin-contact-submissions-query.dto';

export type AdminContactListItem = {
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

export type AdminContactDetail = {
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

export type AdminContactListResponse = {
  items: AdminContactListItem[];
  total: number;
  page: number;
  limit: number;
  sortBy: AdminContactSortField;
  sortDir: 'asc' | 'desc';
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

function listItemFromRow(row: ContactSubmission): AdminContactListItem {
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

function detailFromRow(row: ContactSubmission): AdminContactDetail {
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
export class AdminContactSubmissionsService {
  constructor(
    @InjectRepository(ContactSubmission)
    private readonly submissions: Repository<ContactSubmission>,
  ) {}

  async list(
    dto: ListAdminContactSubmissionsQueryDto,
  ): Promise<AdminContactListResponse> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const q = dto.q?.trim();

    const sortBy: AdminContactSortField = dto.sortBy ?? 'createdAt';
    const sortDir: 'ASC' | 'DESC' = dto.sortDir === 'asc' ? 'ASC' : 'DESC';

    const orderExpr: Record<AdminContactSortField, string> = {
      createdAt: 'c.createdAt',
      name: 'c.name',
      email: 'c.email',
      subject: 'c.subject',
      solved: 'c.solved',
    };

    const qb = this.submissions
      .createQueryBuilder('c')
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

    return {
      items: rows.map(listItemFromRow),
      total,
      page,
      limit,
      sortBy,
      sortDir: sortDir === 'ASC' ? 'asc' : 'desc',
    };
  }

  async findOne(id: string): Promise<AdminContactDetail> {
    const row = await this.submissions.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Contact inquiry not found');
    }
    return detailFromRow(row);
  }

  async setSolved(id: string, solved: boolean): Promise<AdminContactDetail> {
    const row = await this.submissions.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Contact inquiry not found');
    }
    row.solved = solved;
    row.solvedAt = solved ? new Date() : null;
    await this.submissions.save(row);
    return detailFromRow(row);
  }
}
