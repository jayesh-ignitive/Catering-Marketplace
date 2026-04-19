"use client";

import { ArrowRight, CaretDown, Faders, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { caterersListingPath } from "@/lib/caterers-url";
import {
  fetchMarketplaceCaterers,
  fetchMarketplaceCities,
  fetchMarketplaceKeywordSuggestions,
  fetchServiceCategories,
  formatMarketplacePriceFromInr,
  type MarketplaceKeywordRef,
  type MarketplaceListItem,
} from "@/lib/catering-api";
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaStar } from "react-icons/fa";

const nf = new Intl.NumberFormat("en-IN");

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1555244166-441584bb364f?auto=format&fit=crop&w=2000&q=85";

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
  const locationLine = [row.city, row.state, row.country].filter(Boolean).join(", ") || "Location on request";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100/80 bg-white shadow-[0_2px_8px_-2px_rgba(28,28,28,0.06),0_12px_40px_-12px_rgba(28,28,28,0.08)] transition duration-500 hover:-translate-y-1.5 hover:border-brand-red/20 hover:shadow-[0_20px_50px_-15px_rgba(229,57,53,0.15)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-red/[0.04] blur-2xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
      <Link href={`/caterers/${encodeURIComponent(row.profileSlug)}`} className="relative z-10 flex flex-1 flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-gray-100 via-stone-100 to-gray-200">
          {row.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.heroImageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-dark/5 to-brand-red/10">
              <span className="font-logo text-5xl text-brand-red/35">{row.businessName.slice(0, 1)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-90" />
          {row.primaryCategoryName ? (
            <span className="absolute left-3 top-3 max-w-[85%] truncate rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-dark shadow-sm backdrop-blur-sm">
              {row.primaryCategoryName}
            </span>
          ) : null}
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-white shadow-lg backdrop-blur-md">
            <FaStar className="text-brand-yellow" size={12} aria-hidden />
            <span className="text-xs font-bold tabular-nums">{safeRating.toFixed(1)}</span>
            <span className="text-[11px] font-medium text-white/85">
              ({nf.format(Number(row.reviewCount ?? 0))})
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <h2 className="font-heading text-lg font-extrabold leading-snug tracking-tight text-brand-dark transition-colors duration-300 group-hover:text-brand-red sm:text-xl">
            {row.businessName}
          </h2>
          {row.tagline ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">{row.tagline}</p>
          ) : null}

          <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-red/8 text-brand-red">
              <FaMapMarkerAlt size={12} aria-hidden />
            </span>
            <span className="min-w-0 leading-snug">{locationLine}</span>
          </div>

          {priceLine ? (
            <p className="mt-4 border-t border-gray-50 pt-4 text-sm font-semibold text-brand-dark">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">From </span>
              {priceLine}
            </p>
          ) : (
            <div className="mt-4 border-t border-gray-50 pt-4" />
          )}

          {cuisines.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {cuisines.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-100/80"
                >
                  {c}
                </span>
              ))}
              {cuisines.length > 3 ? (
                <span className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-400">
                  +{cuisines.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}

          {keywordTags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {keywordTags.slice(0, 4).map((k) => (
                <span
                  key={k.slug}
                  className="rounded-md border border-brand-red/15 bg-brand-red/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-red"
                >
                  {k.label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-5">
            <span className="text-sm font-bold text-brand-red transition group-hover:gap-2">
              View profile
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red text-white shadow-md shadow-brand-red/25 transition duration-300 group-hover:translate-x-0.5 group-hover:bg-red-700">
              <ArrowRight className="text-lg" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function ListingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
          aria-hidden
        >
          <div className="aspect-[16/10] animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
          <div className="space-y-3 p-6">
            <div className="h-5 w-3/4 animate-pulse rounded-md bg-gray-100" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-16 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-6 w-16 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export type CaterersListingPageContentProps = {
  presetCityName?: string | null;
  presetCategoryId?: string | null;
};

export function CaterersListingPageContent({
  presetCityName = null,
  presetCategoryId = null,
}: CaterersListingPageContentProps) {
  const router = useRouter();

  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState(presetCityName ?? "");
  const [categoryId, setCategoryId] = useState(presetCategoryId ?? "");
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

  const navigateCityCategory = useCallback(
    (nextCity: string, nextCategoryId: string) => {
      const cats = categoriesQ.data ?? [];
      const cat = nextCategoryId ? cats.find((c) => c.id === nextCategoryId) : undefined;
      router.push(
        caterersListingPath({
          cityName: nextCity || null,
          categorySlug: cat?.slug ?? null,
        })
      );
    },
    [categoriesQ.data, router]
  );

  useEffect(() => {
    const t = qDraft.trim();
    if (t.length < 1) {
      queueMicrotask(() => {
        setSuggestions([]);
        setSuggestLoading(false);
      });
      return;
    }
    queueMicrotask(() => setSuggestLoading(true));
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

  const onSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setKeywordSlug("");
      setQ(qDraft.trim());
      setSuggestOpen(false);
      setPage(1);
    },
    [qDraft]
  );

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

  const clearAllFilters = useCallback(() => {
    setQDraft("");
    setQ("");
    setCity("");
    setCategoryId("");
    setPriceBand("");
    setKeywordSlug("");
    setPage(1);
    router.push("/caterers");
  }, [router]);

  const hasActiveFilters = Boolean(
    presetCityName ||
      presetCategoryId ||
      q.trim() ||
      priceBand ||
      keywordSlug ||
      qDraft.trim()
  );

  const totalPages = listQ.data ? Math.max(1, Math.ceil(listQ.data.total / listQ.data.limit)) : 1;
  const cityRows = useMemo(() => {
    const raw = citiesQ.data ?? [];
    if (presetCityName && !raw.some((r) => r.city === presetCityName)) {
      return [{ city: presetCityName }, ...raw];
    }
    return raw;
  }, [citiesQ.data, presetCityName]);

  const filterInput =
    "w-full appearance-none rounded-xl border border-gray-200/90 bg-white py-3 pl-4 pr-10 text-sm font-medium text-brand-dark shadow-sm outline-none transition hover:border-gray-300 focus:border-brand-red focus:ring-4 focus:ring-brand-red/12";

  const selectWrap = "relative";

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      {/* Hero */}
      <section className="relative min-h-[320px] overflow-hidden sm:min-h-[360px]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/[0.97] via-brand-dark/85 to-brand-dark/55" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-brand-red/10" aria-hidden />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:18px_18px]" aria-hidden />

        <div className="relative mx-auto flex min-h-[320px] max-w-7xl flex-col justify-center px-6 py-14 sm:min-h-[360px] sm:py-16">
          <nav className="text-sm font-medium text-white/55">
            <Link href="/" className="transition hover:text-brand-yellow">
              Home
            </Link>
            <span className="mx-2 text-white/25">/</span>
            <span className="text-white/95">Caterers</span>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-white/90 backdrop-blur-md">
              <Sparkle className="text-brand-yellow" weight="fill" aria-hidden />
              Marketplace
            </span>
            <span className="hidden text-xs font-medium text-white/50 sm:inline">Curated catering partners</span>
          </div>

          <h1 className="font-heading mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Discover{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-brand-yellow">exceptional</span>
              <span
                className="absolute -bottom-0.5 left-0 h-2.5 w-full -skew-y-1 bg-brand-red/90"
                aria-hidden
              />
            </span>{" "}
            caterers
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/78 sm:text-lg">
            Search by name or tags, narrow by city and occasion, then open a profile to compare menus and
            request a tailored quote — all in one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-6 border-t border-white/10 pt-8 text-sm text-white/70">
            <div>
              <p className="text-2xl font-bold tabular-nums text-white sm:text-3xl">1k+</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Listed profiles</p>
            </div>
            <div className="h-10 w-px self-center bg-white/15" aria-hidden />
            <div>
              <p className="text-2xl font-bold tabular-nums text-white sm:text-3xl">120+</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Cities</p>
            </div>
            <div className="h-10 w-px self-center bg-white/15" aria-hidden />
            <div>
              <p className="text-2xl font-bold tabular-nums text-white sm:text-3xl">4.8</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Avg. satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters — overlaps hero slightly */}
      <div className="relative z-20 mx-auto -mt-10 max-w-7xl px-6 pb-4">
        <form
          onSubmit={onSearch}
          className="rounded-3xl border border-white/60 bg-white p-6 shadow-[0_25px_80px_-20px_rgba(28,28,28,0.2),0_0_0_1px_rgba(28,28,28,0.04)] sm:p-8"
        >
          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
                <Faders className="text-xl" weight="duotone" aria-hidden />
              </span>
              <div>
                <h2 className="font-heading text-lg font-extrabold text-brand-dark">Refine results</h2>
                <p className="text-sm text-gray-500">Filters apply instantly to the directory below.</p>
              </div>
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="self-start rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 transition hover:border-brand-red/30 hover:bg-white hover:text-brand-red sm:self-center"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="grid gap-5 lg:grid-cols-12 lg:items-end">
            <label className="lg:col-span-4">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
                Search
              </span>
              <div ref={searchBoxRef} className="relative">
                <MagnifyingGlass
                  className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-gray-400"
                  size={20}
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
                  placeholder="Business name, cuisine, or keyword…"
                  role="combobox"
                  aria-expanded={suggestOpen}
                  aria-controls="caterer-keyword-suggest"
                  aria-autocomplete="list"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 pl-12 pr-4 text-sm font-medium text-brand-dark outline-none transition placeholder:text-gray-400 focus:border-brand-red focus:bg-white focus:ring-4 focus:ring-brand-red/10"
                />
                {suggestOpen && qDraft.trim().length > 0 ? (
                  <ul
                    id="caterer-keyword-suggest"
                    role="listbox"
                    className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-gray-100 bg-white py-2 text-sm shadow-2xl ring-1 ring-black/5"
                  >
                    {suggestLoading && suggestions.length === 0 ? (
                      <li className="px-4 py-3 text-gray-500">Searching tags…</li>
                    ) : null}
                    {!suggestLoading && suggestions.length === 0 ? (
                      <li className="px-4 py-2 text-xs text-gray-500">No matching tags.</li>
                    ) : null}
                    {suggestions.map((k) => (
                      <li key={k.slug}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={keywordSlug === k.slug}
                          className="flex w-full items-center px-4 py-3 text-left font-medium text-brand-dark transition hover:bg-brand-red/5"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickKeyword(k.slug, k.label)}
                        >
                          <span className="rounded-lg bg-brand-red/10 px-2.5 py-0.5 text-[11px] font-bold uppercase text-brand-red">
                            Tag
                          </span>
                          <span className="ml-3">{k.label}</span>
                        </button>
                      </li>
                    ))}
                    {qDraft.trim().length > 0 ? (
                      <li className="border-t border-gray-100">
                        <button
                          type="button"
                          className="w-full px-4 py-3 text-left text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyTextSearchOnly()}
                        >
                          Search all fields for &ldquo;{qDraft.trim()}&rdquo;
                        </button>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            </label>

            <label className="lg:col-span-2">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
                City
              </span>
              <div className={selectWrap}>
                <select
                  value={city}
                  onChange={(e) => {
                    const nextCity = e.target.value;
                    setPage(1);
                    navigateCityCategory(nextCity, categoryId);
                  }}
                  className={filterInput}
                >
                  <option value="">All cities</option>
                  {cityRows.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
                <CaretDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                  aria-hidden
                />
              </div>
            </label>

            <label className="lg:col-span-3">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
                Service type
              </span>
              <div className={selectWrap}>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    const nextCat = e.target.value;
                    setPage(1);
                    navigateCityCategory(city, nextCat);
                  }}
                  className={filterInput}
                >
                  <option value="">All categories</option>
                  {(categoriesQ.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <CaretDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                  aria-hidden
                />
              </div>
            </label>

            <label className="lg:col-span-2">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
                Budget
              </span>
              <div className={selectWrap}>
                <select
                  value={priceBand}
                  onChange={(e) => {
                    setPriceBand(e.target.value);
                    setPage(1);
                  }}
                  className={filterInput}
                >
                  {PRICE_OPTIONS.map((o) => (
                    <option key={o.value || "any"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <CaretDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                  aria-hidden
                />
              </div>
            </label>

            <div className="flex lg:col-span-1 lg:justify-end">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/30 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl lg:w-auto lg:min-w-[120px]"
              >
                <MagnifyingGlass className="text-lg" aria-hidden />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-6 sm:pt-8">
        {listQ.isPending ? (
          <ListingSkeleton />
        ) : listQ.isError ? (
          <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-white px-8 py-14 text-center shadow-sm">
            <p className="font-heading text-lg font-bold text-red-900">Unable to load directory</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-red-800/80">
              Start the API on port 4000 and ensure the database is migrated. Then refresh this page.
            </p>
          </div>
        ) : listQ.data && listQ.data.items.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-8 py-20 text-center shadow-[0_20px_60px_-25px_rgba(28,28,28,0.12)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
              <MagnifyingGlass className="text-3xl" weight="duotone" aria-hidden />
            </div>
            <p className="font-heading mt-6 text-xl font-bold text-brand-dark">No records available</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Nothing matched these filters yet. Try widening your search, or list your catering business to
              appear here after verification.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={clearAllFilters}
                className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-brand-dark shadow-sm transition hover:border-brand-red/30"
              >
                Reset filters
              </button>
              <Link
                href="/register"
                className="rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-red/25 transition hover:bg-red-700"
              >
                List your business
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-10 flex flex-col gap-4 border-b border-gray-200/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-red">Directory</p>
                <p className="font-heading mt-1 text-2xl font-extrabold text-brand-dark">
                  {listQ.data?.total ?? 0}{" "}
                  <span className="text-lg font-bold text-gray-400">
                    caterer{(listQ.data?.total ?? 0) === 1 ? "" : "s"} found
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1}–
                  {Math.min(page * limit, listQ.data?.total ?? 0)} of {listQ.data?.total ?? 0}
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {listQ.data?.items.map((row) => <CatererResultCard key={row.tenantId} row={row} />)}
            </div>

            {totalPages > 1 ? (
              <nav
                className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
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
                  <span className="min-w-[8rem] border-x border-gray-100 px-4 py-2 text-center text-sm font-semibold tabular-nums text-gray-600">
                    Page {page} of {totalPages}
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
