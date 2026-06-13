import { DEFAULT_LOCALE } from "@/i18n/locale";
import { fetchServiceCategories, type ServiceCategory } from "@/lib/catering-api";

export const SERVICE_CATEGORIES_QUERY_KEY = ["catalog", "service-categories"] as const;

export function serviceCategoriesQueryOptions(
  locale: string,
  prefetched?: ServiceCategory[],
) {
  return {
    queryKey: [...SERVICE_CATEGORIES_QUERY_KEY, locale] as const,
    queryFn: () => fetchServiceCategories(locale),
    initialData:
      prefetched && locale === DEFAULT_LOCALE ? prefetched : undefined,
  };
}
