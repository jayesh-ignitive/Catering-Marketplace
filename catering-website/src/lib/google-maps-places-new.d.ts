/** Minimal typings for Places API (New) widgets not yet in @types/google.maps. */
declare namespace google.maps.places {
  class AutocompleteSessionToken {}

  interface AutocompleteRequest {
    input: string;
    sessionToken?: AutocompleteSessionToken;
    includedRegionCodes?: string[];
    includedPrimaryTypes?: string[];
  }

  interface TextMatch {
    startOffset?: number;
    endOffset?: number;
  }

  interface FormattableText {
    text: string;
    matches?: TextMatch[];
  }

  interface PlacePredictionStructuredFormat {
    mainText?: FormattableText;
    secondaryText?: FormattableText;
  }

  interface PlacePrediction {
    text: FormattableText | string;
    structuredFormat?: PlacePredictionStructuredFormat;
    toPlace(): Place;
  }

  class AutocompleteSuggestion {
    placePrediction?: PlacePrediction;
    static fetchAutocompleteSuggestions(
      request: AutocompleteRequest
    ): Promise<{ suggestions: AutocompleteSuggestion[] }>;
  }

  class PlaceAutocompleteElement extends HTMLElement {
    constructor(options?: PlaceAutocompleteElementOptions);
    placeholder: string;
    value: string;
    name: string;
    disabled: boolean;
    includedRegionCodes: string[];
    includedPrimaryTypes: string[];
    noInputIcon: boolean;
    requestedRegion: string;
    locationBias?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
  }

  interface PlaceAutocompleteElementOptions {
    includedRegionCodes?: string[];
    includedPrimaryTypes?: string[];
    placeholder?: string;
    value?: string;
  }

  interface PlacePredictionSelectEvent extends Event {
    placePrediction: PlacePrediction;
  }

  interface AddressComponent {
    longText: string;
    shortText: string;
    types: string[];
  }

  interface Place {
    id?: string;
    displayName?: FormattableText | string;
    addressComponents?: AddressComponent[];
    formattedAddress?: string;
    location?: google.maps.LatLng | google.maps.LatLngLiteral;
    viewport?: google.maps.LatLngBounds;
    fetchFields(request: { fields: string[] }): Promise<{ place: Place }>;
  }
}

declare namespace google.maps {
  interface PlacesLibrary {
    PlaceAutocompleteElement: typeof places.PlaceAutocompleteElement;
    AutocompleteSessionToken: typeof places.AutocompleteSessionToken;
    AutocompleteSuggestion: typeof places.AutocompleteSuggestion;
  }

  interface MapsLibrary {
    Map: typeof Map;
  }
}
