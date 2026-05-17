import { getCateringApiBase } from "@/lib/catering-api";

export const HOME_BANNERS_QUERY_KEY = ["catalog", "home-banners"] as const;

/** Client-side React Query stale time (matches API Cache-Control max-age). */
export const HOME_BANNERS_STALE_MS = 5 * 60 * 1000;

/** Hero carousel slide on the home page first section. */
export type PublicHomeHeroSlide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  linkHref: string | null;
  linkLabel: string | null;
  displayOrder: number;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

type ApiHomeBanner = PublicHomeHeroSlide & { placement?: string };

function toHeroSlides(rows: ApiHomeBanner[]): PublicHomeHeroSlide[] {
  return rows
    .filter((b) => !b.placement || b.placement === "hero")
    .map(({ id, title, subtitle, imageUrl, linkHref, linkLabel, displayOrder }) => ({
      id,
      title,
      subtitle,
      imageUrl,
      linkHref,
      linkLabel,
      displayOrder,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Browser / client fetch (no HTTP cache on fetch; use React Query staleTime). */
export async function fetchHomeHeroSlides(): Promise<PublicHomeHeroSlide[]> {
  const res = await fetch(`${getCateringApiBase()}/api/catalog/home-banners`, {
    cache: "no-store",
  });
  const data = await parseJson<ApiHomeBanner[]>(res);
  return toHeroSlides(data);
}

/** Server Components / route handlers — Next.js Data Cache with revalidate tag. */
export async function fetchHomeHeroSlidesCached(): Promise<PublicHomeHeroSlide[]> {
  const res = await fetch(`${getCateringApiBase()}/api/catalog/home-banners`, {
    next: { revalidate: 300, tags: ["catalog-home-banners"] },
  });
  const data = await parseJson<ApiHomeBanner[]>(res);
  return toHeroSlides(data);
}

/** Call after admin writes to bust Next.js cached catalog responses. */
export async function revalidateHomeBannersCache(): Promise<void> {
  try {
    await fetch("/api/revalidate/home-banners", { method: "POST" });
  } catch {
    /* non-fatal if route unavailable in dev */
  }
}
