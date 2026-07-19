import { PackagesPageContent } from "@/components/packages/PackagesPageContent";
import { fetchListingPackagesPageCached } from "@/lib/catalog-cache";
import { DEFAULT_LOCALE } from "@/i18n/locale";
import type { PublicPackagesPage } from "@/lib/listing-packages-api";

export default async function CateringPackagesPage() {
  let prefetchedPage: PublicPackagesPage | undefined;
  try {
    prefetchedPage = await fetchListingPackagesPageCached(DEFAULT_LOCALE);
  } catch {
    prefetchedPage = undefined;
  }

  return <PackagesPageContent prefetchedPage={prefetchedPage} />;
}
