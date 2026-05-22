"use client";

import { LegalCmsPage } from "@/components/legal/LegalCmsPage";
import { useI18n } from "@/context/LocaleContext";

export default function TermsPage() {
  const { w } = useI18n();

  return (
    <LegalCmsPage
      slug="terms"
      fallbackTitle={w.legal.termsTitle}
      fallbackLastUpdated={w.legal.lastUpdated}
    />
  );
}
