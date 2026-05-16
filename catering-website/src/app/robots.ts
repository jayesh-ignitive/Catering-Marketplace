import type { MetadataRoute } from "next";
import { seoConfig, seoDisallowedPaths } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...seoDisallowedPaths],
    },
    sitemap: `${seoConfig.baseUrl}/sitemap.xml`,
  };
}
