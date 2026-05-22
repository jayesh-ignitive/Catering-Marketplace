"use client";

import { Suspense } from "react";
import { I18nLoadingFallback } from "@/components/common/I18nLoadingFallback";
import { CatererDetailLazy } from "@/components/caterers/CatererDetailLazy";

export default function CatererDetailPage() {
  return (
    <Suspense fallback={<I18nLoadingFallback variant="profile" />}>
      <CatererDetailLazy />
    </Suspense>
  );
}
