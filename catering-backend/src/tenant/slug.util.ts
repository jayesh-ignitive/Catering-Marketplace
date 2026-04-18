/** URL-safe slug for subdomains (lowercase, hyphens). */
export function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return s || 'catering';
}

/** DNS host label (max 63) derived from business or brand name. */
export function subdomainLabelFrom(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  return s || 'catering';
}

/**
 * MySQL database name aligned with tenant slug (hyphens → underscores), `ct_` prefix, max 64 chars.
 */
export function mysqlDbNameFromTenantSlug(slug: string): string {
  const core = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-/g, '_');
  const body = core || 'catering';
  return `ct_${body}`.slice(0, 64);
}
