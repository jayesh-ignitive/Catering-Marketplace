import type { MetadataRoute } from "next";
import { seoConfig } from "@/lib/seo";

/** Public marketing & catalog URLs only — excludes /admin and /workspace. */
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

export default function sitemap(): MetadataRoute.Sitemap {
  const base = seoConfig.baseUrl.replace(/\/$/, "");
  const lastModified = new Date();

  return publicPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path === "" || path === "/caterers" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/caterers" ? 0.9 : 0.6,
  }));
}
