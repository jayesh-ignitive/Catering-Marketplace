"use client";

import { useI18n } from "@/context/LocaleContext";
import { CatererListingCard } from "@/components/caterers/CatererListingCard";
import type { AuthUser } from "@/lib/auth-api";
import {
  type CatererWorkspaceProfile,
  fetchCities,
  fetchServiceCategories,
} from "@/lib/catering-api";
import {
  persistWorkspacePreviewViewMode,
  readWorkspacePreviewViewMode,
  type ListingViewMode,
} from "@/lib/caterer-listing-utils";
import { buildWorkspaceListingPreview } from "@/lib/workspace-listing-preview";
import { Rows, SquaresFour } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fieldRadius, workspaceHintTextClass } from "./caterer-profile/constants";

export function WorkspaceListingPreview({
  user,
  profile,
}: {
  user: AuthUser;
  profile: CatererWorkspaceProfile;
}) {
  const { ws, trans, locale } = useI18n();

  const [viewMode, setViewMode] = useState<ListingViewMode>("list");

  useEffect(() => {
    setViewMode(readWorkspacePreviewViewMode());
  }, []);

  const setView = useCallback((mode: ListingViewMode) => {
    setViewMode(mode);
    persistWorkspacePreviewViewMode(mode);
  }, []);

  const citiesQ = useQuery({
    queryKey: ["catalog", "cities", locale],
    queryFn: () => fetchCities(locale),
    staleTime: 60_000,
  });

  const categoriesQ = useQuery({
    queryKey: ["catalog", "service-categories", locale],
    queryFn: () => fetchServiceCategories(locale),
    staleTime: 60_000,
  });

  const previewRow = useMemo(() => {
    const cityName =
      profile.cityId && citiesQ.data
        ? (citiesQ.data.find((c) => c.id === profile.cityId)?.name ?? null)
        : null;
    const categoryNames =
      categoriesQ.data && profile.categoryCodes.length
        ? profile.categoryCodes
            .map((code) => categoriesQ.data!.find((c) => c.code === code)?.name)
            .filter((n): n is string => Boolean(n))
        : [];
    return buildWorkspaceListingPreview(user, profile, cityName, categoryNames);
  }, [user, profile, citiesQ.data, categoriesQ.data, locale]);

  const isGrid = viewMode === "grid";

  return (
    <div
      className={`mt-6 overflow-hidden ${fieldRadius} border border-stone-200 bg-white shadow-sm`}
    >
      <div className="flex flex-col gap-3 border-b border-stone-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8A92A6]">
            {ws.listingPreview.title}
          </p>
          <p className={`mt-1 ${workspaceHintTextClass}`}>{ws.listingPreview.hint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={!isGrid}
            aria-label={ws.listingPreview.listView}
            className={[
              "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all",
              !isGrid
                ? "bg-brand-red text-white"
                : "bg-stone-50 text-stone-400 hover:text-brand-red",
            ].join(" ")}
          >
            <Rows weight="fill" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-pressed={isGrid}
            aria-label={ws.listingPreview.gridView}
            className={[
              "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all",
              isGrid
                ? "bg-brand-red text-white"
                : "bg-stone-50 text-stone-400 hover:text-brand-red",
            ].join(" ")}
          >
            <SquaresFour weight="fill" aria-hidden />
          </button>
        </div>
      </div>

      <div className="bg-stone-50/60 p-4 sm:p-6">
        <div className={isGrid ? "mx-auto w-full max-w-sm sm:max-w-md" : "w-full"}>
          <CatererListingCard row={previewRow} viewMode={viewMode} preview />
        </div>
      </div>
    </div>
  );
}
