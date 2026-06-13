import {
  getCateringApiBase,
  type City,
  type ServiceCategory,
  type TrustStats,
} from "@/lib/catering-api";

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
