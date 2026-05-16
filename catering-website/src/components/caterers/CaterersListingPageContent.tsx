"use client";

import {
  CaretLeft,
  CaretRight,
  Funnel,
  MapPin,
  Rows,
  SquaresFour,
  X,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingPriceRangeSlider } from "@/components/caterers/ListingPriceRangeSlider";
import { CatererListingCard } from "@/components/caterers/CatererListingCard";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { caterersListingPath } from "@/lib/caterers-url";
import {
  filterByAreaQuery,
  filterByMinRating,
  isListingPriceRangeDefault,
  LISTING_PRICE_MAX,
  LISTING_PRICE_MIN,
  persistListingViewMode,
  readListingViewMode,
  sortMarketplaceItems,
  type ListingSortOption,
  type ListingViewMode,
} from "@/lib/caterer-listing-utils";
import {
  fetchMarketplaceCaterers,
  fetchMarketplaceCities,
  fetchServiceCategories,
} from "@/lib/catering-api";

const nf = new Intl.NumberFormat("en-IN");
const LISTING_FILTER_DEBOUNCE_MS = 350;

const SORT_OPTIONS: { value: ListingSortOption; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Rating (High to Low)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
];

function ListingSkeleton({ viewMode }: { viewMode: ListingViewMode }) {
  const isGrid = viewMode === "grid";
  return (
    <div
      className={
        isGrid
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5"
          : "space-y-4 sm:space-y-6"
      }
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={[
            "overflow-hidden rounded-2xl border border-gray-100 bg-white",
            isGrid ? "h-72" : "flex flex-row items-start",
          ].join(" ")}
          aria-hidden
        >
          <div
            className={[
              "shrink-0 animate-pulse bg-gray-100",
              isGrid ? "h-[150px] w-full" : "h-24 w-24 sm:h-36 sm:w-36 md:h-56 md:w-64",
            ].join(" ")}
          />
          <div className="flex-1 space-y-2 p-2.5 sm:space-y-3 sm:p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
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

  const [viewMode, setViewMode] = useState<ListingViewMode>("list");
  const [sort, setSort] = useState<ListingSortOption>("popularity");
  const [page, setPage] = useState(1);
  const limit = 12;
  const listingTopRef = useRef<HTMLDivElement>(null);
  const skipScrollOnPageMount = useRef(true);

  const [city, setCity] = useState(presetCityName ?? "");
  const [categoryId, setCategoryId] = useState(presetCategoryId ?? "");
  const [priceMin, setPriceMin] = useState(LISTING_PRICE_MIN);
  const [priceMax, setPriceMax] = useState(LISTING_PRICE_MAX);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [areaFilter, setAreaFilter] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debouncedPriceMin = useDebouncedValue(priceMin, LISTING_FILTER_DEBOUNCE_MS);
  const debouncedPriceMax = useDebouncedValue(priceMax, LISTING_FILTER_DEBOUNCE_MS);

  useEffect(() => {
    setViewMode(readListingViewMode());
  }, []);

  useEffect(() => {
    if (skipScrollOnPageMount.current) {
      skipScrollOnPageMount.current = false;
      return;
    }
    listingTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  useEffect(() => {
    setCity(presetCityName ?? "");
  }, [presetCityName]);

  useEffect(() => {
    setCategoryId(presetCategoryId ?? "");
  }, [presetCategoryId]);

  const citiesQ = useQuery({ queryKey: ["marketplace", "cities"], queryFn: fetchMarketplaceCities });
  const categoriesQ = useQuery({
    queryKey: ["catalog", "service-categories"],
    queryFn: fetchServiceCategories,
  });

  const listParams = useMemo(() => {
    const priceFiltered = !isListingPriceRangeDefault(debouncedPriceMin, debouncedPriceMax);
    return {
      city: city || undefined,
      categoryId: categoryId || undefined,
      priceMin: priceFiltered ? debouncedPriceMin : undefined,
      priceMax: priceFiltered ? debouncedPriceMax : undefined,
      page,
      limit,
    };
  }, [city, categoryId, debouncedPriceMin, debouncedPriceMax, page, limit]);

  const listQ = useQuery({
    queryKey: ["marketplace", "caterers", listParams],
    queryFn: () => fetchMarketplaceCaterers(listParams),
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

  const resetPage = useCallback(() => setPage(1), []);

  const onAreaFilterChange = useCallback(
    (value: string) => {
      setAreaFilter(value);
      resetPage();
    },
    [resetPage],
  );

  const onCityChange = useCallback(
    (nextCity: string) => {
      resetPage();
      navigateCityCategory(nextCity, categoryId);
    },
    [categoryId, navigateCityCategory, resetPage],
  );

  const onCategoryChange = useCallback(
    (catId: string) => {
      const next = categoryId === catId ? "" : catId;
      resetPage();
      navigateCityCategory(city, next);
    },
    [categoryId, city, navigateCityCategory, resetPage],
  );

  const onPriceRangeChange = useCallback(
    (min: number, max: number) => {
      setPriceMin(min);
      setPriceMax(max);
      resetPage();
    },
    [resetPage],
  );

  const onMinRatingChange = useCallback(
    (value: number | null) => {
      setMinRating((prev) => (prev === value ? null : value));
      resetPage();
    },
    [resetPage],
  );

  const resetAllFilters = useCallback(() => {
    setAreaFilter("");
    setMinRating(null);
    setPriceMin(LISTING_PRICE_MIN);
    setPriceMax(LISTING_PRICE_MAX);
    setPage(1);
    router.push("/caterers");
  }, [router]);

  const setView = useCallback((mode: ListingViewMode) => {
    setViewMode(mode);
    persistListingViewMode(mode);
  }, []);

  const displayedItems = useMemo(() => {
    const raw = listQ.data?.items ?? [];
    let items = filterByAreaQuery(raw, areaFilter);
    items = filterByMinRating(items, minRating);
    return sortMarketplaceItems(items, sort);
  }, [listQ.data?.items, areaFilter, minRating, sort]);

  const totalPages = listQ.data ? Math.max(1, Math.ceil(listQ.data.total / listQ.data.limit)) : 1;

  const cityRows = useMemo(() => {
    const raw = citiesQ.data ?? [];
    if (presetCityName && !raw.some((r) => r.city === presetCityName)) {
      return [{ city: presetCityName }, ...raw];
    }
    return raw;
  }, [citiesQ.data, presetCityName]);

  const citySelectOptions = useMemo(
    () => [
      { value: "", label: "All cities" },
      ...cityRows.map((c) => ({ value: c.city, label: c.city })),
    ],
    [cityRows],
  );

  const sortSelectOptions = useMemo(
    () => SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );

  const activeCategory = (categoriesQ.data ?? []).find((c) => c.id === categoryId);
  const pageTitle = city
    ? `Top Rated Caterers in ${city}`
    : activeCategory
      ? `${activeCategory.name} Caterers`
      : "Find Best Caterers";
  const breadcrumbTail = city
    ? `Caterers in ${city}`
    : activeCategory
      ? activeCategory.name
      : "All caterers";

  const isGrid = viewMode === "grid";

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (city) n += 1;
    if (categoryId) n += 1;
    if (areaFilter.trim()) n += 1;
    if (minRating != null) n += 1;
    if (!isListingPriceRangeDefault(priceMin, priceMax)) n += 1;
    return n;
  }, [areaFilter, categoryId, city, minRating, priceMax, priceMin]);

  const filtersPanel = (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:sticky lg:top-24">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <h3 className="font-heading font-bold text-brand-dark">Filters</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetAllFilters}
            className="cursor-pointer text-xs font-bold text-brand-red hover:underline"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Close filters"
          >
            <X className="text-lg" aria-hidden />
          </button>
        </div>
      </div>

      <div className="max-h-[min(70vh,520px)] space-y-6 overflow-y-auto p-4 sm:max-h-none sm:space-y-8 sm:p-5">
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-dark">Location</h4>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="text"
              value={areaFilter}
              onChange={(e) => onAreaFilterChange(e.target.value)}
              placeholder="Search area…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm transition focus:border-brand-red focus:outline-none"
            />
          </div>
          <div className="mt-3">
            <SearchableSelect
              instanceId="listing-city"
              ariaLabel="City"
              placeholder="All cities"
              options={citySelectOptions}
              value={city}
              onChange={onCityChange}
            />
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-dark">Service Category</h4>
          <div className="max-h-48 space-y-2 overflow-y-auto sm:max-h-none">
            {(categoriesQ.data ?? []).map((cat) => (
              <label key={cat.id} className="group flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={categoryId === cat.id}
                  onChange={() => onCategoryChange(cat.id)}
                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="text-sm text-gray-600 transition-colors group-hover:text-brand-dark">
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-dark">Price (Per Plate)</h4>
          <ListingPriceRangeSlider min={priceMin} max={priceMax} onChange={onPriceRangeChange} />
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-dark">Customer Rating</h4>
          <div className="space-y-2">
            {[
              { value: 4.5, label: "4.5 & Up" },
              { value: 4.0, label: "4.0 & Up" },
            ].map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="listing-rating"
                  checked={minRating === opt.value}
                  onChange={() => onMinRatingChange(opt.value)}
                  className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  {opt.label}
                  <span className="text-brand-yellow" aria-hidden>
                    ★
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50">
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div ref={listingTopRef} className="mb-6 scroll-mt-28 sm:mb-8">
        <nav className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-gray-500">
          <Link href="/" className="transition hover:text-brand-red">
            Home
          </Link>
          <CaretRight className="text-gray-300" aria-hidden />
          <span className="break-words">{breadcrumbTail}</span>
        </nav>
        <h1 className="font-heading text-2xl font-bold leading-tight text-brand-dark sm:text-3xl">{pageTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          {listQ.isPending
            ? "Loading caterers…"
            : `Showing ${nf.format(listQ.data?.total ?? displayedItems.length)} caterer${
                (listQ.data?.total ?? 0) === 1 ? "" : "s"
              } found for your search`}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-full shrink-0 lg:block lg:w-72">{filtersPanel}</aside>

        {mobileFiltersOpen ? (
          <div
            className="fixed inset-0 z-50 flex cursor-pointer flex-col justify-end bg-black/40 p-0 sm:justify-center sm:p-4 lg:hidden"
            role="presentation"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <div
              className="max-h-[92vh] w-full cursor-default overflow-hidden rounded-t-2xl sm:mx-auto sm:max-w-md sm:rounded-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              onClick={(e) => e.stopPropagation()}
            >
              {filtersPanel}
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-bold text-brand-dark transition hover:border-brand-red/30 lg:hidden"
            >
              <Funnel className="text-brand-red" weight="fill" aria-hidden />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <div className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:gap-4 md:w-auto md:flex-none">
              <span className="shrink-0 text-sm text-gray-500">Sort by</span>
              <SearchableSelect
                instanceId="listing-sort"
                ariaLabel="Sort caterers"
                options={sortSelectOptions}
                value={sort}
                onChange={(v) => setSort(v as ListingSortOption)}
                isSearchable={false}
                className="w-full min-w-0 sm:min-w-[200px] md:min-w-[220px]"
              />
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={!isGrid}
                aria-label="List view"
                className={[
                  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all",
                  !isGrid ? "bg-brand-red text-white" : "bg-gray-50 text-gray-400 hover:text-brand-red",
                ].join(" ")}
              >
                <Rows weight="fill" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={isGrid}
                aria-label="Grid view"
                className={[
                  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all",
                  isGrid ? "bg-brand-red text-white" : "bg-gray-50 text-gray-400 hover:text-brand-red",
                ].join(" ")}
              >
                <SquaresFour weight="fill" aria-hidden />
              </button>
            </div>
          </div>

          {listQ.isPending ? (
            <ListingSkeleton viewMode={viewMode} />
          ) : listQ.isError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-10 text-center sm:px-8 sm:py-14">
              <p className="font-heading text-lg font-bold text-red-900">Unable to load directory</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-red-800/80">
                Start the API on port 4000 and ensure the database is migrated, then refresh.
              </p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center shadow-sm sm:px-8 sm:py-16">
              <p className="font-heading text-xl font-bold text-brand-dark">No caterers match your filters</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Try widening your search or reset filters to see more listings.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-6 cursor-pointer rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white hover:bg-red-700"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              <div
                className={
                  isGrid
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5"
                    : "space-y-4 sm:space-y-6"
                }
              >
                {displayedItems.map((row) => (
                  <CatererListingCard key={row.tenantId} row={row} viewMode={viewMode} />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav className="flex justify-center pt-6 sm:pt-8" aria-label="Pagination">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:bg-brand-red hover:text-white disabled:cursor-not-allowed disabled:opacity-35 sm:h-10 sm:w-10"
                    >
                      <CaretLeft aria-hidden />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          aria-current={page === p ? "page" : undefined}
                          className={[
                            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border text-sm font-bold transition sm:h-10 sm:w-10",
                            page === p
                              ? "border-brand-red bg-brand-red text-white"
                              : "border-gray-200 text-gray-600 hover:bg-brand-red hover:text-white",
                          ].join(" ")}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Next page"
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:bg-brand-red hover:text-white disabled:cursor-not-allowed disabled:opacity-35 sm:h-10 sm:w-10"
                    >
                      <CaretRight aria-hidden />
                    </button>
                  </div>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
    </div>
  );
}
