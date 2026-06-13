"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Crosshair, MagnifyingGlass, MapTrifold, X } from "@phosphor-icons/react";
import { readDeviceGeolocation, isDeviceGeolocationSupported } from "@/lib/device-geolocation";
import { INDIA_MAP_CENTER, isGoogleMapsConfigured, loadGoogleMaps } from "@/lib/google-maps-loader";
import {
  mapsErrorUserMessage,
  subscribeGoogleMapsErrors,
  type GoogleMapsErrorCode,
} from "@/lib/google-maps-errors";
import {
  buildStreetSearchDisplay,
  finalizeParsedAddress,
  MAP_ADDRESS_PRIMARY_TYPES,
  parseGoogleAddressComponents,
  parseNewPlaceAddressComponents,
  readPlaceDisplayName,
  type ParsedPlaceAddress,
} from "@/lib/google-places-address";
import { BHARAT_CATERHUB_MAP_STYLES, BRAND_MAP_PIN_ICON } from "@/lib/google-maps-theme";
import {
  fetchAddressSearchSuggestions,
  fetchPlaceAddressDetails,
  resolveAddressSearchSuggestion,
  type AddressSearchSuggestion,
} from "@/lib/workspace-address-search";
import { fieldRadius, workspaceHintTextClass } from "./constants";
import { fieldClassErrored } from "./utils";
import { InputLabel } from "./form-primitives";
import { AddressSearchSuggestionRow } from "./AddressSearchSuggestionRow";

export type WorkspaceAddressMapValue = {
  latitude: number;
  longitude: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
};

type Props = {
  latitude: number | null;
  longitude: number | null;
  addressLine1: string;
  addressLine2: string;
  pincode: string;
  resolvedCity?: string;
  resolvedState?: string;
  resolvedCountry?: string;
  required?: boolean;
  requestDeviceLocation?: boolean;
  labels: {
    addressLine1: string;
    addressLine1Hint: string;
    searchPlaceholder: string;
    openMap: string;
    closeMap: string;
    saveMapLocation: string;
    cancelMap: string;
    mapModalTitle: string;
    mapModalHint: string;
    mapInteractHint: string;
    shareLocationTitle: string;
    shareLocationHint: string;
    shareLocationButton: string;
    shareLocationRequesting: string;
    shareLocationDenied: string;
    shareLocationUnavailable: string;
    shareLocationDismiss: string;
    mapsNotConfigured: string;
    mapsLoadError: string;
    mapsApiEnableHint: string;
    mapsApiTargetBlocked: string;
    mapsRefererNotAllowed: string;
    mapsInvalidKey: string;
    mapsApiNotActivated: string;
    mapsBilling: string;
  };
  onChange: (value: WorkspaceAddressMapValue) => void;
  invalid?: boolean;
};

const MAP_HEIGHT = 380;
const SEARCH_DEBOUNCE_MS = 280;
const LINE1_EDIT_DEBOUNCE_MS = 600;

type DropdownRect = { top: number; left: number; width: number };

function readLatLng(loc: google.maps.LatLng | google.maps.LatLngLiteral): { lat: number; lng: number } {
  if (typeof (loc as google.maps.LatLng).lat === "function") {
    const ll = loc as google.maps.LatLng;
    return { lat: ll.lat(), lng: ll.lng() };
  }
  const literal = loc as google.maps.LatLngLiteral;
  return { lat: literal.lat, lng: literal.lng };
}

