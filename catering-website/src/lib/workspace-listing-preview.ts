import type { AuthUser } from "@/lib/auth-api";
import type { CatererWorkspaceProfile, MarketplaceListItem } from "@/lib/catering-api";

export function buildWorkspaceListingPreview(
  user: AuthUser,
  profile: CatererWorkspaceProfile,
  cityName: string | null,
  categoryNames: string[],
): MarketplaceListItem {
  const slug = user.tenant?.slug?.trim().toLowerCase() || "your-listing";
  const businessName = (
    user.tenant?.name ??
    user.businessName ??
    "Your catering business"
  ).trim();

  const cuisines =
    categoryNames.length > 0
      ? categoryNames
      : profile.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 3);

  return {
    profileSlug: slug,
    tenantId: user.tenant?.id ?? "preview",
    businessName,
    city: cityName,
    state: profile.state,
    country: profile.country,
    streetAddress: profile.streetAddress,
    pincode: profile.pincode,
    formattedAddress: profile.formattedAddress,
    latitude: profile.latitude,
    longitude: profile.longitude,
    primaryCategoryId: null,
    primaryCategoryName: categoryNames[0] ?? null,
    categories: profile.categoryCodes.map((code, i) => ({
      code,
      name: categoryNames[i] ?? code,
    })),
    cuisines,
    keywords: profile.keywords.map((k) => ({ slug: k, label: k })),
    priceBand: profile.priceBand,
    priceFrom: profile.priceFrom,
    tagline: profile.tagline,
    about: profile.about,
    avgRating: 0,
    reviewCount: 0,
    heroImageUrl: profile.heroImageUrl,
    yearsInBusiness: profile.yearsInBusiness,
    capacityGuestMin: profile.capacityGuestMin,
    capacityGuestMax: profile.capacityGuestMax,
  };
}
