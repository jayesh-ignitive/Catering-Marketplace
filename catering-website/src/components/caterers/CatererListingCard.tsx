"use client";

import { useI18n } from "@/context/LocaleContext";
import {
  BowlFood,
  Crown,
  CurrencyInr,
  MapPin,
  SealCheck,
  Users,
} from "@phosphor-icons/react";
import { trans } from "@/i18n";
import Link from "next/link";
import { RemoteContentImage } from "@/components/common/RemoteContentImage";
import {
  formatCuisinesChip,
  formatMarketplaceCapacityShort,
  formatMarketplacePriceChip,
  type MarketplaceListItem,
} from "@/lib/catering-api";

import { getCatererCardBadge, type ListingViewMode } from "@/lib/caterer-listing-utils";

function locationLine(row: MarketplaceListItem, locationOnRequest: string): string {
  if (row.streetAddress?.trim()) {
    const area = row.streetAddress.split(",")[0]?.trim();
    if (area && row.city) return `${area}, ${row.city}`;
    return row.streetAddress;
  }
  return [row.city, row.state].filter(Boolean).join(", ") || locationOnRequest;
}

const cardShellClass = (
  isGrid: boolean,
  preview: boolean,
) =>
  [
    "caterer-card group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-500",
    preview
      ? "cursor-default"
      : "cursor-pointer hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
    isGrid ? "flex h-full flex-col" : "flex flex-row items-start sm:items-stretch",
  ].join(" ");

export function CatererListingCard({
  row,
  viewMode,
  preview = false,
}: {
  row: MarketplaceListItem;
  viewMode: ListingViewMode;
  /** Non-interactive preview (workspace dashboard). */
  preview?: boolean;
}) {
  const { w, trans } = useI18n();

  const isGrid = viewMode === "grid";
  const badge = getCatererCardBadge(row);
  const capacity = formatMarketplaceCapacityShort(row.capacityGuestMin, row.capacityGuestMax);
  const cuisines = formatCuisinesChip(row.cuisines ?? []);
  const priceChip = formatMarketplacePriceChip(row.priceFrom);
  const href = `/caterers/${encodeURIComponent(row.profileSlug)}`;

  const shellClass = cardShellClass(isGrid, preview);

  const cardBody = (
    <>
      <div
        className={[
          "card-image-wrapper relative shrink-0 overflow-hidden",
          isGrid
            ? "h-[150px] w-full"
            : "h-24 w-24 shrink-0 sm:h-36 sm:w-36 md:h-56 md:w-64",
        ].join(" ")}
      >
        {row.heroImageUrl ? (
          <RemoteContentImage
            src={row.heroImageUrl}
            alt=""
            fill
            sizes={isGrid ? "(max-width: 768px) 100vw, 320px" : "(max-width: 640px) 96px, 256px"}
            className={[
              "object-cover transition-transform duration-700",
              preview ? "" : "group-hover:scale-110",
            ].join(" ")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-dark/5 to-brand-red/10">
            <span className="font-logo text-5xl text-brand-red/35">{row.businessName.slice(0, 1)}</span>
          </div>
        )}
        {badge ? (
          <div className="absolute left-3 top-3">
            <span
              className={[
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-lg",
                badge.kind === "top-rated"
                  ? "bg-brand-yellow text-brand-dark"
                  : "bg-brand-green text-white",
              ].join(" ")}
            >
              {badge.kind === "top-rated" ? (
                <Crown weight="fill" aria-hidden />
              ) : (
                <SealCheck weight="fill" aria-hidden />
              )}
              {badge.kind === "top-rated" ? w.caterers.card.topRated : w.caterers.card.verified}
            </span>
          </div>
        ) : null}
      </div>

      <div
        className={[
          "card-content flex min-w-0 flex-1 flex-col p-2.5 sm:p-5",
          isGrid ? "min-h-0" : "",
        ].join(" ")}
      >
        <div className="mb-1 min-w-0">
          <h2
            className={[
              "font-heading font-bold leading-tight text-brand-dark transition-colors",
              preview ? "" : "group-hover:text-brand-red",
              isGrid ? "text-base" : "text-base sm:text-lg md:text-xl",
            ].join(" ")}
          >
            {row.businessName}
          </h2>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
            <MapPin className="shrink-0 text-brand-red" weight="fill" aria-hidden />
            <span className="truncate">{locationLine(row, w.caterers.card.locationOnRequest)}</span>
          </div>
        </div>

        {row.about?.trim() ? (
          <p
            className={[
              "text-xs text-gray-500",
              isGrid
                ? "mb-4 line-clamp-2 leading-relaxed"
                : "mb-1.5 line-clamp-1 leading-snug sm:mb-4 sm:line-clamp-2 sm:leading-relaxed",
            ].join(" ")}
          >
            {row.about.trim()}
          </p>
        ) : null}

        <div
          className={[
            isGrid
              ? "mb-4 grid grid-cols-2 gap-2 md:grid-cols-3"
              : "mb-1.5 flex flex-wrap gap-1.5 sm:mb-4 sm:grid sm:grid-cols-2 sm:gap-2 md:grid-cols-3",
          ].join(" ")}
        >
          {capacity ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-600 sm:gap-2 sm:px-2.5 sm:py-1.5">
              <Users className="text-sm text-brand-red" aria-hidden />
              {capacity}
            </div>
          ) : null}
          {cuisines ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-600 sm:gap-2 sm:px-2.5 sm:py-1.5">
              <BowlFood className="text-sm text-brand-red" aria-hidden />
              {cuisines}
            </div>
          ) : null}
          {priceChip ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-600 sm:gap-2 sm:px-2.5 sm:py-1.5">
              <CurrencyInr className="text-sm text-brand-red" aria-hidden />
              {priceChip}
            </div>
          ) : row.primaryCategoryName ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-600 sm:gap-2 sm:px-2.5 sm:py-1.5">
              {row.primaryCategoryName}
            </div>
          ) : null}
        </div>

        <div
          className={[
            "mt-auto flex items-center justify-between gap-3 border-t border-gray-50",
            isGrid ? "pt-4" : "pt-1.5 sm:pt-4",
          ].join(" ")}
        >
          {row.tagline?.trim() ? (
            <p
              className={[
                "min-w-0 flex-1 text-[10px] italic leading-snug text-gray-400",
                isGrid ? "line-clamp-2" : "line-clamp-1 sm:line-clamp-2",
              ].join(" ")}
            >
              &ldquo;{row.tagline.trim()}&rdquo;
            </p>
          ) : (
            <span className="flex-1" aria-hidden />
          )}
          <span
            className={[
              "shrink-0 rounded-lg bg-brand-dark font-bold text-white shadow-md transition-all",
              preview ? "" : "group-hover:bg-brand-red",
              row.tagline?.trim()
                ? "px-3 py-1.5 text-[10px] sm:px-4 sm:py-2 sm:text-xs"
                : "ml-auto px-4 py-2 text-xs",
            ].join(" ")}
          >
            {w.caterers.card.viewDetails}
          </span>
        </div>
      </div>
    </>
  );

  if (preview) {
    return (
      <article className={shellClass} aria-label={`Listing preview: ${row.businessName}`}>
        {cardBody}
      </article>
    );
  }

  return (
    <Link
      href={href}
      aria-label={trans(w.caterers.card.viewProfileAria, { name: row.businessName })}
      className={shellClass}
    >
      {cardBody}
    </Link>
  );
}
