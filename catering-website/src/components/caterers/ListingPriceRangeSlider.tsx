"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/context/LocaleContext";
import {
  LISTING_PRICE_MAX,
  LISTING_PRICE_MIN,
  LISTING_PRICE_STEP,
} from "@/lib/caterer-listing-utils";

/** Discourage password managers from injecting autofill UI into range inputs (hydration mismatch). */
const RANGE_INPUT_ATTRS = {
  autoComplete: "off",
  "data-lpignore": "true",
  "data-1p-ignore": "true",
  "data-form-type": "other",
} as const;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

type ListingPriceRangeSliderProps = {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
};

function PriceRangeTrack({
  fillLeft,
  fillRight,
  children,
}: {
  fillLeft: number;
  fillRight: number;
  children?: ReactNode;
}) {
  return (
    <div className="relative mx-1 h-8">
      <div className="absolute top-1/2 right-0 left-0 h-2 -translate-y-1/2 rounded-full bg-gray-200" />
      <div
        className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-brand-red"
        style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
        aria-hidden
      />
      {children}
    </div>
  );
}

export function ListingPriceRangeSlider({ min, max, onChange }: ListingPriceRangeSliderProps) {
  const { w } = useI18n();
  const [inputsReady, setInputsReady] = useState(false);

  useEffect(() => {
    setInputsReady(true);
  }, []);

  const floor = LISTING_PRICE_MIN;
  const ceiling = LISTING_PRICE_MAX;
  const span = ceiling - floor;

  const clampPair = (nextMin: number, nextMax: number) => {
    let lo = Math.max(floor, Math.min(nextMin, ceiling));
    let hi = Math.max(floor, Math.min(nextMax, ceiling));
    if (lo > hi - LISTING_PRICE_STEP) {
      if (nextMin !== min) {
        lo = hi - LISTING_PRICE_STEP;
      } else {
        hi = lo + LISTING_PRICE_STEP;
      }
    }
    onChange(lo, hi);
  };

  const fillLeft = ((min - floor) / span) * 100;
  const fillRight = ((ceiling - max) / span) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
        <span>{inr.format(min)}</span>
        <span className="text-gray-400">{w.caterers.listing.perPlate}</span>
        <span>{inr.format(max)}</span>
      </div>
      <PriceRangeTrack fillLeft={fillLeft} fillRight={fillRight}>
        {inputsReady ? (
          <>
            <input
              type="range"
              name="listing-price-min"
              min={floor}
              max={ceiling}
              step={LISTING_PRICE_STEP}
              value={min}
              onChange={(e) => clampPair(Number(e.target.value), max)}
              aria-label={w.caterers.listing.minPriceAria}
              className="listing-price-range-input absolute inset-0 z-[2] w-full cursor-pointer appearance-none bg-transparent"
              {...RANGE_INPUT_ATTRS}
            />
            <input
              type="range"
              name="listing-price-max"
              min={floor}
              max={ceiling}
              step={LISTING_PRICE_STEP}
              value={max}
              onChange={(e) => clampPair(min, Number(e.target.value))}
              aria-label={w.caterers.listing.maxPriceAria}
              className="listing-price-range-input absolute inset-0 z-[3] w-full cursor-pointer appearance-none bg-transparent"
              {...RANGE_INPUT_ATTRS}
            />
          </>
        ) : null}
      </PriceRangeTrack>
    </div>
  );
}
