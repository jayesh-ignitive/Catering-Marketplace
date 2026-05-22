"use client";

import { LegalCmsPage } from "@/components/legal/LegalCmsPage";
import { useI18n } from "@/context/LocaleContext";

export default function PrivacyPage() {
  const { w } = useI18n();

  return (
    <LegalCmsPage
      slug="privacy"
      fallbackTitle={w.legal.privacyTitle}
      fallbackLastUpdated={w.legal.lastUpdated}
    />
  );
}
