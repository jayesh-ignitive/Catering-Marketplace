"use client";

import { MapPin } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { isGoogleMapsConfigured, loadGoogleMaps } from "@/lib/google-maps-loader";
import { BHARAT_CATERHUB_MAP_STYLES, BRAND_MAP_PIN_ICON } from "@/lib/google-maps-theme";

type Props = {
  latitude: number | null;
  longitude: number | null;
};

function formatCoord(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(6);
}

export function AdminAddressMapPreview({ latitude, longitude }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error" | "unconfigured">(
    () => (isGoogleMapsConfigured() ? "idle" : "unconfigured")
  );
  const hasPin = latitude != null && longitude != null;

  useEffect(() => {
    if (!hasPin) return;
    if (!isGoogleMapsConfigured()) {
      setLoadState("unconfigured");
      return;
    }

    let cancelled = false;
    setLoadState("loading");

    loadGoogleMaps()
      .then(async (g) => {
        if (cancelled || !mapDivRef.current) return;

        const { Map } = (await g.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        const center = { lat: latitude!, lng: longitude! };

        const map = new Map(mapDivRef.current, {
          center,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          scrollwheel: false,
          gestureHandling: "cooperative",
          styles: BHARAT_CATERHUB_MAP_STYLES,
        });

        new g.maps.Marker({
          position: center,
          map,
          icon: {
            url: BRAND_MAP_PIN_ICON.url,
            scaledSize: new g.maps.Size(
              BRAND_MAP_PIN_ICON.scaledSize.width,
              BRAND_MAP_PIN_ICON.scaledSize.height
            ),
            anchor: new g.maps.Point(BRAND_MAP_PIN_ICON.anchor.x, BRAND_MAP_PIN_ICON.anchor.y),
          },
        });

        if (!cancelled) setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [hasPin, latitude, longitude]);

  const mapsLink = hasPin ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;

  return (
    <div className="mt-1 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-brand-text-muted">Latitude</p>
          <p className="mt-1 font-mono text-sm text-brand-text-dark">{formatCoord(latitude)}</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-brand-text-muted">Longitude</p>
          <p className="mt-1 font-mono text-sm text-brand-text-dark">{formatCoord(longitude)}</p>
        </div>
      </div>

      {!hasPin ? (
        <div className="flex aspect-[16/10] max-h-56 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm text-brand-text-muted">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden />
            No map pin set
          </span>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            <div ref={mapDivRef} className="aspect-[16/10] max-h-64 w-full" aria-label="Business location map" />
            {loadState === "loading" || loadState === "idle" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 text-sm text-brand-text-muted">
                Loading map…
              </div>
            ) : null}
            {loadState === "unconfigured" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/95 px-4 text-center text-sm text-brand-text-muted">
                Map preview unavailable — add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              </div>
            ) : null}
            {loadState === "error" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/95 px-4 text-center text-sm text-brand-text-muted">
                Could not load map
              </div>
            ) : null}
          </div>
          {mapsLink ? (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-red hover:underline"
            >
              <MapPin className="size-4" aria-hidden />
              Open in Google Maps
            </a>
          ) : null}
        </>
      )}
    </div>
  );
}
