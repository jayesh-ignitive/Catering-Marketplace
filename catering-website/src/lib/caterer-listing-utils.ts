import type { MarketplaceListItem } from "@/lib/catering-api";

export const LISTING_PRICE_MIN = 200;
export const LISTING_PRICE_MAX = 5000;
export const LISTING_PRICE_STEP = 50;

export function isListingPriceRangeDefault(min: number, max: number): boolean {
  return min <= LISTING_PRICE_MIN && max >= LISTING_PRICE_MAX;
}

export type ListingSortOption = "popularity" | "rating" | "price-asc" | "price-desc";

export type ListingViewMode = "list" | "grid";

export type CatererCardBadge = { kind: "verified" | "top-rated" } | null;

export function getCatererCardBadge(row: MarketplaceListItem): CatererCardBadge {
  const rating = Number(row.avgRating ?? 0);
  const reviews = Number(row.reviewCount ?? 0);
  if (rating >= 4.8 && reviews >= 3) {
    return { kind: "top-rated" };
  }
  if (reviews >= 1 || rating >= 4.5) {
    return { kind: "verified" };
  }
  return null;
}

export function sortMarketplaceItems(
  items: MarketplaceListItem[],
  sort: ListingSortOption
): MarketplaceListItem[] {
  const copy = [...items];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
    case "price-asc":
      return copy.sort((a, b) => (a.priceFrom ?? Number.MAX_SAFE_INTEGER) - (b.priceFrom ?? Number.MAX_SAFE_INTEGER));
    case "price-desc":
      return copy.sort((a, b) => (b.priceFrom ?? 0) - (a.priceFrom ?? 0));
    case "popularity":
    default:
      return copy.sort(
        (a, b) =>
          b.reviewCount - a.reviewCount ||
          b.avgRating - a.avgRating ||
          a.businessName.localeCompare(b.businessName)
      );
  }
}

export function filterByMinRating(items: MarketplaceListItem[], minRating: number | null): MarketplaceListItem[] {
  if (minRating == null) return items;
  return items.filter((row) => Number(row.avgRating ?? 0) >= minRating);
}

export function filterByAreaQuery(items: MarketplaceListItem[], area: string): MarketplaceListItem[] {
  const q = area.trim().toLowerCase();
  if (!q) return items;
  return items.filter((row) => {
    const hay = [row.streetAddress, row.city, row.state].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });
}

const VIEW_MODE_KEY = "caterers-listing-view";

export function readListingViewMode(): ListingViewMode {
  if (typeof window === "undefined") return "list";
  try {
    const v = window.localStorage.getItem(VIEW_MODE_KEY);
    return v === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

export function persistListingViewMode(mode: ListingViewMode) {
  try {
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}
