import type { Metadata } from "next";
import { publicSiteConfig } from "@/lib/site-config";

export const seoConfig = {
  siteName: publicSiteConfig.siteName,
  defaultTitle: `${publicSiteConfig.siteName} - India's Trusted Catering Directory`,
  titleTemplate: `%s | ${publicSiteConfig.siteName}`,
  description: publicSiteConfig.defaultSeoDescription,
  baseUrl: publicSiteConfig.siteUrl,
  defaultOgImage: publicSiteConfig.defaultOgImage,
};

export function buildPageMetadata({
  title,
  description,
  index = true,
  follow = true,
}: {
  title: string;
  description: string;
  index?: boolean;
  follow?: boolean;
}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: seoConfig.siteName,
      url: seoConfig.baseUrl,
      images: [{ url: seoConfig.defaultOgImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [seoConfig.defaultOgImage],
    },
    robots: { index, follow },
  };
}

export const routeSeo = {
  blog: buildPageMetadata({
    title: "Insights",
    description: "Catering guides, trends, and planning tips from Bharat Catering.",
  }),
  caterers: buildPageMetadata({
    title: "Browse caterers",
    description:
      "Discover Bharat Catering partners for weddings, corporates, and celebrations. Filter by city, service type, and budget.",
  }),
  verifyEmail: buildPageMetadata({
    title: "Verify email",
    description: "Confirm your email to activate your catering account.",
  }),
  login: buildPageMetadata({
    title: "Log in",
    description: "Sign in to your Bharat Catering caterer account.",
  }),
  verifyOtp: buildPageMetadata({
    title: "Enter verification code",
    description: "Confirm your email with the 6-digit code we sent you.",
  }),
  packages: buildPageMetadata({
    title: "Catering listing packages",
    description:
      "Compare Bharat Catering directory plans for kitchens and catering brands - visibility, profile depth, and lead features.",
  }),
  register: buildPageMetadata({
    title: "Register",
    description: "Create your Bharat Catering caterer account and list your business.",
  }),
  workspace: {
    title: { default: "Workspace", template: "%s · My business" },
    description: "Manage your catering business profile, gallery, and listings.",
    robots: { index: false, follow: false },
  } satisfies Metadata,
} as const;
