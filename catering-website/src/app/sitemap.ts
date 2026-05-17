import type { MetadataRoute } from "next";
import { fetchBlogSlugsCached } from "@/lib/blog";
import { seoConfig } from "@/lib/seo";

const publicPaths = [
  "",
  "/caterers",
  "/blog",
  "/contact",
  "/packages",
  "/privacy",
  "/terms",
  "/login",
  "/register",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = seoConfig.baseUrl.replace(/\/$/, "");
  const staticEntries: MetadataRoute.Sitemap = publicPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/caterers" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/caterers" ? 0.9 : 0.6,
  }));

  const slugs = await fetchBlogSlugsCached();
  const blogEntries: MetadataRoute.Sitemap = slugs.map((entry) => ({
    url: `${base}/blog/${encodeURIComponent(entry.slug)}`,
    lastModified: new Date(entry.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.55,
  }));

  return [...staticEntries, ...blogEntries];
}
