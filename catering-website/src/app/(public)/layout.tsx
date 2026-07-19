import { SiteFooter } from "@/components/common/SiteFooter";
import { SiteHeader } from "@/components/common/SiteHeader";
import { greatVibes } from "@/app/fonts";
import { fetchServiceCategoriesCached } from "@/lib/catalog-cache";
import { DEFAULT_LOCALE } from "@/i18n/locale";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  let prefetchedCategories: Awaited<ReturnType<typeof fetchServiceCategoriesCached>> = [];
  try {
    prefetchedCategories = await fetchServiceCategoriesCached(DEFAULT_LOCALE);
  } catch {
    /* footer/header fall back to client fetch */
  }

  return (
    <div className={greatVibes.variable}>
      <SiteHeader prefetchedCategories={prefetchedCategories} />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter prefetchedCategories={prefetchedCategories} />
    </div>
  );
}
