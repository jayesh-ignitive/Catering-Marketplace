import Home, { type HomeInitialData } from "@/components/Home";
import {
  fetchCitiesCached,
  fetchServiceCategoriesCached,
  fetchTrustStatsCached,
} from "@/lib/catalog-cache";
import { fetchBlogPostsCached } from "@/lib/blog";
import { HOME_FALLBACK_HERO_SRC } from "@/lib/home-assets";
import { fetchHomeHeroSlidesCached } from "@/lib/home-banners";
import { DEFAULT_LOCALE } from "@/i18n/locale";
import { preload } from "react-dom";

async function loadHomeInitialData(): Promise<HomeInitialData> {
  const locale = DEFAULT_LOCALE;
  try {
    const [cities, categories, stats, blog, heroSlides] = await Promise.all([
      fetchCitiesCached(locale),
      fetchServiceCategoriesCached(locale),
      fetchTrustStatsCached(),
      fetchBlogPostsCached({ page: 1, limit: 2 }),
      fetchHomeHeroSlidesCached(),
    ]);
    return { cities, categories, stats, blog, heroSlides };
  } catch {
    return {
      cities: [],
      categories: [],
      stats: null,
      blog: null,
      heroSlides: [],
    };
  }
}

export default async function HomePage() {
  const initialData = await loadHomeInitialData();
  const lcpImageSrc = initialData.heroSlides[0]?.imageUrl ?? HOME_FALLBACK_HERO_SRC;
  preload(lcpImageSrc, { as: "image", fetchPriority: "high" });

  return <Home initialData={initialData} />;
}
