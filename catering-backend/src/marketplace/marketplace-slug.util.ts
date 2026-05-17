/** Public caterer profile path segment: unique tenant `slug` (e.g. `german-catering`). */
export function buildMarketplaceProfileSlug(tenantSlug: string): string {
  return tenantSlug.trim().toLowerCase();
}

/**
 * Resolves the path param to slug lookup candidates.
 * Supports legacy hyphenated suffixes (`slug-2`, `slug-abc`) and numeric suffixes (`slug2`).
 */
export function parseMarketplaceProfileSlug(
  param: string,
): { slugCandidates: string[] } | null {
  const lower = param.trim().toLowerCase();
  if (!lower || !/^[a-z0-9-]+$/.test(lower)) {
    return null;
  }
  const legacyHyphen = /^(.+)-(\d+|[a-f0-9]+)$/.exec(lower);
  if (legacyHyphen) {
    const base = legacyHyphen[1];
    return { slugCandidates: [lower, base] };
  }
  const numericSuffix = /^(.+?)(\d+)$/.exec(lower);
  if (numericSuffix && numericSuffix[1].length >= 3) {
    const base = numericSuffix[1];
    return { slugCandidates: [lower, base] };
  }
  return { slugCandidates: [lower] };
}
