import { CaterersListingLazy } from "@/components/caterers/CaterersListingLazy";
import {
  fetchCitiesCached,
  fetchMarketplaceCitiesCached,
  fetchServiceCategoriesCached,
} from "@/lib/catalog-cache";
import type { City, MarketplaceCityFilter, ServiceCategory } from "@/lib/catering-api";
import { resolveListingCityNameFromSlug } from "@/lib/caterers-url";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ citySlug: string; categorySlug: string }> };

export default async function CaterersByCityAndCategoryPage({ params }: Props) {
  const { citySlug, categorySlug } = await params;
  const [marketplaceCities, catalogCities, cats] = await Promise.all([
    fetchMarketplaceCitiesCached().catch(() => [] as MarketplaceCityFilter[]),
    fetchCitiesCached().catch(() => [] as City[]),
    fetchServiceCategoriesCached().catch(() => [] as ServiceCategory[]),
  ]);
  const cityName = resolveListingCityNameFromSlug(citySlug, marketplaceCities, catalogCities);
  const cat = cats.find((c) => c.slug.toLowerCase() === categorySlug.toLowerCase());
  if (!cityName || !cat) notFound();
  return (
    <CaterersListingLazy
      key={`${citySlug}-${categorySlug}`}
      presetCityName={cityName}
      presetCategoryId={cat.id}
    />
  );
}
