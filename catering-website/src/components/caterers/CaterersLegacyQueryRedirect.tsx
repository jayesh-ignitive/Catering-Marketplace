"use client";

import { fetchCities, fetchMarketplaceCities, fetchServiceCategories } from "@/lib/catering-api";
import { caterersListingPath, resolveListingCityNameFromSlug, slugifyCitySegment } from "@/lib/caterers-url";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** One-time redirect from ?city=&categoryId= to path-based URLs. */
export function CaterersLegacyQueryRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    const cityQ = searchParams.get("city")?.trim();
    const catId = searchParams.get("categoryId")?.trim();
    if (!cityQ && !catId) return;
    ran.current = true;

    void Promise.all([fetchMarketplaceCities(), fetchCities(), fetchServiceCategories()])
      .then(([mCities, catalogCities, cats]) => {
        const cat = catId ? cats.find((c) => c.id === catId) : undefined;
        const citySeg = cityQ ? slugifyCitySegment(cityQ) : null;
        const resolvedCityName = citySeg
          ? resolveListingCityNameFromSlug(citySeg, mCities, catalogCities)
          : null;

        const path = caterersListingPath({
          cityName: resolvedCityName,
          categorySlug: cat?.slug ?? null,
        });
        router.replace(path);
      })
      .catch(() => {
        router.replace("/caterers");
      });
  }, [searchParams, router]);

  return null;
}
