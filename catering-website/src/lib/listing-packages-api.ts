import { getCateringApiBase } from "@/lib/catering-api";
import type { AppLocale } from "@/i18n/locale";

export const LISTING_PACKAGES_QUERY_KEY = ["catalog", "listing-packages"] as const;
export const LISTING_PACKAGES_STALE_MS = 5 * 60 * 1000;

export type PublicListingPlan = {
  id: string;
  code: string;
  priceDisplay: string;
  icon: string;
  isRecommended: boolean;
  isDarkTheme: boolean;
  contactTopic: string;
  name: string;
  subtitle: string;
  periodLabel: string;
  ctaLabel: string;
  features: string[];
};

export type PublicComparisonRow = {
  id: string;
  label: string;
  essential: boolean | string;
  growth: boolean | string;
  premier: boolean | string;
};

export type PublicPackagesPage = {
  page: {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    valueTitle: string;
    valueBody: string;
    discoverTitle: string;
    discoverSubtitle: string;
    comparisonTitle: string;
    comparisonHint: string;
    featureColumnLabel: string;
    tierEssentialLabel: string;
    tierGrowthLabel: string;
    tierPremierLabel: string;
    recommendedBadge: string;
    audienceTitle: string;
    audienceSubtitle: string;
    audienceTags: string[];
    helpTitle: string;
    helpBody: string;
    browseDirectoryLabel: string;
    disclaimerText: string;
  };
  plans: PublicListingPlan[];
  comparisonRows: PublicComparisonRow[];
  languageCode: string;
  fallback: boolean;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchListingPackagesPage(
  locale: AppLocale,
): Promise<PublicPackagesPage> {
  const base = getCateringApiBase();
  const res = await fetch(
    `${base}/api/catalog/listing-packages?locale=${encodeURIComponent(locale)}`,
    { cache: "no-store" },
  );
  return parseJson<PublicPackagesPage>(res);
}
