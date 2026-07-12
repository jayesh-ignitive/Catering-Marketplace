/** Must use literal `process.env.NEXT_PUBLIC_*` so Next can inline values for the client bundle at build time. */

function trimOrFallback(value: string | undefined, fallback: string): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return fallback;
}

/** Values from NEXT_PUBLIC_* (inlined at build for client). Shared by server and client components. */
export const publicSiteConfig = {
  cateringApiUrl: trimOrFallback(process.env.NEXT_PUBLIC_CATERING_API_URL, "http://localhost:4000"),
  siteUrl: trimOrFallback(process.env.NEXT_PUBLIC_SITE_URL, "https://bharatcaterhub.com"),
  siteName: trimOrFallback(process.env.NEXT_PUBLIC_SITE_NAME, "Bharat Cater Hub"),
  defaultSeoDescription: trimOrFallback(
    process.env.NEXT_PUBLIC_SEO_DESCRIPTION,
    "Find the best catering service providers near you. India's trusted catering directory with 10,000+ happy customers.",
  ),
  /** Platform contact — footer, header bar, contact page, legal pages. Override via `.env` (see `.env.example`). */
  contactEmail: trimOrFallback(process.env.NEXT_PUBLIC_CONTACT_EMAIL, "hello@bharatcaterhub.com"),
  supportPhoneDisplay: trimOrFallback(
    process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY,
    "+91 0123456789",
  ),
  supportPhoneTel: trimOrFallback(process.env.NEXT_PUBLIC_SUPPORT_PHONE_TEL, "+910123456789"),
  contactAddressLine1: trimOrFallback(
    process.env.NEXT_PUBLIC_CONTACT_ADDRESS_LINE1,
    "123 Catering Hub, Food Street,",
  ),
  contactAddressLine2: trimOrFallback(
    process.env.NEXT_PUBLIC_CONTACT_ADDRESS_LINE2,
    "Mumbai, Maharashtra 400001",
  ),
  /** Path or absolute URL for default Open Graph / X (Twitter) card image */
  defaultOgImage: trimOrFallback(process.env.NEXT_PUBLIC_OG_IMAGE_PATH, "/favicon.svg"),
  /** Social profile URLs — footer icons. Override via `.env` (see `.env.example`). */
  facebookUrl: trimOrFallback(
    process.env.NEXT_PUBLIC_FACEBOOK_URL,
    "https://www.facebook.com/share/1Ayq9KK91G/?mibextid=wwXIfr",
  ),
  instagramUrl: trimOrFallback(
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    "https://www.instagram.com/bharatcaterhub/",
  ),
} as const;
