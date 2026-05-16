"use client";

import dynamic from "next/dynamic";

function CatererDetailLoading() {
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

const CatererDetailView = dynamic(
  () =>
    import("./CatererDetailView").then((mod) => ({
      default: mod.CatererDetailView,
    })),
  { loading: () => <CatererDetailLoading /> }
);

/** Code-split caterer detail UI — loads when `/caterers/[slug]` is visited. */
export function CatererDetailLazy() {
  return <CatererDetailView />;
}
