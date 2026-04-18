import { CaterersListingPageContent } from "@/components/caterers/CaterersListingPageContent";
import { fetchServiceCategories } from "@/lib/catering-api";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ categorySlug: string }> };

export default async function CaterersByCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const cats = await fetchServiceCategories();
  const cat = cats.find((c) => c.slug.toLowerCase() === categorySlug.toLowerCase());
  if (!cat) notFound();
  return (
    <CaterersListingPageContent key={`svc-${categorySlug}`} presetCategoryId={cat.id} />
  );
}
