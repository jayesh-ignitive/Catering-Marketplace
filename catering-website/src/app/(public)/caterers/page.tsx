"use client";

import { Suspense } from "react";
import { CaterersLegacyQueryRedirect } from "@/components/caterers/CaterersLegacyQueryRedirect";
import { I18nLoadingFallback } from "@/components/common/I18nLoadingFallback";
import { CaterersListingLazy } from "@/components/caterers/CaterersListingLazy";

export default function CaterersPage() {
  return (
    <Suspense fallback={<I18nLoadingFallback variant="caterers" />}>
      <CaterersLegacyQueryRedirect />
      <CaterersListingLazy key="browse" />
    </Suspense>
  );
}
