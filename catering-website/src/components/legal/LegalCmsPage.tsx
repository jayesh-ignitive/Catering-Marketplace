"use client";

import { LegalPageShell } from "@/components/common/LegalPageShell";
import { useI18n } from "@/context/LocaleContext";
import { LEGAL_QUERY_KEY, LEGAL_STALE_MS, fetchLegalPage, type LegalPageSlug } from "@/lib/legal-api";
import { useQuery } from "@tanstack/react-query";

type LegalCmsPageProps = {
  slug: LegalPageSlug;
  fallbackTitle: string;
  fallbackLastUpdated: string;
};

export function LegalCmsPage({ slug, fallbackTitle, fallbackLastUpdated }: LegalCmsPageProps) {
  const { locale } = useI18n();

  const q = useQuery({
    queryKey: [...LEGAL_QUERY_KEY, slug, locale],
    queryFn: () => fetchLegalPage(slug, locale),
    staleTime: LEGAL_STALE_MS,
    retry: 1,
  });

  if (q.isLoading) {
    return (
      <LegalPageShell title={fallbackTitle} lastUpdatedLabel={fallbackLastUpdated}>
        <p className="text-sm text-gray-500">Loading…</p>
      </LegalPageShell>
    );
  }

  if (q.isError || !q.data) {
    return (
      <LegalPageShell title={fallbackTitle} lastUpdatedLabel={fallbackLastUpdated}>
        <p className="text-sm text-gray-600">
          Content is temporarily unavailable. Please try again later or contact support.
        </p>
      </LegalPageShell>
    );
  }

  return (
    <LegalPageShell
      title={q.data.title}
      lastUpdatedLabel={q.data.lastUpdatedLabel}
      bodyHtml={q.data.bodyHtml}
    />
  );
}