export function WorkspaceAddressMapPicker({
  latitude,
  longitude,
  addressLine1,
  addressLine2,
  pincode,
  resolvedCity = "",
  resolvedState = "",
  resolvedCountry = "",
  required = false,
  requestDeviceLocation = false,
  labels,
  onChange,
  invalid = false,
}: Props) {
  const listboxId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapAutocompleteHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const mapModalOpenRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressLine1Ref = useRef(addressLine1);
  const addressLine2Ref = useRef(addressLine2);
  const pincodeRef = useRef(pincode);
  const latitudeRef = useRef(latitude);
  const longitudeRef = useRef(longitude);
  const line1EditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditingSearchRef = useRef(false);
  const lastResolvedRef = useRef<
    Pick<WorkspaceAddressMapValue, "city" | "district" | "state" | "country" | "pincode">
  >({
    city: "",
    district: "",
    state: "",
    country: "",
    pincode: "",
  });
  addressLine1Ref.current = addressLine1;
  addressLine2Ref.current = addressLine2;
  pincodeRef.current = pincode;
  latitudeRef.current = latitude;
  longitudeRef.current = longitude;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mounted, setMounted] = useState(false);
  const [placesState, setPlacesState] = useState<"ready" | "error" | "unconfigured">(() =>
    isGoogleMapsConfigured() ? "ready" : "unconfigured"
  );
  const [mapState, setMapState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapPinReadyInModal, setMapPinReadyInModal] = useState(false);
  mapModalOpenRef.current = mapModalOpen;
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [mapsErrorCode, setMapsErrorCode] = useState<GoogleMapsErrorCode | null>(null);
  const [geoPromptOpen, setGeoPromptOpen] = useState(true);
  const [geoRequesting, setGeoRequesting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [query, setQuery] = useState(() => buildStreetSearchDisplay(addressLine1, pincode));
  const [suggestions, setSuggestions] = useState<AddressSearchSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);

  const hasPin = latitude != null && longitude != null;
  const reverseGeocodeRef = useRef<(lat: number, lng: number, closeModal?: boolean) => void>(() => {});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    lastResolvedRef.current = {
      city: resolvedCity,
      district: lastResolvedRef.current.district ?? "",
      state: resolvedState,
      country: resolvedCountry,
      pincode: pincode.replace(/\D/g, "").slice(0, 6),
    };
  }, [resolvedCity, resolvedState, resolvedCountry, pincode]);

  useEffect(() => {
    if (isEditingSearchRef.current) return;
    const display = buildStreetSearchDisplay(addressLine1, pincode);
    if (display) setQuery(display);
  }, [addressLine1, pincode]);

  useEffect(() => {
    return subscribeGoogleMapsErrors((code) => {
      setMapsErrorCode(code);
      setPlacesState("error");
      setMapState("error");
    });
  }, []);

  useEffect(() => {
    if (!mapModalOpen || !mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMapModalOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mapModalOpen, mounted]);

  const updateDropdownRect = useCallback(() => {
    const el = searchInputRef.current?.closest(".ws-address-search-shell");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const closeSuggestions = useCallback(() => {
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
  }, []);

  const handleClearSearch = useCallback(() => {
    isEditingSearchRef.current = true;
    setQuery("");
    setSuggestions([]);
    closeSuggestions();
    searchInputRef.current?.focus();
  }, [closeSuggestions]);

  const destroyMapInstance = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
      markerRef.current = null;
    }
    const map = mapRef.current;
    if (map) {
      google.maps.event.clearInstanceListeners(map);
      mapRef.current = null;
    }
    geocoderRef.current = null;
  }, []);

  const closeMapModal = useCallback(() => {
    setMapModalOpen(false);
    setGeoPromptOpen(false);
    setMapPinReadyInModal(false);
    destroyMapInstance();
    setMapState("idle");
  }, [destroyMapInstance]);

  const openMapModal = useCallback(() => {
    setMapPinReadyInModal(latitude != null && longitude != null);
    setMapModalOpen(true);
  }, [latitude, longitude]);

  const applyCoords = useCallback(
    (
      lat: number,
      lng: number,
      parsed?: ParsedPlaceAddress,
      closeModal = true,
      selectionLabel?: string,
      placeTitle?: string
    ) => {
      const resolved = parsed
        ? finalizeParsedAddress(parsed, selectionLabel, placeTitle)
        : undefined;
      if (resolved) {
        setQuery(resolved.addressLine1);
        lastResolvedRef.current = {
          city: resolved.city,
          district: resolved.district,
          state: resolved.state,
          country: resolved.country,
          pincode: resolved.pincode,
        };
      }
      const map = mapRef.current;
      const marker = markerRef.current;
      const pos = { lat, lng };
      map?.panTo(pos);
      if (map && (map.getZoom() ?? 0) < 14) map.setZoom(16);
      marker?.setPosition(pos);
      onChangeRef.current({
        latitude: lat,
        longitude: lng,
        addressLine1: resolved?.addressLine1 ?? addressLine1Ref.current,
        addressLine2: resolved ? resolved.addressLine2 : addressLine2Ref.current,
        city: resolved?.city ?? lastResolvedRef.current.city ?? "",
        district: resolved?.district ?? lastResolvedRef.current.district ?? "",
        state: resolved?.state ?? lastResolvedRef.current.state ?? "",
        country: resolved?.country ?? lastResolvedRef.current.country ?? "",
        pincode: resolved?.pincode ?? pincodeRef.current,
      });
      closeSuggestions();
      isEditingSearchRef.current = false;
      if (!closeModal && mapModalOpenRef.current) {
        setMapPinReadyInModal(true);
      }
      if (closeModal) closeMapModal();
    },
    [closeMapModal, closeSuggestions]
  );

  const emitLine1Edit = useCallback((line1: string) => {
    const lat = latitudeRef.current;
    const lng = longitudeRef.current;
    if (lat == null || lng == null) return;
    onChangeRef.current({
      latitude: lat,
      longitude: lng,
      addressLine1: line1,
      addressLine2: addressLine2Ref.current,
      city: lastResolvedRef.current.city ?? "",
      district: lastResolvedRef.current.district ?? "",
      state: lastResolvedRef.current.state ?? "",
      country: lastResolvedRef.current.country ?? "",
      pincode: lastResolvedRef.current.pincode ?? pincodeRef.current,
    });
  }, []);

  const reverseGeocode = useCallback(
    (lat: number, lng: number, closeModal = false) => {
      const geocoder = geocoderRef.current;
      if (!geocoder) {
        applyCoords(lat, lng, undefined, closeModal);
        return;
      }
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status !== "OK" || !results?.[0]) {
          applyCoords(lat, lng, undefined, closeModal);
          return;
        }
        const parsed = parseGoogleAddressComponents(
          results[0].address_components ?? [],
          results[0].formatted_address ?? ""
        );
        applyCoords(lat, lng, parsed, closeModal);
      });
    },
    [applyCoords]
  );

  reverseGeocodeRef.current = reverseGeocode;

  const applyPlaceSelection = useCallback(
    (
      place: google.maps.places.Place,
      closeModal = false,
      selectionLabel?: string,
      placeTitle?: string
    ) => {
      const loc = place.location;
      if (!loc) return;
      const { lat, lng } = readLatLng(loc);
      const parsed = parseNewPlaceAddressComponents(
        place.addressComponents ?? [],
        place.formattedAddress ?? ""
      );
      const label = selectionLabel ?? place.formattedAddress ?? "";
      const title = placeTitle || readPlaceDisplayName(place.displayName);
      const map = mapRef.current;
      const marker = markerRef.current;
      if (map) {
        if (place.viewport) {
          map.fitBounds(place.viewport);
        } else {
          map.panTo({ lat, lng });
          if ((map.getZoom() ?? 0) < 14) map.setZoom(17);
        }
      }
      marker?.setPosition({ lat, lng });
      applyCoords(lat, lng, parsed, closeModal, label, title);
    },
    [applyCoords]
  );

  const selectSuggestion = useCallback(
    async (suggestion: AddressSearchSuggestion) => {
      try {
        setSuggestionsLoading(true);
        const place = await resolveAddressSearchSuggestion(suggestion);
        applyPlaceSelection(place, false, suggestion.label, suggestion.title);
      } catch (err: unknown) {
        setPlacesState("error");
        setErrorDetail(err instanceof Error ? err.message : null);
      } finally {
        setSuggestionsLoading(false);
        setSuggestions([]);
      }
    },
    [applyPlaceSelection]
  );

  const queueSuggestionFetch = useCallback(
    (value: string) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setSuggestions([]);
        setSuggestionsLoading(false);
        return;
      }
      setSuggestionsLoading(true);
      searchDebounceRef.current = setTimeout(() => {
        void fetchAddressSearchSuggestions(trimmed)
          .then((next) => {
            setSuggestions(next);
            setSuggestionsOpen(true);
            setActiveSuggestion(-1);
            updateDropdownRect();
          })
          .catch((err: unknown) => {
            setPlacesState("error");
            setErrorDetail(err instanceof Error ? err.message : null);
            setSuggestions([]);
          })
          .finally(() => {
            setSuggestionsLoading(false);
          });
      }, SEARCH_DEBOUNCE_MS);
    },
    [updateDropdownRect]
  );

  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (line1EditTimerRef.current) clearTimeout(line1EditTimerRef.current);
    },
    []
  );

  useEffect(() => {
    if (!suggestionsOpen) return;
    updateDropdownRect();
    const onScrollOrResize = () => updateDropdownRect();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [suggestionsOpen, suggestions.length, updateDropdownRect]);

  useEffect(() => {
    if (!suggestionsOpen) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (searchInputRef.current?.contains(target)) return;
      const panel = document.getElementById(listboxId);
      if (panel?.contains(target)) return;
      closeSuggestions();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [closeSuggestions, listboxId, suggestionsOpen]);

  const handleShareDeviceLocation = useCallback(async () => {
    if (!isDeviceGeolocationSupported()) {
      setGeoError(labels.shareLocationUnavailable);
      return;
    }
    setGeoRequesting(true);
    setGeoError(null);
    const result = await readDeviceGeolocation();
    setGeoRequesting(false);
    if (result.ok) {
      reverseGeocodeRef.current(result.latitude, result.longitude, false);
      return;
    }
    if (result.code === "denied") {
      setGeoError(labels.shareLocationDenied);
      return;
    }
    setGeoError(labels.shareLocationUnavailable);
  }, [labels.shareLocationDenied, labels.shareLocationUnavailable]);

  const showGeoPrompt =
    requestDeviceLocation && mapModalOpen && mapState === "ready" && !hasPin && geoPromptOpen;

  /** Map — loads when modal opens; torn down on close so reopen always gets a fresh instance. */
  useEffect(() => {
    if (!mapModalOpen || !isGoogleMapsConfigured()) return;

    let cancelled = false;
    setMapState("loading");

    loadGoogleMaps()
      .then(async (g) => {
        if (cancelled || !mapDivRef.current) return;

        const { Map } = (await g.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        if (cancelled || !mapDivRef.current) return;

        const existingMap = mapRef.current;
        if (existingMap) {
          const attachedDiv = existingMap.getDiv();
          if (attachedDiv === mapDivRef.current && attachedDiv.isConnected) {
            setMapState("ready");
            window.setTimeout(() => {
              if (mapRef.current) google.maps.event.trigger(mapRef.current, "resize");
            }, 120);
            return;
          }
          destroyMapInstance();
        }

        const initialLat = latitudeRef.current ?? INDIA_MAP_CENTER.lat;
        const initialLng = longitudeRef.current ?? INDIA_MAP_CENTER.lng;
        const center = { lat: initialLat, lng: initialLng };

        const map = new Map(mapDivRef.current, {
          center,
          zoom: latitudeRef.current != null && longitudeRef.current != null ? 16 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: BHARAT_CATERHUB_MAP_STYLES,
          backgroundColor: "#f5f5f5",
        });
        mapRef.current = map;

        const marker = new g.maps.Marker({
          map,
          position: center,
          draggable: true,
          title: labels.mapModalTitle,
          icon: {
            url: BRAND_MAP_PIN_ICON.url,
            scaledSize: new g.maps.Size(
              BRAND_MAP_PIN_ICON.scaledSize.width,
              BRAND_MAP_PIN_ICON.scaledSize.height
            ),
            anchor: new g.maps.Point(BRAND_MAP_PIN_ICON.anchor.x, BRAND_MAP_PIN_ICON.anchor.y),
          },
          animation:
            latitudeRef.current != null && longitudeRef.current != null
              ? g.maps.Animation.DROP
              : undefined,
        });
        markerRef.current = marker;

        geocoderRef.current = new g.maps.Geocoder();

        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (!p) return;
          reverseGeocodeRef.current(p.lat(), p.lng(), false);
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          const latLng = e.latLng;
          if (!latLng) return;
          reverseGeocodeRef.current(latLng.lat(), latLng.lng(), false);
        });

        setMapState("ready");
        window.setTimeout(() => {
          if (mapRef.current) google.maps.event.trigger(mapRef.current, "resize");
        }, 120);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMapState("error");
          setErrorDetail(err instanceof Error ? err.message : null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [destroyMapInstance, labels.mapModalTitle, mapModalOpen]);

  useEffect(() => {
    if (mapState !== "ready" || latitude == null || longitude == null) return;
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const pos = { lat: latitude, lng: longitude };
    marker.setPosition(pos);
    map.panTo(pos);
  }, [latitude, longitude, mapState]);

  /** Place Autocomplete on map (Place ID Finder pattern). */
  useEffect(() => {
    if (!mapModalOpen || mapState !== "ready" || !mapAutocompleteHostRef.current) return;

    let cancelled = false;
    let autocomplete: google.maps.places.PlaceAutocompleteElement | null = null;
    let boundsListener: google.maps.MapsEventListener | null = null;

    const onPlaceSelect = (event: Event) => {
      const placePrediction = (event as google.maps.places.PlacePredictionSelectEvent)
        .placePrediction;
      if (!placePrediction) return;
      void (async () => {
        try {
          const place = placePrediction.toPlace();
          await fetchPlaceAddressDetails(place);
          if (cancelled) return;
          applyPlaceSelection(place, false);
        } catch (err: unknown) {
          if (cancelled) return;
          setPlacesState("error");
          setErrorDetail(err instanceof Error ? err.message : null);
        }
      })();
    };

    void loadGoogleMaps()
      .then(async () => {
        if (cancelled || !mapAutocompleteHostRef.current) return;
        const { PlaceAutocompleteElement } = (await google.maps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;
        if (cancelled || !mapAutocompleteHostRef.current) return;

        autocomplete = new PlaceAutocompleteElement({
          includedRegionCodes: ["in"],
          includedPrimaryTypes: [...MAP_ADDRESS_PRIMARY_TYPES],
          placeholder: labels.searchPlaceholder,
        });

        const map = mapRef.current;
        if (map) {
          const bounds = map.getBounds();
          if (bounds) autocomplete.locationBias = bounds;
          boundsListener = map.addListener("bounds_changed", () => {
            const nextBounds = map.getBounds();
            if (nextBounds && autocomplete) autocomplete.locationBias = nextBounds;
          });
        }

        autocomplete.addEventListener("gmp-select", onPlaceSelect);
        mapAutocompleteHostRef.current.replaceChildren(autocomplete);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setPlacesState("error");
          setErrorDetail(err instanceof Error ? err.message : null);
        }
      });

    return () => {
      cancelled = true;
      boundsListener?.remove();
      autocomplete?.removeEventListener("gmp-select", onPlaceSelect);
      mapAutocompleteHostRef.current?.replaceChildren();
    };
  }, [applyPlaceSelection, labels.searchPlaceholder, mapModalOpen, mapState]);

  useEffect(() => {
    if (!mapModalOpen || hasPin) return;
    setGeoPromptOpen(true);
  }, [mapModalOpen, hasPin]);

  if (placesState === "unconfigured") {
    return (
      <div className="w-full rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {labels.mapsNotConfigured}
      </div>
    );
  }

  const inputClass =
    "min-h-0 min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm text-[#111827] shadow-none outline-none ring-0 placeholder:text-[#9CA3AF] focus:ring-0";

  const searchShellClass = fieldClassErrored(
    `ws-address-search-shell flex w-full items-center gap-2 ${fieldRadius} border border-[#E5E7EB] bg-white pl-4 pr-2 transition-colors focus-within:border-brand-red${
      suggestionsOpen ? " relative z-[120]" : ""
    }`,
    invalid
  );

  const suggestionsPortal =
    mounted && suggestionsOpen && dropdownRect && (suggestions.length > 0 || suggestionsLoading)
      ? createPortal(
          <ul
            id={listboxId}
            role="listbox"
            aria-label={labels.searchPlaceholder}
            className="ws-address-suggestions-panel fixed z-[400] max-h-80 overflow-y-auto rounded-sm border border-[#E5E7EB] bg-white py-1 shadow-[0_8px_24px_rgba(17,24,39,0.12)]"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
            }}
          >
            {suggestionsLoading && suggestions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[#6B7280]">Searching…</li>
            ) : null}
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                role="presentation"
                className="border-b border-[#E5E7EB] last:border-b-0"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === index}
                  className="block w-full cursor-pointer text-left transition-colors hover:bg-[#F9FAFB]"
                  onMouseEnter={() => setActiveSuggestion(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void selectSuggestion(suggestion)}
                >
                  <AddressSearchSuggestionRow
                    suggestion={suggestion}
                    query={query}
                    active={activeSuggestion === index}
                  />
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )
      : null;

  const mapModal =
    mounted && mapModalOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeMapModal();
            }}
          >
            <div
              id="ws-address-map-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ws-address-map-title"
              className="ws-address-map-modal flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-[#e0e0e0] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e0e0e0] bg-[#fafafa] px-4 py-3 sm:px-5 sm:py-4">
                <div className="min-w-0">
                  <h2 id="ws-address-map-title" className="text-base font-semibold text-[#424242]">
                    {labels.mapModalTitle}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#757575]">{labels.mapModalHint}</p>
                </div>
                <button
                  type="button"
                  onClick={closeMapModal}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-2 text-[#757575] transition-colors hover:bg-[#eeeeee]"
                  aria-label={labels.closeMap}
                >
                  <X className="size-5" weight="bold" aria-hidden />
                </button>
              </header>

              <div className="relative min-h-0 flex-1 bg-[#eeeeee]">
                {mapState === "loading" ? (
                  <div
                    className="absolute inset-0 z-20 flex items-center justify-center bg-[#f5f5f5]"
                    style={{ minHeight: MAP_HEIGHT }}
                    aria-hidden
                  >
                    <div className="flex flex-col items-center gap-2 text-[#757575]">
                      <MapTrifold className="size-8 animate-pulse text-[#9e9e9e]" weight="duotone" />
                      <span className="text-xs font-medium tracking-wide uppercase">Loading map…</span>
                    </div>
                  </div>
                ) : null}

                {showGeoPrompt ? (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#424242]/45 p-4">
                    <div
                      className="w-full max-w-sm rounded-sm bg-white p-4 shadow-lg ring-1 ring-[#e0e0e0]"
                      role="dialog"
                      aria-labelledby="ws-geo-prompt-title"
                      aria-describedby="ws-geo-prompt-desc"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-sm bg-[#f5f5f5] text-[#616161]">
                          <Crosshair className="size-5" weight="bold" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 id="ws-geo-prompt-title" className="text-sm font-semibold text-[#424242]">
                            {labels.shareLocationTitle}
                          </h3>
                          <p id="ws-geo-prompt-desc" className="mt-1 text-xs leading-relaxed text-[#757575]">
                            {labels.shareLocationHint}
                          </p>
                        </div>
                      </div>
                      {geoError ? (
                        <p className="mt-3 text-xs font-medium text-brand-red" role="alert">
                          {geoError}
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => void handleShareDeviceLocation()}
                          disabled={geoRequesting}
                          className="inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Crosshair className="size-4" weight="bold" aria-hidden />
                          {geoRequesting ? labels.shareLocationRequesting : labels.shareLocationButton}
                        </button>
                        <button
                          type="button"
                          onClick={() => setGeoPromptOpen(false)}
                          disabled={geoRequesting}
                          className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-sm border border-[#e0e0e0] bg-white px-4 py-2 text-sm font-medium text-[#616161] transition-colors hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {labels.shareLocationDismiss}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {mapState === "ready" ? (
                  <>
                    <div
                      ref={mapAutocompleteHostRef}
                      className="ws-address-map-autocomplete-host pointer-events-auto absolute top-3 left-3 right-3 z-20 sm:top-4 sm:left-4 sm:right-4"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#424242]/55 via-[#757575]/20 to-transparent px-4 pb-4 pt-12">
                      <p className="text-center text-xs font-medium text-white drop-shadow-sm">
                        {labels.mapInteractHint}
                      </p>
                    </div>
                  </>
                ) : null}

                <div
                  ref={mapDivRef}
                  className="w-full"
                  style={{ height: MAP_HEIGHT }}
                  aria-label={labels.mapModalTitle}
                />
              </div>

              <footer className="shrink-0 border-t border-[#e0e0e0] bg-[#fafafa] px-4 py-3 sm:px-5">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeMapModal}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-sm border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#F9FAFB] sm:min-w-[7rem]"
                  >
                    {labels.cancelMap}
                  </button>
                  <button
                    type="button"
                    onClick={closeMapModal}
                    disabled={!mapPinReadyInModal}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-sm bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[9rem]"
                  >
                    {labels.saveMapLocation}
                  </button>
                </div>
              </footer>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="relative w-full">
        <InputLabel htmlFor="ws-address-search">
          {labels.addressLine1}
          {required ? <span className="text-brand-red"> *</span> : null}
        </InputLabel>

        <div className="ws-address-line1-row w-full" aria-invalid={invalid}>
          <div className={searchShellClass}>
            <span className="flex shrink-0 items-center text-[#9CA3AF]" aria-hidden>
              <MagnifyingGlass className="size-4" weight="bold" />
            </span>
            <input
              ref={searchInputRef}
              id="ws-address-search"
              type="search"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen}
              aria-controls={suggestionsOpen ? listboxId : undefined}
              aria-describedby="ws-address-line1-hint"
              aria-invalid={invalid}
              placeholder={labels.searchPlaceholder}
              value={query}
              onChange={(e) => {
                const next = e.target.value;
                isEditingSearchRef.current = true;
                setQuery(next);
                if (hasPin) {
                  if (line1EditTimerRef.current) clearTimeout(line1EditTimerRef.current);
                  line1EditTimerRef.current = setTimeout(() => {
                    emitLine1Edit(next.trim());
                  }, LINE1_EDIT_DEBOUNCE_MS);
                }
                if (next.trim().length >= 2) {
                  setSuggestionsOpen(true);
                  updateDropdownRect();
                  queueSuggestionFetch(next);
                } else {
                  setSuggestions([]);
                  setSuggestionsOpen(false);
                }
              }}
              onBlur={() => {
                if (hasPin && query.trim()) {
                  if (line1EditTimerRef.current) clearTimeout(line1EditTimerRef.current);
                  emitLine1Edit(query.trim());
                }
                isEditingSearchRef.current = false;
              }}
              onFocus={() => {
                updateDropdownRect();
                if (query.trim().length >= 2) {
                  setSuggestionsOpen(true);
                  queueSuggestionFetch(query);
                }
              }}
              onKeyDown={(e) => {
                if (!suggestionsOpen || suggestions.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveSuggestion((prev) => Math.max(prev - 1, 0));
                } else if (e.key === "Enter" && activeSuggestion >= 0) {
                  e.preventDefault();
                  const picked = suggestions[activeSuggestion];
                  if (picked) void selectSuggestion(picked);
                } else if (e.key === "Escape") {
                  closeSuggestions();
                }
              }}
              className={inputClass}
            />
            {query ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm p-1 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#374151]"
                aria-label="Clear search"
              >
                <X className="size-4" weight="bold" aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              onClick={openMapModal}
              aria-haspopup="dialog"
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-stretch border-l border-[#E5E7EB] py-2 pl-3 text-sm font-semibold text-[#374151] transition-colors hover:text-[#111827]"
            >
              <MapTrifold className="size-4 shrink-0" weight="duotone" aria-hidden />
              <span className="hidden sm:inline">{labels.openMap}</span>
            </button>
          </div>
        </div>

        <p id="ws-address-line1-hint" className={`mt-1 ${workspaceHintTextClass}`}>
          {labels.addressLine1Hint}
        </p>

        {placesState === "error" || mapState === "error" ? (
          <div
            className="mt-1 space-y-1 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            role="alert"
          >
            <p className="font-semibold">
              {mapsErrorCode
                ? mapsErrorUserMessage(mapsErrorCode, {
                    apiTargetBlocked: labels.mapsApiTargetBlocked,
                    refererNotAllowed: labels.mapsRefererNotAllowed,
                    invalidKey: labels.mapsInvalidKey,
                    apiNotActivated: labels.mapsApiNotActivated,
                    billing: labels.mapsBilling,
                    generic: labels.mapsLoadError,
                  })
                : labels.mapsLoadError}
            </p>
            {!mapsErrorCode || mapsErrorCode !== "ApiTargetBlockedMapError" ? (
              <p className="text-red-800/90">{labels.mapsApiEnableHint}</p>
            ) : null}
            {errorDetail ? <p className="text-xs text-red-600/80">{errorDetail}</p> : null}
          </div>
        ) : null}
      </div>

      {suggestionsPortal}
      {mapModal}
    </>
  );
}
