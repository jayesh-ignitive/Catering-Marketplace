import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogArticleLazy } from "@/components/blog/BlogArticleLazy";
import { fetchBlogPostCached } from "@/lib/blog";
import { buildBlogPostMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPostCached(slug);
  if (!post) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }
  return buildBlogPostMetadata(post);
}

export default function BlogArticlePage() {
  return (
    <Suspense fallback={<BlogArticleFallback />}>
      <BlogArticleLazy />
    </Suspense>
  );
}
