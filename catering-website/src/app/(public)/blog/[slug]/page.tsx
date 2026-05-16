import { Suspense } from "react";
import { BlogArticleLazy } from "@/components/blog/BlogArticleLazy";

function BlogArticleFallback() {
  return (
    <div className="min-h-[60vh] px-6 py-24">
      <div className="mx-auto max-w-3xl animate-pulse space-y-8">
        <div className="aspect-[21/9] rounded-3xl bg-gray-200" />
        <div className="h-10 w-3/4 rounded-lg bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function BlogArticlePage() {
  return (
    <Suspense fallback={<BlogArticleFallback />}>
      <BlogArticleLazy />
    </Suspense>
  );
}
