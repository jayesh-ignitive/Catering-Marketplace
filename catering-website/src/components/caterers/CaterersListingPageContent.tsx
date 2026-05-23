"use client";

import { Funnel, Rows, SquaresFour, X } from "@phosphor-icons/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListingPriceRangeSlider } from "@/components/caterers/ListingPriceRangeSlider";
import { trans } from "@/i18n";
import { useI18n } from "@/context/LocaleContext";
import { CatererListingCard } from "@/components/caterers/CatererListingCard";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { caterersListingPath, slugifyCitySegment } from "@/lib/caterers-url";
import {
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
  const { w, trans, locale } = useI18n();

  const router = useRouter();

  const [viewMode, setViewMode] = useState<ListingViewMode>("list");
  const [sort, setSort] = useState<ListingSortOption>("popularity");
  const limit = 12;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  /** Avoid chaining every page while the sentinel is in view before the user scrolls. */
  const infiniteScrollArmedRef = useRef(false);

  const [city, setCity] = useState(presetCityName ?? "");
  const [categoryId, setCategoryId] = useState(presetCategoryId ?? "");
  const [priceMin, setPriceMin] = useState(LISTING_PRICE_MIN);
  const [priceMax, setPriceMax] = useState(LISTING_PRICE_MAX);
  const [areaFilter, setAreaFilter] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debouncedPriceMin = useDebouncedValue(priceMin, LISTING_FILTER_DEBOUNCE_MS);
  const debouncedPriceMax = useDebouncedValue(priceMax, LISTING_FILTER_DEBOUNCE_MS);

  useEffect(() => {
    setViewMode(readListingViewMode());
  }, []);

  useEffect(() => {
    setCity(presetCityName ?? "");
  }, [presetCityName]);

  useEffect(() => {
    setCategoryId(presetCategoryId ?? "");
  }, [presetCategoryId]);

  const citiesQ = useQuery({
    queryKey: ["marketplace", "cities", locale],
    queryFn: () => fetchMarketplaceCities(locale),
  });
  const categoriesQ = useQuery({
    queryKey: ["catalog", "service-categories", locale],
    queryFn: () => fetchServiceCategories(locale),
  });

  const listFilters = useMemo(() => {
    const priceFiltered = !isListingPriceRangeDefault(debouncedPriceMin, debouncedPriceMax);
    return {
      city: city || undefined,
      categoryId: categoryId || undefined,
      priceMin: priceFiltered ? debouncedPriceMin : undefined,
      priceMax: priceFiltered ? debouncedPriceMax : undefined,
      limit,
    };
  }, [city, categoryId, debouncedPriceMin, debouncedPriceMax, limit]);

  const listQ = useInfiniteQuery({
    queryKey: ["marketplace", "caterers", "infinite", listFilters],
    queryFn: ({ pageParam }) =>
      fetchMarketplaceCaterers({ ...listFilters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.max(1, Math.ceil(lastPage.total / lastPage.limit));
      const next = lastPage.page + 1;
      return next <= totalPages ? next : undefined;
    },
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = listQ;

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

  const onCityChange = useCallback(
    (nextCity: string) => {
      navigateCityCategory(nextCity, categoryId);
    },
    [categoryId, navigateCityCategory],
  );

  const onCategoryChange = useCallback(
    (catId: string) => {
      const next = categoryId === catId ? "" : catId;
      navigateCityCategory(city, next);
    },
    [categoryId, city, navigateCityCategory],
  );

  const onPriceRangeChange = useCallback((min: number, max: number) => {
    setPriceMin(min);
    setPriceMax(max);
  }, []);

  const resetAllFilters = useCallback(() => {
    setPriceMin(LISTING_PRICE_MIN);
    setPriceMax(LISTING_PRICE_MAX);
    router.push("/caterers");
  }, [router]);

  const setView = useCallback((mode: ListingViewMode) => {
    setViewMode(mode);
    persistListingViewMode(mode);
  }, []);

  const totalCount = listQ.data?.pages[0]?.total ?? 0;

  const displayedItems = useMemo(() => {
    const seen = new Set<string>();
    const raw = (listQ.data?.pages ?? []).flatMap((p) => p.items).filter((row) => {
      if (seen.has(row.tenantId)) return false;
      seen.add(row.tenantId);
      return true;
    });
    return sortMarketplaceItems(raw, sort);
  }, [listQ.data?.pages, sort]);

  const isInitialLoading = listQ.isPending && !listQ.data;

  useEffect(() => {
    infiniteScrollArmedRef.current = false;
  }, [listFilters]);

  useEffect(() => {
    const arm = () => {
      infiniteScrollArmedRef.current = true;
    };
    window.addEventListener("scroll", arm, { passive: true });
    window.addEventListener("wheel", arm, { passive: true });
    window.addEventListener("touchmove", arm, { passive: true });
    return () => {
      window.removeEventListener("scroll", arm);
      window.removeEventListener("wheel", arm);
      window.removeEventListener("touchmove", arm);
    };
  }, []);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || !infiniteScrollArmedRef.current || isFetchingNextPage) {
          return;
        }
        void fetchNextPage();
      },
      { root: null, rootMargin: "160px 0px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, displayedItems.length]);

  const cityRows = useMemo(() => {
    const raw = citiesQ.data ?? [];
    if (
      presetCityName &&
      !raw.some((r) => r.city === presetCityName || r.displayName === presetCityName)
    ) {
      return [
        { city: presetCityName, slug: slugifyCitySegment(presetCityName), displayName: presetCityName },
        ...raw,
      ];
    }
    return raw;
  }, [citiesQ.data, presetCityName]);

  const citySelectOptions = useMemo(
    () => [
      { value: "", label: w.caterers.listing.allCities },
      ...cityRows.map((c) => ({ value: c.city, label: c.displayName })),
    ],
    [cityRows, w.caterers.listing.allCities],
  );

  const activeCategory = (categoriesQ.data ?? []).find((c) => c.id === categoryId);
  const pageTitle = city
    ? trans(w.caterers.listing.titleInCity, { city })
    : activeCategory
      ? trans(w.caterers.listing.titleCategory, { category: activeCategory.name })
      : w.caterers.listing.titleDefault;
  const breadcrumbTail = city
    ? trans(w.caterers.listing.breadcrumbInCity, { city })
    : activeCategory
      ? activeCategory.name
      : w.caterers.listing.breadcrumbAll;

  const isGrid = viewMode === "grid";

  const sortOptions = useMemo(
    () =>
      [
        { value: "popularity" as const, label: w.caterers.listing.sortPopularity },
        { value: "rating" as const, label: w.caterers.listing.sortRating },
        { value: "price-asc" as const, label: w.caterers.listing.sortPriceAsc },
        { value: "price-desc" as const, label: w.caterers.listing.sortPriceDesc },
      ],
    [
      w.caterers.listing.sortPopularity,
      w.caterers.listing.sortPriceAsc,
      w.caterers.listing.sortPriceDesc,
      w.caterers.listing.sortRating,
    ],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (city) n += 1;
    if (categoryId) n += 1;
    if (!isListingPriceRangeDefault(priceMin, priceMax)) n += 1;
    return n;
  }, [categoryId, city, priceMax, priceMin]);

  const filtersPanel = (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <h3 className="font-heading font-bold text-brand-dark">{w.caterers.listing.filters}</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetAllFilters}
            className="cursor-pointer text-xs font-bold text-brand-red hover:underline"
          >
            {w.caterers.listing.resetAll}
          </button>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label={w.caterers.listing.closeFilters}
          >
            <X className="text-lg" aria-hidden />
          </button>
        </div>
      </div>

      <div className="max-h-[min(70vh,520px)] space-y-6 overflow-y-auto p-4 sm:space-y-8 sm:p-5 max-lg:overflow-y-auto lg:max-h-none lg:overflow-visible">
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-dark">
            {w.caterers.listing.cityAria}
          </h4>
          <SearchableSelect
            instanceId="listing-city"
            ariaLabel={w.caterers.listing.cityAria}
            placeholder={w.caterers.listing.allCities}
            options={citySelectOptions}
            value={city}
            onChange={onCityChange}
          />
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-dark">
            {w.caterers.listing.serviceCategory}
          </h4>
          <div className="max-h-48 space-y-2 overflow-y-auto lg:max-h-none lg:overflow-visible">
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
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-dark">
            {w.caterers.listing.pricePerPlate}
          </h4>
          <ListingPriceRangeSlider min={priceMin} max={priceMax} onChange={onPriceRangeChange} />
        </div>

      </div>
    </div>
  );

  return (
    <div className="bg-gray-50">
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 scroll-mt-28 sm:mb-8">
        <nav className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-gray-500">
          <Link href="/" className="transition hover:text-brand-red">
            {w.caterers.listing.breadcrumbHome}
          </Link>
          <span className="text-gray-300" aria-hidden>
            /
          </span>
          <span className="break-words">{breadcrumbTail}</span>
        </nav>
        <h1 className="font-heading text-2xl font-bold leading-tight text-brand-dark sm:text-3xl">{pageTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          {isInitialLoading
            ? w.caterers.listing.loading
            : trans(
                (totalCount || displayedItems.length) === 1
                  ? w.caterers.listing.resultsShowingOne
                  : w.caterers.listing.resultsShowingMany,
                { count: nf.format(totalCount || displayedItems.length) },
              )}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <aside className="hidden w-full shrink-0 lg:block lg:w-72 lg:self-start">
          {filtersPanel}
        </aside>

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
              aria-label={w.caterers.listing.filters}
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
              {w.caterers.listing.filters}
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            <div className="flex flex-wrap items-center justify-end gap-3 sm:ml-auto">
              <label className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500">
                  {w.caterers.listing.sortBy}
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as ListingSortOption)}
                  aria-label={w.caterers.listing.sortAria}
                  className="max-w-[min(100%,14rem)] cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-brand-dark outline-none focus:border-brand-red"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={!isGrid}
                aria-label={w.caterers.listing.viewList}
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
                aria-label={w.caterers.listing.viewGrid}
                className={[
                  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all",
                  isGrid ? "bg-brand-red text-white" : "bg-gray-50 text-gray-400 hover:text-brand-red",
                ].join(" ")}
              >
                <SquaresFour weight="fill" aria-hidden />
              </button>
            </div>
            </div>
          </div>

          {isInitialLoading ? (
            <ListingSkeleton viewMode={viewMode} />
          ) : listQ.isError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-10 text-center sm:px-8 sm:py-14">
              <p className="font-heading text-lg font-bold text-red-900">{w.caterers.listing.loadErrorTitle}</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-red-800/80">{w.caterers.listing.loadErrorBody}</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-12 text-center shadow-sm sm:px-8 sm:py-16">
              <p className="font-heading text-xl font-bold text-brand-dark">{w.caterers.listing.noResults}</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{w.caterers.listing.tryAdjusting}</p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-6 cursor-pointer rounded-xl bg-brand-red px-6 py-3 text-sm font-bold text-white hover:bg-red-700"
              >
                {w.caterers.listing.resetFilters}
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

              <div
                ref={loadMoreRef}
                className="min-h-px pt-6 sm:pt-8"
                aria-hidden={!hasNextPage}
                aria-label={hasNextPage ? w.caterers.listing.loadMoreSentinel : undefined}
              >
                {isFetchingNextPage ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div
                      className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
                      aria-hidden
                    />
                    <p className="text-sm font-semibold text-gray-500">{w.caterers.listing.loadingMore}</p>
                  </div>
                ) : null}
              </div>

              {!hasNextPage && displayedItems.length > 0 && totalCount > limit ? (
                <p className="pt-2 text-center text-sm text-gray-500">{w.caterers.listing.endOfList}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
    </div>
  );
}
