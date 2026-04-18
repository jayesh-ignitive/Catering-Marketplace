"use client";

import { CalendarBlank, Newspaper } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { fetchBlogPosts, type BlogPostSummary } from "@/lib/catering-api";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

function formatPublished(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function BlogCard({ post }: { post: BlogPostSummary }) {
  const img = post.featuredImageUrl ?? FALLBACK_IMG;
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-red/25 hover:shadow-xl">
      <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
          <Image
            src={img}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:768px)100vw,33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-90" aria-hidden />
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-red shadow-sm backdrop-blur-sm">
            {post.categoryLabel}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-400">
            <CalendarBlank className="text-brand-red" aria-hidden />
            <time dateTime={post.publishedAt}>{formatPublished(post.publishedAt)}</time>
          </div>
          <h2 className="font-heading text-xl font-extrabold leading-snug text-brand-dark transition group-hover:text-brand-red">
            {post.title}
          </h2>
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
          <span className="mt-6 text-sm font-bold text-brand-red group-hover:underline">Read article →</span>
        </div>
      </Link>
    </article>
  );
}

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const limit = 9;

  const blogQ = useQuery({
    queryKey: ["catalog", "blog", page, limit],
    queryFn: () => fetchBlogPosts({ page, limit }),
  });

  const totalPages = useMemo(
    () =>
      blogQ.data ? Math.max(1, Math.ceil(blogQ.data.total / blogQ.data.limit)) : 1,
    [blogQ.data],
  );

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <section className="relative overflow-hidden bg-brand-dark px-6 py-14 sm:py-16">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:18px_18px]" aria-hidden />
        <div className="relative mx-auto max-w-7xl">
          <nav className="text-sm font-medium text-white/55">
            <Link href="/" className="transition hover:text-brand-yellow">
              Home
            </Link>
            <span className="mx-2 text-white/25">/</span>
            <span className="text-white">Insights</span>
          </nav>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white backdrop-blur-md">
            <Newspaper className="text-brand-yellow" weight="fill" aria-hidden />
            Bharat Catering Blog
          </div>
          <h1 className="font-heading mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Guides, trends &amp; <span className="text-brand-yellow">menu ideas</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Practical reads for hosts and planners—shortlist smarter, negotiate menus with confidence, and brief
            your caterer like a pro.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
        {blogQ.isPending ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="aspect-[16/10] animate-pulse bg-gray-200" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="h-6 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-14 w-full animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : blogQ.isError ? (
          <div className="rounded-3xl border border-red-100 bg-white px-8 py-14 text-center shadow-sm">
            <p className="font-heading text-lg font-bold text-brand-dark">Could not load articles</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Ensure the Nest API is running on port 4000 and database migrations are applied ({`npm run migration:run`}{" "}
              in catering-backend).
            </p>
            <button
              type="button"
              className="mt-6 rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-red-700"
              onClick={() => blogQ.refetch()}
            >
              Retry
            </button>
          </div>
        ) : blogQ.data && blogQ.data.items.length === 0 ? (
          <p className="rounded-3xl border border-gray-100 bg-white py-16 text-center text-gray-600 shadow-sm">
            No articles published yet.
          </p>
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {blogQ.data?.items.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav
                className="mt-14 flex justify-center"
                aria-label="Pagination"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-brand-dark transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <FaChevronLeft size={11} aria-hidden />
                    Prev
                  </button>
                  <span className="min-w-[9rem] border-x border-gray-100 px-4 py-2 text-center text-sm font-semibold tabular-nums text-gray-600">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-brand-dark transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Next
                    <FaChevronRight size={11} aria-hidden />
                  </button>
                </div>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
