"use client";

import { Suspense } from "react";
import { I18nLoadingFallback } from "@/components/common/I18nLoadingFallback";
import { BlogListingLazy } from "@/components/blog/BlogListingLazy";

export default function BlogPage() {
  return (
    <Suspense fallback={<I18nLoadingFallback variant="insights" />}>
      <BlogListingLazy />
    </Suspense>
  );
}
