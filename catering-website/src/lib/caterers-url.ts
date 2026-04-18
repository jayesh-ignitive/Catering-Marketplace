/** URL-safe segment: lowercase, hyphens (for city names from marketplace). */
export function slugifyCitySegment(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "city";
}

export function findMarketplaceCityNameBySlug(
  slug: string,
  cities: { city: string }[]
): string | null {
  const s = slug.trim().toLowerCase();
  const hit = cities.find((c) => slugifyCitySegment(c.city) === s);
  return hit?.city ?? null;
}

/** Path-only marketplace listing URL (no query string). */
export function caterersListingPath(opts: {
  cityName?: string | null;
  categorySlug?: string | null;
}): string {
  const citySeg =
    opts.cityName && String(opts.cityName).trim()
      ? slugifyCitySegment(String(opts.cityName))
      : null;
  const catSlug =
    opts.categorySlug && String(opts.categorySlug).trim()
      ? String(opts.categorySlug).trim()
      : null;
  if (citySeg && catSlug) return `/caterers/city/${citySeg}/services/${catSlug}`;
  if (citySeg) return `/caterers/city/${citySeg}`;
  if (catSlug) return `/caterers/services/${catSlug}`;
  return "/caterers";
}
