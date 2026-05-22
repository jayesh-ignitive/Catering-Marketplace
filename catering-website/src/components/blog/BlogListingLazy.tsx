"use client";

import { useI18n } from "@/context/LocaleContext";
import dynamic from "next/dynamic";

function BlogListingLoading() {
  const { w } = useI18n();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center bg-[#f8f7f5] px-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
        aria-hidden
      />
      <p className="mt-4 font-heading text-sm font-semibold text-brand-dark">{w.blog.loadingInsights}</p>
    </div>
  );
}

const BlogPageContent = dynamic(
  () => import("./BlogPageContent").then((mod) => ({ default: mod.BlogPageContent })),
  { loading: () => <BlogListingLoading /> },
);

/** Code-split blog index — loads when `/blog` is visited. */
export function BlogListingLazy() {
  return <BlogPageContent />;
}
