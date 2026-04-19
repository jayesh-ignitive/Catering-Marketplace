import { CaterersListingPageContent } from "@/components/caterers/CaterersListingPageContent";
import { fetchCities, fetchMarketplaceCities } from "@/lib/catering-api";
import { resolveListingCityNameFromSlug } from "@/lib/caterers-url";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ citySlug: string }> };

export default async function CaterersByCityPage({ params }: Props) {
  const { citySlug } = await params;
  const [marketplaceCities, catalogCities] = await Promise.all([
    fetchMarketplaceCities(),
    fetchCities(),
  ]);
  const cityName = resolveListingCityNameFromSlug(citySlug, marketplaceCities, catalogCities);
  if (!cityName) notFound();
  return (
    <CaterersListingPageContent key={`city-${citySlug}`} presetCityName={cityName} />
  );
}
