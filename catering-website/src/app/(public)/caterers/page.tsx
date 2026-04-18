"use client";

import { Suspense } from "react";
import { CaterersLegacyQueryRedirect } from "@/components/caterers/CaterersLegacyQueryRedirect";
import { CaterersListingPageContent } from "@/components/caterers/CaterersListingPageContent";

const listingFallback = (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f7f5] px-6">
    <div
      className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
      aria-hidden
    />
    <p className="mt-4 font-heading text-sm font-semibold text-brand-dark">Loading caterers…</p>
  </div>
);

export default function CaterersPage() {
  return (
    <Suspense fallback={listingFallback}>
      <CaterersLegacyQueryRedirect />
      <CaterersListingPageContent key="browse" />
    </Suspense>
  );
}
