import { CaterersListingPageContent } from "@/components/caterers/CaterersListingPageContent";
import { fetchCities, fetchMarketplaceCities, fetchServiceCategories } from "@/lib/catering-api";
import { resolveListingCityNameFromSlug } from "@/lib/caterers-url";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ citySlug: string; categorySlug: string }> };

export default async function CaterersByCityAndCategoryPage({ params }: Props) {
  const { citySlug, categorySlug } = await params;
  const [marketplaceCities, catalogCities, cats] = await Promise.all([
    fetchMarketplaceCities(),
    fetchCities(),
    fetchServiceCategories(),
  ]);
  const cityName = resolveListingCityNameFromSlug(citySlug, marketplaceCities, catalogCities);
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
