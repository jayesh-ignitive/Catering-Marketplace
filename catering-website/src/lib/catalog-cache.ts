import {
  getCateringApiBase,
  type City,
  type MarketplaceCityFilter,
  type ServiceCategory,
  type TrustStats,
} from "@/lib/catering-api";
import type { PublicPackagesPage } from "@/lib/listing-packages-api";

const CATALOG_REVALIDATE = 300;

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Server Components — Next.js Data Cache with short revalidate. */
export async function fetchCitiesCached(locale: string = "en"): Promise<City[]> {
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/cities?locale=${encodeURIComponent(locale)}`,
    { next: { revalidate: CATALOG_REVALIDATE, tags: ["catalog-cities"] } },
  );
  return parseJson<City[]>(res);
}

export async function fetchServiceCategoriesCached(
  locale: string = "en",
): Promise<ServiceCategory[]> {
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/service-categories?locale=${encodeURIComponent(locale)}`,
    { next: { revalidate: CATALOG_REVALIDATE, tags: ["catalog-service-categories"] } },
  );
  return parseJson<ServiceCategory[]>(res);
}

export async function fetchTrustStatsCached(): Promise<TrustStats> {
  const base = getCateringApiBase();
  const opts = { next: { revalidate: CATALOG_REVALIDATE, tags: ["catalog-stats"] } };
  const [catalogRes, mRes] = await Promise.all([
    fetch(`${base}/api/catalog/stats`, opts),
    fetch(`${base}/api/marketplace/stats`, opts).catch(() => null),
  ]);
  const catalog = await parseJson<TrustStats>(catalogRes);
  if (mRes?.ok) {
    const m = (await mRes.json()) as { caterersListed?: number };
    if (typeof m.caterersListed === "number") {
      return { ...catalog, cateringServicesListed: m.caterersListed };
    }
  }
  return catalog;
}

/** Server Components — listing packages page (plans + comparison), cached like home data. */
export async function fetchListingPackagesPageCached(
  locale: string = "en",
): Promise<PublicPackagesPage> {
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/listing-packages?locale=${encodeURIComponent(locale)}`,
    { next: { revalidate: CATALOG_REVALIDATE, tags: ["catalog-listing-packages"] } },
  );
  return parseJson<PublicPackagesPage>(res);
}

/** Server Components — marketplace city filters for listing URL resolution. */
export async function fetchMarketplaceCitiesCached(
  locale: string = "en",
): Promise<MarketplaceCityFilter[]> {
  const res = await fetch(
    `${getCateringApiBase()}/api/marketplace/caterers/cities?locale=${encodeURIComponent(locale)}`,
    { next: { revalidate: CATALOG_REVALIDATE, tags: ["marketplace-cities"] } },
  );
  return parseJson(res);
}
