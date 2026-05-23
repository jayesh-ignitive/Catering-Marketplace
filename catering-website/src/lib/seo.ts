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

/** Admin, workspace, and other authenticated areas — keep out of search indexes. */
export const privateAreaRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
    "max-video-preview": -1,
    "max-image-preview": "none",
    "max-snippet": -1,
  },
};

export function buildBlogPostMetadata(post: {
  slug: string;
  seo: { title: string; description: string; ogImageUrl: string | null };
}): Metadata {
  const title = post.seo.title;
  const description = post.seo.description;
  const url = `${seoConfig.baseUrl.replace(/\/$/, "")}/blog/${encodeURIComponent(post.slug)}`;
  const image = post.seo.ogImageUrl ?? seoConfig.defaultOgImage;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "article",
      siteName: seoConfig.siteName,
      url,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

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
    description: "Catering guides, trends, and planning tips from Bharat Cater Hub.",
  }),
  caterers: buildPageMetadata({
    title: "Browse caterers",
    description:
      "Discover Bharat Cater Hub partners for weddings, corporates, and celebrations. Filter by city, service type, and budget.",
  }),
  verifyEmail: buildPageMetadata({
    title: "Verify email",
    description: "Confirm your email to activate your catering account.",
  }),
  login: buildPageMetadata({
    title: "Log in",
    description: "Sign in to your Bharat Cater Hub caterer account.",
  }),
  verifyOtp: buildPageMetadata({
    title: "Enter verification code",
    description: "Confirm your email with the 6-digit code we sent you.",
  }),
  packages: buildPageMetadata({
    title: "Catering listing packages",
    description:
      "Compare Bharat Cater Hub directory plans for kitchens and catering brands - visibility, profile depth, and lead features.",
  }),
  register: buildPageMetadata({
    title: "Register",
    description: "Create your Bharat Cater Hub caterer account and list your business.",
  }),
  workspace: {
    title: { default: "Workspace", template: "%s · My business" },
    description: "Manage your catering business profile, gallery, and listings.",
    robots: privateAreaRobots,
  } satisfies Metadata,
} as const;

/** Paths that must not appear in robots.txt sitemap or search crawlers. */
export const seoDisallowedPaths = ["/admin", "/workspace", "/api"] as const;
