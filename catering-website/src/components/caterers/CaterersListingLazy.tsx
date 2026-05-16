"use client";

import dynamic from "next/dynamic";
import type { CaterersListingPageContentProps } from "./CaterersListingPageContent";

function CaterersListingLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center bg-gray-50 px-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
        aria-hidden
      />
      <p className="mt-4 font-heading text-sm font-semibold text-brand-dark">Loading caterers…</p>
    </div>
  );
}

const CaterersListingPageContent = dynamic(
  () =>
    import("./CaterersListingPageContent").then((mod) => ({
      default: mod.CaterersListingPageContent,
    })),
  { loading: () => <CaterersListingLoading /> }
);

/** Code-split listing UI (filters, cards, slider) — used by `/caterers` and SEO listing routes. */
export function CaterersListingLazy(props: CaterersListingPageContentProps) {
  return <CaterersListingPageContent {...props} />;
}
