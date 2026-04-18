"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchMarketplaceCaterers,
  fetchMarketplaceCities,
  fetchMarketplaceKeywordSuggestions,
  fetchServiceCategories,
  formatMarketplacePriceFromInr,
  type MarketplaceKeywordRef,
  type MarketplaceListItem,
} from "@/lib/catering-api";
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaSearch, FaStar } from "react-icons/fa";

const nf = new Intl.NumberFormat("en-IN");

const PRICE_OPTIONS = [
  { value: "", label: "Any budget" },
  { value: "budget", label: "Budget-friendly" },
  { value: "mid", label: "Mid-range" },
  { value: "premium", label: "Premium" },
  { value: "custom", label: "Custom quote" },
];

function CatererResultCard({ row }: { row: MarketplaceListItem }) {
  const priceLine = formatMarketplacePriceFromInr(row.priceFrom);
  const cuisines = row.cuisines ?? [];
  const keywordTags = row.keywords ?? [];
  const rating = Number(row.avgRating ?? 0);
  const safeRating = Number.isFinite(rating) ? rating : 0;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white card-shadow transition duration-300 hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/10">
      <Link href={`/caterers/${encodeURIComponent(row.profileSlug)}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-stone-100 via-[var(--primary-soft)] to-stone-200">
          {row.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.heroImageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl font-extrabold text-[var(--primary)]/25">
              {row.businessName.slice(0, 1)}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-10">
            <div className="flex items-center gap-2 text-white/95">
              <FaStar className="text-amber-300" size={14} aria-hidden />
              <span className="text-sm font-bold tabular-nums">{safeRating.toFixed(1)}</span>
              <span className="text-xs opacity-90">
                ({nf.format(Number(row.reviewCount ?? 0))} reviews)
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h2 className="text-lg font-extrabold leading-snug text-stone-900 group-hover:text-[var(--primary)]">
            {row.businessName}
          </h2>
          {row.tagline ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
              {row.tagline}
            </p>
          ) : null}
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-stone-600">
            <FaMapMarkerAlt className="shrink-0 text-[var(--primary)]" size={12} aria-hidden />
            {[row.city, row.state, row.country].filter(Boolean).join(", ") || "Location on request"}
          </p>
          {row.primaryCategoryName ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
              {row.primaryCategoryName}
            </p>
          ) : null}
          {priceLine ? <p className="mt-2 text-sm font-semibold text-stone-800">{priceLine}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {cuisines.slice(0, 4).map((c) => (
              <span
                key={c}
                className="rounded-lg bg-[var(--light-gray)] px-2.5 py-1 text-xs font-semibold text-stone-700 ring-1 ring-stone-200/60"
              >
                {c}
              </span>
            ))}
          </div>
          {keywordTags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {keywordTags.slice(0, 5).map((k) => (
                <span
                  key={k.slug}
                  className="rounded-md border border-[var(--primary)]/25 bg-[var(--primary-soft)]/50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--primary)]"
                >
                  {k.label}
                </span>
              ))}
            </div>
          ) : null}
          <span className="mt-5 text-sm font-bold text-[var(--primary)] group-hover:underline">
            View profile →
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function CaterersListingPage() {
  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [keywordSlug, setKeywordSlug] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<MarketplaceKeywordRef[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const limit = 12;

  const citiesQ = useQuery({ queryKey: ["marketplace", "cities"], queryFn: fetchMarketplaceCities });
  const categoriesQ = useQuery({
    queryKey: ["catalog", "service-categories"],
    queryFn: fetchServiceCategories,
  });

  useEffect(() => {
    const t = qDraft.trim();
    if (t.length < 1) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }
    setSuggestLoading(true);
    const id = setTimeout(() => {
      void fetchMarketplaceKeywordSuggestions(t)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setSuggestLoading(false));
    }, 220);
    return () => clearTimeout(id);
  }, [qDraft]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      const el = searchBoxRef.current;
      if (el && !el.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const listParams = useMemo(
    () => ({
      q: keywordSlug ? undefined : q.trim() || undefined,
      city: city || undefined,
      categoryId: categoryId || undefined,
      priceBand: priceBand || undefined,
      keyword: keywordSlug || undefined,
      page,
      limit,
    }),
    [q, city, categoryId, priceBand, keywordSlug, page, limit]
  );

  const listQ = useQuery({
    queryKey: ["marketplace", "caterers", listParams],
    queryFn: () => fetchMarketplaceCaterers(listParams),
  });

  const onSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setKeywordSlug("");
    setQ(qDraft.trim());
    setSuggestOpen(false);
    setPage(1);
  }, [qDraft]);

  const pickKeyword = useCallback((slug: string, label: string) => {
    setKeywordSlug(slug);
    setQ("");
    setQDraft(label);
    setSuggestOpen(false);
    setPage(1);
  }, []);

  const applyTextSearchOnly = useCallback(() => {
    setKeywordSlug("");
    setQ(qDraft.trim());
    setSuggestOpen(false);
    setPage(1);
  }, [qDraft]);

  const totalPages = listQ.data ? Math.max(1, Math.ceil(listQ.data.total / listQ.data.limit)) : 1;
  const cities = citiesQ.data ?? [];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <section className="border-b border-stone-200/80 bg-white">
        <div className="container-max py-10 sm:py-12">
          <nav className="text-sm font-medium text-stone-500">
            <Link href="/" className="hover:text-[var(--primary)]">
              Home
            </Link>
            <span className="mx-2 text-stone-300">/</span>
            <span className="text-stone-800">Caterers</span>
          </nav>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Find the right <span className="text-gradient-brand">catering partner</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[var(--foreground-muted)]">
            Browse published caterer profiles — search with autocomplete tags, or filter by city, service type,
            and budget. Open a profile to read more and request a quote.
          </p>

          <form
            onSubmit={onSearch}
            className="mt-8 rounded-2xl border border-stone-200/90 bg-[var(--surface)] p-5 card-shadow sm:p-6"
          >
            <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
              <label className="lg:col-span-4">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Search
                </span>
                <div ref={searchBoxRef} className="relative">
                  <FaSearch
                    className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-stone-400"
                    size={14}
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={qDraft}
                    onChange={(e) => {
                      setQDraft(e.target.value);
                      setKeywordSlug("");
                    }}
                    onFocus={() => setSuggestOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSuggestOpen(false);
                      }
                    }}
                    autoComplete="off"
                    placeholder="Name, tag, or keyword…"
                    role="combobox"
                    aria-expanded={suggestOpen}
                    aria-controls="caterer-keyword-suggest"
                    aria-autocomplete="list"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/80 py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-[var(--primary)]/40 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/12"
                  />
                  {suggestOpen && qDraft.trim().length > 0 ? (
                    <ul
                      id="caterer-keyword-suggest"
                      role="listbox"
                      className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
                    >
                      {suggestLoading && suggestions.length === 0 ? (
                        <li className="px-4 py-3 text-[var(--foreground-muted)]">Searching tags…</li>
                      ) : null}
                      {!suggestLoading && suggestions.length === 0 ? (
                        <li className="px-4 py-2 text-xs text-[var(--foreground-muted)]">No matching tags.</li>
                      ) : null}
                      {suggestions.map((k) => (
                        <li key={k.slug} role="option">
                          <button
                            type="button"
                            className="flex w-full items-center px-4 py-2.5 text-left font-medium text-stone-800 hover:bg-[var(--primary-soft)]/50"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickKeyword(k.slug, k.label)}
                          >
                            <span className="rounded-md bg-[var(--primary-soft)]/60 px-2 py-0.5 text-xs font-bold text-[var(--primary)]">
                              Tag
                            </span>
                            <span className="ml-2">{k.label}</span>
                          </button>
                        </li>
                      ))}
                      {qDraft.trim().length > 0 ? (
                        <li className="border-t border-stone-100">
                          <button
                            type="button"
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-stone-600 hover:bg-stone-50"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyTextSearchOnly()}
                          >
                            Search name &amp; description for &ldquo;{qDraft.trim()}&rdquo;
                          </button>
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </div>
              </label>
              <label className="lg:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  City
                </span>
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--primary)]/40 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/12"
                >
                  <option value="">All cities</option>
                  {cities.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="lg:col-span-3">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Service type
                </span>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--primary)]/40 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/12"
                >
                  <option value="">All categories</option>
                  {(categoriesQ.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="lg:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Budget
                </span>
                <select
                  value={priceBand}
                  onChange={(e) => {
                    setPriceBand(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--primary)]/40 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/12"
                >
                  {PRICE_OPTIONS.map((o) => (
                    <option key={o.value || "any"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex lg:col-span-1 lg:justify-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/25 transition hover:opacity-[0.96] lg:w-auto"
                >
                  Apply
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="container-max py-12 sm:py-14">
        {listQ.isPending ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[340px] animate-pulse rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200/70"
                aria-hidden
              />
            ))}
          </div>
        ) : listQ.isError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm font-medium text-red-900">
            Could not load caterers. Start the API on port 4000 and run database migrations.
          </p>
        ) : listQ.data && listQ.data.items.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-8 py-16 text-center card-shadow">
            <p className="text-lg font-bold text-stone-800">No caterers match your filters</p>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Try clearing city or category, or register a caterer account so new listings appear after
              publishing.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-block rounded-xl bg-[var(--primary-soft)] px-6 py-3 text-sm font-bold text-[var(--primary)]"
            >
              List your business
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-sm font-medium text-[var(--foreground-muted)]">
                Showing{" "}
                <span className="font-bold text-stone-900">{listQ.data?.items.length ?? 0}</span> of{" "}
                <span className="font-bold text-stone-900">{listQ.data?.total ?? 0}</span> caterers
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {listQ.data?.items.map((row) => <CatererResultCard key={row.tenantId} row={row} />)}
            </div>
            {totalPages > 1 ? (
              <div className="mt-12 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 shadow-sm transition hover:border-[var(--primary)]/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaChevronLeft size={12} aria-hidden />
                  Previous
                </button>
                <span className="text-sm font-semibold text-stone-600">
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 shadow-sm transition hover:border-[var(--primary)]/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <FaChevronRight size={12} aria-hidden />
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
