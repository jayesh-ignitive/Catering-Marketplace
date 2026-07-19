export type ParsedPlaceAddress = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  /** Internal — map search display only */
  formattedAddress: string;
};

/** Street-level types only — excludes city, state, and country from map search suggestions. */
export const MAP_ADDRESS_PRIMARY_TYPES = [
  "street_address",
  "premise",
  "subpremise",
  "route",
  "establishment",
] as const;

/** Display value for the address line 1 field / search box after a place is chosen. */
export function buildStreetSearchDisplay(addressLine1: string, _pincode?: string): string {
  return addressLine1.trim();
}

/** Street portion of formatted address — strips city, state, country, and pincode. */
export function extractStreetLineFromFormatted(
  formattedAddress: string,
  parsed: Pick<ParsedPlaceAddress, "city" | "state" | "country" | "pincode">
): string {
  const trimmed = formattedAddress.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  const strip = new Set(
    [parsed.city, parsed.state, parsed.country, parsed.pincode]
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const streetParts = parts.filter((part) => {
    if (strip.has(part)) return false;
    if (/^\d{6}$/.test(part.replace(/\s/g, ""))) return false;
    return true;
  });

  return streetParts.join(", ").trim();
}

/** Read place title from Places API (New) displayName. */
export function readPlaceDisplayName(
  displayName: google.maps.places.FormattableText | string | undefined
): string {
  if (!displayName) return "";
  if (typeof displayName === "string") return displayName.trim();
  return displayName.text?.trim() ?? "";
}

/** Ensure establishment / building name appears at the start of address line 1. */
export function prependPlaceTitle(line1: string, title?: string): string {
  const name = title?.trim();
  if (!name) return line1.trim();
  const line = line1.trim();
  if (!line) return name;
  const lowerLine = line.toLowerCase();
  const lowerName = name.toLowerCase();
  if (lowerLine.startsWith(lowerName)) return line;
  if (lowerLine.includes(lowerName)) return line;
  return `${name}, ${line}`;
}

/** Street portion from autocomplete label — keeps title, strips city/state/country/pincode. */
export function streetFromSelectionLabel(
  label: string,
  parsed: Pick<ParsedPlaceAddress, "city" | "state" | "country" | "pincode">
): string {
  let rest = label.trim();
  if (!rest) return "";

  if (parsed.country) {
    const countryPattern = new RegExp(`,\\s*${escapeRegExp(parsed.country)}\\s*$`, "i");
    rest = rest.replace(countryPattern, "").trim();
  }
  if (parsed.state) {
    const statePattern = new RegExp(`,\\s*${escapeRegExp(parsed.state)}(?:\\s+\\d{6})?\\s*$`, "i");
    rest = rest.replace(statePattern, "").trim();
  }
  if (parsed.pincode) {
    rest = rest.replace(new RegExp(`,?\\s*${parsed.pincode}\\s*$`), "").trim();
  }
  if (parsed.city) {
    const cityIdx = rest.lastIndexOf(parsed.city);
    if (cityIdx > 0) {
      rest = rest.slice(0, cityIdx).replace(/,\s*$/, "").trim();
    }
  }
  return rest;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ROUTE_PART_RE =
  /\b(Rd\.?|Road|St\.?|Street|Lane|Ln\.?|Marg|Highway|Hwy|Avenue|Ave|Boulevard|Blvd|Nagar|Cross|Main|Galli|Path|Way|Expressway|Circle|Chowk)\b/i;

const LANDMARK_PART_RE =
  /^(near|opposite|opp\.?|beside|behind|next to|adjacent to|in front of|across from)\b/i;

function isRoutePart(part: string): boolean {
  return ROUTE_PART_RE.test(part);
}

function isLandmarkPart(part: string): boolean {
  return LANDMARK_PART_RE.test(part.trim());
}

function isUnitPart(part: string): boolean {
  const trimmed = part.trim();
  if (/^\d{1,4}[a-zA-Z]?$/.test(trimmed)) return true;
  return /^(?:#?\s*)?(?:suite|unit|flat|floor|shop|office|plot|room|block|wing|door|gate)\b/i.test(
    trimmed
  );
}

function titleMatchesPart(title: string, part: string): boolean {
  const titleLower = title.toLowerCase();
  const partLower = part.toLowerCase();
  if (!titleLower || !partLower) return false;
  if (partLower === titleLower) return true;
  const titleHead = titleLower.split(",")[0]?.trim() ?? titleLower;
  return partLower === titleHead || partLower.startsWith(titleHead) || titleHead.startsWith(partLower);
}

/** Split a comma-separated street string into line 1 (primary) and line 2 (unit, building, landmarks). */
export function splitStreetIntoAddressLines(
  fullStreet: string,
  placeTitle: string | undefined,
  existingLine2: string
): { addressLine1: string; addressLine2: string } {
  const trimmed = fullStreet.trim();
  if (!trimmed) {
    return { addressLine1: "", addressLine2: existingLine2.trim() };
  }

  const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { addressLine1: trimmed, addressLine2: existingLine2.trim() };
  }

  const line1: string[] = [];
  const line2: string[] = [];
  const title = placeTitle?.trim() ?? "";
  const routeExistsInParts = parts.some(isRoutePart);

  for (const part of parts) {
    if (isLandmarkPart(part)) {
      line2.push(part);
      continue;
    }
    if (isUnitPart(part)) {
      line2.push(part);
      continue;
    }
    if (isRoutePart(part)) {
      line1.push(part);
      continue;
    }
    if (title && titleMatchesPart(title, part)) {
      line1.push(part);
      continue;
    }
    const routeAlreadyPlaced = line1.some(isRoutePart);
    if (routeExistsInParts && (routeAlreadyPlaced || line1.length > 0)) {
      line2.push(part);
    } else {
      line1.push(part);
    }
  }

  let addressLine1 = line1.join(", ").trim();
  let addressLine2 = [...new Set([existingLine2.trim(), ...line2].filter(Boolean))].join(", ").trim();

  if (!addressLine2 && parts.length >= 2) {
    const routeIdx = parts.findIndex(isRoutePart);
    if (routeIdx >= 0 && routeIdx < parts.length - 1) {
      addressLine1 = parts.slice(0, routeIdx + 1).join(", ");
      addressLine2 = parts.slice(routeIdx + 1).join(", ");
    } else if (parts.length >= 3) {
      addressLine1 = parts.slice(0, 2).join(", ");
      addressLine2 = parts.slice(2).join(", ");
    }
  }

  return {
    addressLine1: addressLine1 || trimmed,
    addressLine2,
  };
}

/** Prefer the fullest street line from components, formatted address, or autocomplete label. */
export function finalizeParsedAddress(
  parsed: ParsedPlaceAddress,
  selectionLabel?: string,
  placeTitle?: string
): ParsedPlaceAddress {
  const title = placeTitle?.trim() ?? "";
  let line1 = parsed.addressLine1.trim();

  const fromFormatted = extractStreetLineFromFormatted(parsed.formattedAddress, parsed);
  if (fromFormatted.length > line1.length) {
    line1 = fromFormatted;
  }

  const label = selectionLabel?.trim();
  if (label) {
    const fromLabel = streetFromSelectionLabel(label, parsed);
    if (fromLabel.length > line1.length) {
      line1 = fromLabel;
    }
  }

  const resolvedTitle = title || (label ? label.split(",")[0]?.trim() : "");
  line1 = prependPlaceTitle(line1, resolvedTitle);

  const { addressLine1, addressLine2 } = splitStreetIntoAddressLines(
    line1,
    resolvedTitle,
    parsed.addressLine2
  );

  return { ...parsed, addressLine1, addressLine2 };
}

function parseAddressComponentList(
  components: Array<{ types: string[]; longText?: string; shortText?: string; long_name?: string; short_name?: string }>,
  formattedAddress: string,
  longKey: "longText" | "long_name",
  shortKey: "shortText" | "short_name"
): ParsedPlaceAddress {
  function component(type: string, useShort = false): string {
    const hit = components.find((c) => c.types.includes(type));
    if (!hit) return "";
    const value = useShort ? hit[shortKey] : hit[longKey];
    return value ?? "";
  }

  const streetNumber = component("street_number");
  const route = component("route");
  const subpremise = component("subpremise");
  const premise = component("premise");
  const floor = component("floor");
  const neighborhood =
    component("neighborhood") ||
    component("sublocality_level_2") ||
    component("sublocality_level_1") ||
    component("sublocality");
  const city =
    component("locality") ||
    component("postal_town") ||
    neighborhood;
  const district = component("administrative_area_level_2");
  const state = component("administrative_area_level_1");
  const country = component("country");

  const addressLine1Core = [streetNumber, route].filter(Boolean).join(" ").trim();
  const streetExtras = [neighborhood].filter(
    (part) => part && !addressLine1Core.includes(part)
  );
  const addressLine1 = [addressLine1Core, ...streetExtras].filter(Boolean).join(", ").trim();

  // Line 2 — unit, floor, building/premise (landmarks split in finalizeParsedAddress)
  const line2Parts = [subpremise, floor, premise].filter(Boolean);
  const addressLine2 = line2Parts.join(", ");

  const postalRaw = component("postal_code");
  const pincode = postalRaw.replace(/\D/g, "").slice(0, 6);

  const fallbackLine1 =
    addressLine1 ||
    [premise, route, neighborhood].filter(Boolean).join(", ") ||
    extractStreetLineFromFormatted(formattedAddress, {
      city,
      state,
      country,
      pincode,
    }) ||
    (formattedAddress.split(",")[0]?.trim() ?? "");

  return {
    addressLine1: fallbackLine1,
    addressLine2,
    city,
    district,
    state,
    country,
    pincode,
    formattedAddress,
  };
}

/** Extract address lines from Geocoder address components (India-focused). */
export function parseGoogleAddressComponents(
  components: google.maps.GeocoderAddressComponent[],
  formattedAddress = ""
): ParsedPlaceAddress {
  return parseAddressComponentList(components, formattedAddress, "long_name", "short_name");
}

/** Parse address components from Places API (New) Place objects. */
export function parseNewPlaceAddressComponents(
  components: google.maps.places.AddressComponent[],
  formattedAddress = ""
): ParsedPlaceAddress {
  return parseAddressComponentList(components, formattedAddress, "longText", "shortText");
}

export function parsePlaceResult(place: google.maps.places.PlaceResult): ParsedPlaceAddress | null {
  const loc = place.geometry?.location;
  if (!loc) return null;
  const formattedAddress = place.formatted_address ?? "";
  const components = place.address_components ?? [];
  return parseGoogleAddressComponents(components, formattedAddress);
}
