import { getCateringApiBase } from "@/lib/catering-api";

export const BLOG_QUERY_KEY = ["catalog", "blog"] as const;
export const BLOG_STALE_MS = 5 * 60 * 1000;

export type BlogPostSeo = {
  title: string;
  description: string;
  ogImageUrl: string | null;
};

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  featuredImageUrl: string | null;
  publishedAt: string;
  seo: BlogPostSeo;
};

export type BlogPostDetail = BlogPostSummary & {
  bodyHtml: string;
};

export type BlogListResponse = {
  items: BlogPostSummary[];
  total: number;
  page: number;
  limit: number;
};

export type BlogSlugEntry = {
  slug: string;
  updatedAt: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchBlogPosts(params?: {
  page?: number;
  limit?: number;
}): Promise<BlogListResponse> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/blog${q ? `?${q}` : ""}`,
    { cache: "no-store" },
  );
  return parseJson<BlogListResponse>(res);
}

export async function fetchBlogPost(slug: string): Promise<BlogPostDetail> {
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/blog/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) {
    throw new Error("not_found");
  }
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<BlogPostDetail>(res);
}

/** Server-side fetch with Next.js Data Cache (SEO, sitemap). */
export async function fetchBlogPostCached(slug: string): Promise<BlogPostDetail | null> {
  try {
    const res = await fetch(
      `${getCateringApiBase()}/api/catalog/blog/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300, tags: ["catalog-blog", `blog-${slug}`] } },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return parseJson<BlogPostDetail>(res);
  } catch {
    return null;
  }
}

export async function fetchBlogSlugsCached(): Promise<BlogSlugEntry[]> {
  try {
    const res = await fetch(`${getCateringApiBase()}/api/catalog/blog/slugs`, {
      next: { revalidate: 300, tags: ["catalog-blog"] },
    });
    if (!res.ok) return [];
    return parseJson<BlogSlugEntry[]>(res);
  } catch {
    return [];
  }
}

export async function revalidateBlogCache(slug?: string): Promise<void> {
  try {
    await fetch("/api/revalidate/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slug ? { slug } : {}),
    });
  } catch {
    /* non-fatal */
  }
}
