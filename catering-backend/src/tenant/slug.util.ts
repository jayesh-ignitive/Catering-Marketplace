import { randomBytes, randomUUID } from 'crypto';
import type { Repository } from 'typeorm';
import type { Tenant } from './tenant.entity';

/** Alphanumeric slug from business or brand name (lowercase a-z, 0-9 only). */
export function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 50);
  return s || 'catering';
}

/** DNS host label (max 63) derived from business or brand name. */
export function subdomainLabelFrom(input: string): string {
  return slugify(input).slice(0, 63) || 'catering';
}

/**
 * MySQL database name aligned with tenant slug, `ct_` prefix, max 64 chars.
 */
export function mysqlDbNameFromTenantSlug(slug: string): string {
  const core = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 54);
  const body = core || 'catering';
  return `ct_${body}`.slice(0, 64);
}

/** Unique tenant slug from business name; appends digits or hex when taken. */
export async function ensureUniqueTenantSlug(
  tenantRepo: Repository<Tenant>,
  baseInput: string,
): Promise<string> {
  const base = slugify(baseInput).slice(0, 50) || 'catering';
  let candidate = base;
  for (let i = 0; i < 24; i++) {
    const taken = await tenantRepo.exist({ where: { slug: candidate } });
    if (!taken) {
      return candidate;
    }
    const suffix =
      i < 20 ? String(i + 2) : randomBytes(3).toString('hex');
    candidate = `${base}${suffix}`.slice(0, 80);
  }
  return `${base}${randomUUID().replace(/-/g, '').slice(0, 8)}`.slice(0, 80);
}

/** Unique workspace subdomain label from business name. */
export async function ensureUniqueSubdomain(
  tenantRepo: Repository<Tenant>,
  baseInput: string,
): Promise<string> {
  const base = subdomainLabelFrom(baseInput) || 'catering';
  let candidate = base;
  for (let i = 0; i < 24; i++) {
    const taken = await tenantRepo.exist({ where: { subdomain: candidate } });
    if (!taken) {
      return candidate;
    }
    const suffix =
      i < 20 ? String(i + 2) : randomBytes(2).toString('hex');
    candidate = `${base}${suffix}`.slice(0, 63);
  }
  return `${base}${randomUUID().replace(/-/g, '').slice(0, 8)}`.slice(0, 63);
}

/** Unique MySQL database name for a tenant slug. */
export async function ensureUniqueDbName(
  tenantRepo: Repository<Tenant>,
  tenantSlug: string,
): Promise<string> {
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
