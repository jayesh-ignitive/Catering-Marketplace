import type { PatchWorkspaceProfileAddressBody } from "@/lib/catering-api";

/** All address fields the workspace wizard keeps in sync with the map + API. */
export type WorkspaceAddressFields = {
  latitude: number;
  longitude: number;
  addressLine1: string;
  addressLine2: string;
  cityName: string;
  state: string;
  country: string;
  pincode: string;
  cityId: string;
};

export function buildWorkspaceAddressPersistBody(
  input: Pick<
    WorkspaceAddressFields,
    | "latitude"
    | "longitude"
    | "addressLine1"
    | "addressLine2"
    | "cityName"
    | "state"
    | "country"
    | "pincode"
    | "cityId"
  >
): PatchWorkspaceProfileAddressBody {
  const pinTrimmed = input.pincode.replace(/\D/g, "").slice(0, 6);
  const body: PatchWorkspaceProfileAddressBody = {
    latitude: input.latitude,
    longitude: input.longitude,
    addressLine1: input.addressLine1.trim() || "",
    addressLine2: input.addressLine2.trim() || "",
    cityName: input.cityName.trim() || "",
    state: input.state.trim() || "",
    country: input.country.trim() || "",
    pincode: pinTrimmed.length === 6 ? pinTrimmed : "",
  };
  const cityTrimmed = input.cityId.trim();
  if (cityTrimmed) body.cityId = cityTrimmed;
  return body;
}
