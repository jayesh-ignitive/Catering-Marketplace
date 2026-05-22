import { getCateringApiBase } from "@/lib/catering-api";
import type { AppLocale } from "@/i18n/locale";

export const LEGAL_QUERY_KEY = ["legal"] as const;
export const LEGAL_STALE_MS = 5 * 60 * 1000;

export type LegalPageSlug = "terms" | "privacy";

export type PublicLegalPage = {
  slug: LegalPageSlug;
  title: string;
  lastUpdatedLabel: string;
  bodyHtml: string;
  languageCode: string;
  fallback: boolean;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchLegalPage(
  slug: LegalPageSlug,
  locale: AppLocale,
): Promise<PublicLegalPage> {
  const base = getCateringApiBase();
  const res = await fetch(
    `${base}/api/legal/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`,
    { cache: "no-store" },
  );
  return parseJson<PublicLegalPage>(res);
}
