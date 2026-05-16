import { Suspense } from "react";
import { BlogListingLazy } from "@/components/blog/BlogListingLazy";

function BlogListingFallback() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center bg-[#f8f7f5] px-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
        aria-hidden
      />
      <p className="mt-4 font-heading text-sm font-semibold text-brand-dark">Loading insights…</p>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogListingFallback />}>
      <BlogListingLazy />
    </Suspense>
  );
}
