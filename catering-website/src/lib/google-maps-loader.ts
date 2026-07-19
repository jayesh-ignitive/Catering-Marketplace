import { installGoogleMapsErrorListeners } from "@/lib/google-maps-errors";

/** Default map center (India) when no coordinates are stored yet. */
export const INDIA_MAP_CENTER = { lat: 20.5937, lng: 78.9629 } as const;

declare global {
  interface Window {
    __googleMapsInit?: () => void;
  }
}

let loadPromise: Promise<typeof google> | null = null;

export function isGoogleMapsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
}

function isMapsBootstrapReady(): boolean {
  return Boolean(window.google?.maps?.importLibrary);
}

/** Load Maps JavaScript API bootstrap (client-only). Places loads via importLibrary("places"). */
export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }
  if (isMapsBootstrapReady()) {
    return Promise.resolve(window.google);
  }
  if (loadPromise) return loadPromise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
  }

  installGoogleMapsErrorListeners();

  loadPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (isMapsBootstrapReady()) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps bootstrap failed to initialize"));
      }
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="true"]'
    );
    if (existing) {
      if (isMapsBootstrapReady()) {
        finish();
        return;
      }
      window.__googleMapsInit = finish;
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    window.__googleMapsInit = () => {
      delete window.__googleMapsInit;
      finish();
    };

    const script = document.createElement("script");
    script.dataset.googleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=__googleMapsInit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window.__googleMapsInit;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
