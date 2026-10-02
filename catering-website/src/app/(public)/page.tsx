import Home, { type HomeInitialData } from "@/components/Home";
import {
  fetchCitiesCached,
  fetchServiceCategoriesCached,
  fetchTrustStatsCached,
} from "@/lib/catalog-cache";
import { fetchBlogPostsCached } from "@/lib/blog";
import { fetchHomeHeroSlidesCached } from "@/lib/home-banners";
import { DEFAULT_LOCALE } from "@/i18n/locale";

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

  // The hero LCP image is preloaded by `next/image` itself (priority +
  // fetchPriority="high" in HomeHeroBackground), which emits an accurate
  // preload for the optimized `/_next/image` URL. A manual preload of the raw
  // CDN URL would just double-download an unoptimized copy.
  return <Home initialData={initialData} />;
}
