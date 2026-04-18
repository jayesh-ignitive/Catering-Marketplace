/** Public caterer profile path segment: unique tenant `slug` (e.g. `german-catering`). */
export function buildMarketplaceProfileSlug(tenantSlug: string): string {
  return tenantSlug.trim().toLowerCase();
}

/**
 * Resolves the path param to slug lookup candidates (new: slug only; legacy: `slug-nnnnn` → try `slug`).
 */
export function parseMarketplaceProfileSlug(param: string): { slugCandidates: string[] } | null {
  const lower = param.trim().toLowerCase();
  if (!lower) {
    return null;
  }
  const legacy = /^(.+)-(\d+)$/.exec(lower);
  if (legacy) {
    const base = legacy[1]!;
    return { slugCandidates: [base, lower] };
  }
  return { slugCandidates: [lower] };
}
