export type DeviceGeolocationErrorCode = "unsupported" | "denied" | "unavailable" | "timeout";

export type GeolocationPermissionState = "granted" | "prompt" | "denied" | "unknown";

/** `denied` is a permanent block. `prompt` means the browser can still ask on the next click. */
export async function queryGeolocationPermission(): Promise<GeolocationPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown";
  }
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state === "granted" || status.state === "prompt" || status.state === "denied") {
      return status.state;
    }
  } catch {
    return "unknown";
  }
  return "unknown";
}

export type DeviceGeolocationResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; code: DeviceGeolocationErrorCode };

/** Browser geolocation wrapper for onboarding map pin placement. */
export function readDeviceGeolocation(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  }
): Promise<DeviceGeolocationResult> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, code: "unsupported" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ ok: false, code: "denied" });
          return;
        }
        if (error.code === error.TIMEOUT) {
          resolve({ ok: false, code: "timeout" });
          return;
        }
        resolve({ ok: false, code: "unavailable" });
      },
      options
    );
  });
}

export function isDeviceGeolocationSupported(): boolean {
  return typeof window !== "undefined" && "geolocation" in navigator;
}
