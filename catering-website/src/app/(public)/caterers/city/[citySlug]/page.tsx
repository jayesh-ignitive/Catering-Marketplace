import { CaterersListingPageContent } from "@/components/caterers/CaterersListingPageContent";
import { fetchMarketplaceCities } from "@/lib/catering-api";
import { findMarketplaceCityNameBySlug } from "@/lib/caterers-url";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ citySlug: string }> };

export default async function CaterersByCityPage({ params }: Props) {
  const { citySlug } = await params;
  const cities = await fetchMarketplaceCities();
  const cityName = findMarketplaceCityNameBySlug(citySlug, cities);
  if (!cityName) notFound();
  return (
    <CaterersListingPageContent key={`city-${citySlug}`} presetCityName={cityName} />
  );
}
