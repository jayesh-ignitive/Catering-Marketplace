declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

/** Known Maps JS API console error codes — see Google Maps error messages docs. */
const MAPS_ERROR_CODES = [
  "ApiTargetBlockedMapError",
  "RefererNotAllowedMapError",
  "InvalidKeyMapError",
  "MissingKeyMapError",
  "ApiNotActivatedMapError",
  "BillingNotEnabledMapError",
] as const;

export type GoogleMapsErrorCode = (typeof MAPS_ERROR_CODES)[number];

function parseMapsErrorCode(message: string): GoogleMapsErrorCode | null {
  for (const code of MAPS_ERROR_CODES) {
    if (message.includes(code)) return code;
  }
  return null;
}

type Listener = (code: GoogleMapsErrorCode) => void;
const listeners = new Set<Listener>();

export function subscribeGoogleMapsErrors(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(code: GoogleMapsErrorCode) {
  for (const listener of listeners) {
    listener(code);
  }
}

let installed = false;

/** Listen for global Google Maps auth / API restriction failures. */
export function installGoogleMapsErrorListeners(): void {
  if (typeof window === "undefined" || installed) return;
  installed = true;

  const prevAuthFailure = window.gm_authFailure;
  window.gm_authFailure = () => {
    prevAuthFailure?.();
    notify("InvalidKeyMapError");
  };

  window.addEventListener("error", (event) => {
    const msg = event.message ?? "";
    const code = parseMapsErrorCode(msg);
    if (code) notify(code);
  });
}

export function mapsErrorUserMessage(
  code: GoogleMapsErrorCode,
  messages: {
    apiTargetBlocked: string;
    refererNotAllowed: string;
    invalidKey: string;
    apiNotActivated: string;
    billing: string;
    generic: string;
  }
): string {
  switch (code) {
    case "ApiTargetBlockedMapError":
      return messages.apiTargetBlocked;
    case "RefererNotAllowedMapError":
      return messages.refererNotAllowed;
    case "InvalidKeyMapError":
    case "MissingKeyMapError":
      return messages.invalidKey;
    case "ApiNotActivatedMapError":
      return messages.apiNotActivated;
    case "BillingNotEnabledMapError":
      return messages.billing;
    default:
      return messages.generic;
  }
}
