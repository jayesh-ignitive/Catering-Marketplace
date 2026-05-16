import { Suspense } from "react";
import { CatererDetailLazy } from "@/components/caterers/CatererDetailLazy";

function CatererDetailFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white py-24">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
        aria-hidden
      />
      <p className="mt-4 font-heading text-sm font-semibold text-brand-dark">Loading profile…</p>
    </div>
  );
}

export default function CatererDetailPage() {
  return (
    <Suspense fallback={<CatererDetailFallback />}>
      <CatererDetailLazy />
    </Suspense>
  );
}
