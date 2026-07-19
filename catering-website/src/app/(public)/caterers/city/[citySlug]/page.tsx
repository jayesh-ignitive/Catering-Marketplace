import { CaterersListingLazy } from "@/components/caterers/CaterersListingLazy";
import {
  fetchCitiesCached,
  fetchMarketplaceCitiesCached,
} from "@/lib/catalog-cache";
import type { City, MarketplaceCityFilter } from "@/lib/catering-api";
import { resolveListingCityNameFromSlug } from "@/lib/caterers-url";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ citySlug: string }> };

export default async function CaterersByCityPage({ params }: Props) {
  const { citySlug } = await params;
  const [marketplaceCities, catalogCities] = await Promise.all([
    fetchMarketplaceCitiesCached().catch(() => [] as MarketplaceCityFilter[]),
    fetchCitiesCached().catch(() => [] as City[]),
  ]);
  const cityName = resolveListingCityNameFromSlug(citySlug, marketplaceCities, catalogCities);
  if (!cityName) notFound();
  return (
    <CaterersListingLazy key={`city-${citySlug}`} presetCityName={cityName} />
  );
}
