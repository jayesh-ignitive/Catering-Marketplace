import { MAP_ADDRESS_PRIMARY_TYPES } from "@/lib/google-places-address";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

export type AddressTextMatch = {
  startOffset: number;
  endOffset: number;
};

export type AddressSearchSuggestion = {
  id: string;
  /** Full prediction text */
  label: string;
  /** Place / building name (mainText) */
  title: string;
  /** Address detail after the title (secondaryText) */
  subtitle: string;
  /** Google match offsets for query highlighting in the title */
  titleMatches: AddressTextMatch[];
  placePrediction: google.maps.places.PlacePrediction;
};

function readPredictionText(text: google.maps.places.FormattableText | string | undefined): string {
  if (!text) return "";
  return typeof text === "string" ? text.trim() : (text.text?.trim() ?? "");
}

function readPredictionMatches(
  text: google.maps.places.FormattableText | string | undefined
): AddressTextMatch[] {
  if (!text || typeof text === "string") return [];
  return (text.matches ?? [])
    .map((match) => ({
      startOffset: match.startOffset ?? 0,
      endOffset: match.endOffset ?? 0,
    }))
    .filter((match) => match.endOffset > match.startOffset);
}

function readPredictionDisplay(placePrediction: google.maps.places.PlacePrediction): {
  label: string;
  title: string;
  subtitle: string;
  titleMatches: AddressTextMatch[];
} {
  const label = readPredictionText(placePrediction.text);
  const mainText = placePrediction.structuredFormat?.mainText;
  const main = readPredictionText(mainText);
  const secondary = readPredictionText(placePrediction.structuredFormat?.secondaryText);
  const titleMatches = readPredictionMatches(mainText);

  if (main) {
    return {
      label: label || [main, secondary].filter(Boolean).join(", "),
      title: main,
      subtitle: secondary,
      titleMatches,
    };
  }

  const commaIdx = label.indexOf(",");
  if (commaIdx > 0) {
    return {
      label,
      title: label.slice(0, commaIdx).trim(),
      subtitle: label.slice(commaIdx + 1).trim(),
      titleMatches: [],
    };
  }

  return { label, title: label, subtitle: "", titleMatches: [] };
}

let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

export function resetAddressSearchSession(): void {
  sessionToken = null;
}

export async function fetchAddressSearchSuggestions(
  query: string
): Promise<AddressSearchSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  await loadGoogleMaps();
  const { AutocompleteSessionToken, AutocompleteSuggestion } =
    (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

  if (!sessionToken) {
    sessionToken = new AutocompleteSessionToken();
  }

  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: trimmed,
    sessionToken,
    includedRegionCodes: ["in"],
    includedPrimaryTypes: [...MAP_ADDRESS_PRIMARY_TYPES],
  });

  return suggestions
    .map((suggestion, index) => {
      const placePrediction = suggestion.placePrediction;
      if (!placePrediction) return null;
      const display = readPredictionDisplay(placePrediction);
      if (!display.label) return null;
      return {
        id: `${index}-${display.label}`,
        ...display,
        placePrediction,
      };
    })
    .filter((item): item is AddressSearchSuggestion => item != null);
}

/** Fields needed to populate individual address lines + map pin (Place ID Finder pattern). */
export const PLACE_ADDRESS_DETAIL_FIELDS = [
  "displayName",
  "addressComponents",
  "formattedAddress",
  "location",
  "id",
  "viewport",
] as const;

export async function fetchPlaceAddressDetails(
  place: google.maps.places.Place
): Promise<google.maps.places.Place> {
  await place.fetchFields({ fields: [...PLACE_ADDRESS_DETAIL_FIELDS] });
  return place;
}

export async function resolveAddressSearchSuggestion(
  suggestion: AddressSearchSuggestion
): Promise<google.maps.places.Place> {
  const place = suggestion.placePrediction.toPlace();
  await fetchPlaceAddressDetails(place);
  resetAddressSearchSession();
  return place;
}
