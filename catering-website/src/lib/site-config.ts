function readPublicEnv(key: string, fallback: string): string {
  const v = process.env[key];
  if (typeof v === "string" && v.trim() !== "") return v.trim();
  return fallback;
}

/** Values from NEXT_PUBLIC_* (inlined at build). Shared by server and client components. */
export const publicSiteConfig = {
  cateringApiUrl: readPublicEnv("NEXT_PUBLIC_CATERING_API_URL", "http://localhost:4000"),
  siteUrl: readPublicEnv("NEXT_PUBLIC_SITE_URL", "https://bharatcaterers.com"),
  siteName: readPublicEnv("NEXT_PUBLIC_SITE_NAME", "Bharat Caterers"),
  defaultSeoDescription: readPublicEnv(
    "NEXT_PUBLIC_SEO_DESCRIPTION",
    "Find the best catering service providers near you. India's trusted catering directory with 10,000+ happy customers.",
  ),
  contactEmail: readPublicEnv("NEXT_PUBLIC_CONTACT_EMAIL", "hello@bharatcaterers.in"),
  supportPhoneDisplay: readPublicEnv("NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY", "+91 0123456789"),
  supportPhoneTel: readPublicEnv("NEXT_PUBLIC_SUPPORT_PHONE_TEL", "+910123456789"),
  packagesReferenceUrl: readPublicEnv(
    "NEXT_PUBLIC_PACKAGES_REFERENCE_URL",
    "https://www.cateringcorner.in/packages",
  ),
  /** Path or absolute URL for default Open Graph / Twitter image */
  defaultOgImage: readPublicEnv("NEXT_PUBLIC_OG_IMAGE_PATH", "/favicon.svg"),
} as const;
