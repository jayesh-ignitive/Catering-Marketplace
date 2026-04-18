"use client";

import { ArrowLeft, CalendarBlank } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchBlogPost } from "@/lib/catering-api";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=85";

function formatPublished(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BlogArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const q = useQuery({
    queryKey: ["catalog", "blog", slug],
    queryFn: () => fetchBlogPost(slug),
    enabled: Boolean(slug),
    retry: false,
  });

  if (!slug) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-gray-600">
        Invalid article link.
      </div>
    );
  }

  if (q.isPending) {
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

  if (q.isError || !q.data) {
    const notFound = q.error instanceof Error && q.error.message === "not_found";
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          {notFound ? "Article not found" : "Unable to load article"}
        </h1>
        <p className="mt-3 text-gray-600">
          {notFound ? "Check the URL or browse all posts." : "Ensure the API is running and try again."}
        </p>
        <button
          type="button"
          className="mt-8 rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white hover:bg-red-700"
          onClick={() => router.push("/blog")}
        >
          Back to insights
        </button>
      </div>
    );
  }

  const post = q.data;
  const heroImg = post.featuredImageUrl ?? FALLBACK_IMG;

  return (
    <article className="min-h-screen bg-white pb-20">
      <header className="relative">
        <div className="relative aspect-[21/9] max-h-[420px] w-full bg-brand-dark">
          <Image src={heroImg} alt="" fill priority className="object-cover opacity-95" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent" aria-hidden />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 pt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-red transition hover:text-red-800"
          >
            <ArrowLeft aria-hidden />
            All insights
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">
              {post.categoryLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlank className="text-brand-red" aria-hidden />
              <time dateTime={post.publishedAt}>{formatPublished(post.publishedAt)}</time>
            </span>
          </div>

          <h1 className="font-heading mt-6 text-3xl font-extrabold leading-tight tracking-tight text-brand-dark sm:text-4xl lg:text-[2.35rem]">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">{post.excerpt}</p>
        </div>
      </header>

      <div
        className="blog-content mx-auto mt-12 max-w-3xl px-6 text-gray-700 [&_p]:mb-5 [&_p]:leading-relaxed [&_strong]:font-bold [&_strong]:text-brand-dark"
        dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
      />

      <div className="mx-auto mt-16 max-w-3xl border-t border-gray-100 px-6 pt-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-red/30"
        >
          <ArrowLeft aria-hidden />
          More articles
        </Link>
      </div>
    </article>
  );
}
