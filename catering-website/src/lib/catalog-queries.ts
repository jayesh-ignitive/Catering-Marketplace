import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/locale";
import { fetchServiceCategories, type ServiceCategory } from "@/lib/catering-api";
import {
  fetchListingPackagesPage,
  LISTING_PACKAGES_QUERY_KEY,
  LISTING_PACKAGES_STALE_MS,
  type PublicPackagesPage,
} from "@/lib/listing-packages-api";

export const SERVICE_CATEGORIES_QUERY_KEY = ["catalog", "service-categories"] as const;

export function serviceCategoriesQueryOptions(
  locale: AppLocale,
  prefetched?: ServiceCategory[],
) {
  return {
    queryKey: [...SERVICE_CATEGORIES_QUERY_KEY, locale] as const,
    queryFn: () => fetchServiceCategories(locale),
    initialData:
      prefetched && locale === DEFAULT_LOCALE ? prefetched : undefined,
  };
}

export function listingPackagesPageQueryOptions(
  locale: AppLocale,
  prefetched?: PublicPackagesPage,
) {
  return {
    queryKey: [...LISTING_PACKAGES_QUERY_KEY, locale] as const,
    queryFn: () => fetchListingPackagesPage(locale),
    staleTime: LISTING_PACKAGES_STALE_MS,
    initialData:
      prefetched && locale === DEFAULT_LOCALE ? prefetched : undefined,
  };
}
