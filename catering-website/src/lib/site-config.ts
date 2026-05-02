/** Must use literal `process.env.NEXT_PUBLIC_*` so Next can inline values for the client bundle at build time. */

function trimOrFallback(value: string | undefined, fallback: string): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return fallback;
}

/** Values from NEXT_PUBLIC_* (inlined at build for client). Shared by server and client components. */
export const publicSiteConfig = {
  cateringApiUrl: trimOrFallback(process.env.NEXT_PUBLIC_CATERING_API_URL, "http://localhost:4000"),
  siteUrl: trimOrFallback(process.env.NEXT_PUBLIC_SITE_URL, "https://bharatcaterers.com"),
  siteName: trimOrFallback(process.env.NEXT_PUBLIC_SITE_NAME, "Bharat Caterers"),
  defaultSeoDescription: trimOrFallback(
    process.env.NEXT_PUBLIC_SEO_DESCRIPTION,
    "Find the best catering service providers near you. India's trusted catering directory with 10,000+ happy customers.",
  ),
  contactEmail: trimOrFallback(process.env.NEXT_PUBLIC_CONTACT_EMAIL, "hello@bharatcaterers.in"),
  supportPhoneDisplay: trimOrFallback(
    process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY,
    "+91 0123456789",
  ),
  supportPhoneTel: trimOrFallback(process.env.NEXT_PUBLIC_SUPPORT_PHONE_TEL, "+910123456789"),
  packagesReferenceUrl: trimOrFallback(
    process.env.NEXT_PUBLIC_PACKAGES_REFERENCE_URL,
    "https://www.cateringcorner.in/packages",
  ),
  /** Path or absolute URL for default Open Graph / Twitter image */
  defaultOgImage: trimOrFallback(process.env.NEXT_PUBLIC_OG_IMAGE_PATH, "/favicon.svg"),
} as const;
