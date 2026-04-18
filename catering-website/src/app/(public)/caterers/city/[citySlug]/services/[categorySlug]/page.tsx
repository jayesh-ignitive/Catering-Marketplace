import { CaterersListingPageContent } from "@/components/caterers/CaterersListingPageContent";
import { fetchMarketplaceCities, fetchServiceCategories } from "@/lib/catering-api";
import { findMarketplaceCityNameBySlug } from "@/lib/caterers-url";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ citySlug: string; categorySlug: string }> };

export default async function CaterersByCityAndCategoryPage({ params }: Props) {
  const { citySlug, categorySlug } = await params;
  const [cities, cats] = await Promise.all([fetchMarketplaceCities(), fetchServiceCategories()]);
  const cityName = findMarketplaceCityNameBySlug(citySlug, cities);
  const cat = cats.find((c) => c.slug.toLowerCase() === categorySlug.toLowerCase());
  if (!cityName || !cat) notFound();
  return (
    <CaterersListingPageContent
      key={`${citySlug}-${categorySlug}`}
      presetCityName={cityName}
      presetCategoryId={cat.id}
    />
  );
}
