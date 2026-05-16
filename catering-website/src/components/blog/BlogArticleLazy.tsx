"use client";

import dynamic from "next/dynamic";

function BlogArticleLoading() {
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

const BlogArticleContent = dynamic(
  () => import("./BlogArticleContent").then((mod) => ({ default: mod.BlogArticleContent })),
  { loading: () => <BlogArticleLoading /> }
);

/** Code-split blog article — loads when `/blog/[slug]` is visited. */
export function BlogArticleLazy() {
  return <BlogArticleContent />;
}
