import { publicSiteConfig } from "@/lib/site-config";

export function getCateringApiBase(): string {
  return publicSiteConfig.cateringApiUrl.replace(/\/$/, "");
}

export type City = { id: string; name: string; slug: string };
export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
};
export type TrustStats = {
  verifiedReviews: number;
  cateringServicesListed: number;
  researchArticles: number;
  customersHelped: number;
};
export type CatererListing = {
  id: string;
  name: string;
  cityId: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  priceHint: string;
  specialties: string[];
};
export type SearchResponse = {
  caterers: CatererListing[];
  city?: City;
  category?: ServiceCategory;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const fetchOpts: RequestInit = { cache: "no-store" };

export async function fetchCities(): Promise<City[]> {
  const res = await fetch(`${getCateringApiBase()}/api/catalog/cities`, fetchOpts);
  return parseJson<City[]>(res);
}

export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/service-categories`,
    fetchOpts
  );
  return parseJson<ServiceCategory[]>(res);
}

export async function fetchTrustStats(): Promise<TrustStats> {
  const base = getCateringApiBase();
  const [catalogRes, mRes] = await Promise.all([
    fetch(`${base}/api/catalog/stats`, fetchOpts),
    fetch(`${base}/api/marketplace/stats`, fetchOpts).catch(() => null),
  ]);
  const catalog = await parseJson<TrustStats>(catalogRes);
  if (mRes?.ok) {
    const m = (await mRes.json()) as { caterersListed?: number };
    if (typeof m.caterersListed === "number") {
      return { ...catalog, cateringServicesListed: m.caterersListed };
    }
  }
  return catalog;
}

export type MarketplaceCategoryRef = { code: string; name: string };

export type MarketplaceKeywordRef = { slug: string; label: string };

export type MarketplaceListItem = {
  profileSlug: string;
  tenantId: string;
  businessName: string;
  city: string | null;
  state: string | null;
  country: string | null;
  streetAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  primaryCategoryId: string | null;
  primaryCategoryName: string | null;
  categories: MarketplaceCategoryRef[];
  cuisines: string[];
  keywords: MarketplaceKeywordRef[];
  priceBand: string | null;
  /** Indicative minimum price per guest (INR), from DB `price_from`. */
  priceFrom: number | null;
  tagline: string | null;
  avgRating: number;
  reviewCount: number;
  heroImageUrl: string | null;
  yearsInBusiness: number | null;
  capacityGuestMin: number | null;
  capacityGuestMax: number | null;
};

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inGuestCount = new Intl.NumberFormat("en-IN");

/** Human line for marketplace cards / detail (INR per guest). */
export function formatMarketplacePriceFromInr(priceFrom: number | null | undefined): string | null {
  if (priceFrom == null || !Number.isFinite(priceFrom)) {
    return null;
  }
  return `From ${inrWhole.format(priceFrom)} / guest`;
}

export function formatMarketplaceCapacityRange(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  if (min != null && max != null) {
    return `${inGuestCount.format(min)}–${inGuestCount.format(max)} guests`;
  }
  if (min != null) {
    return `${inGuestCount.format(min)}+ guests`;
  }
  if (max != null) {
    return `Up to ${inGuestCount.format(max)} guests`;
  }
  return null;
}

export type CatererReviewView = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string;
};

export type MarketplaceDetail = MarketplaceListItem & {
  about: string | null;
  galleryImages: string[];
  servicesOffered: string[];
  subdomain: string | null;
  reviews: CatererReviewView[];
};

export type WorkspaceCompletionStatus = {
  isComplete: boolean;
  missingFields: string[];
};

export type CatererWorkspaceProfile = {
  cityId: string | null;
  streetAddress: string | null;
  tagline: string | null;
  about: string | null;
  heroImageUrl: string | null;
  priceBand: "budget" | "mid" | "premium" | "custom" | null;
  priceFrom: number | null;
  yearsInBusiness: number | null;
  capacityGuestMin: number | null;
  capacityGuestMax: number | null;
  categoryCodes: string[];
  serviceOfferingIds: string[];
  keywords: string[];
  galleryImageUrls: string[];
  published: boolean;
  completion: WorkspaceCompletionStatus;
};

export type MarketplaceListResponse = {
  items: MarketplaceListItem[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchMarketplaceCities(): Promise<{ city: string }[]> {
  const res = await fetch(`${getCateringApiBase()}/api/marketplace/caterers/cities`, fetchOpts);
  return parseJson<{ city: string }[]>(res);
}

export async function fetchMarketplaceCitiesForWorkspace(): Promise<{ id: string; name: string }[]> {
  const res = await fetch(`${getCateringApiBase()}/api/marketplace/cities`, fetchOpts);
  return parseJson<{ id: string; name: string }[]>(res);
}

/** Distinct keywords used on published caterer profiles (browse list for workspace picker). */
export async function fetchPublishedKeywordCatalog(): Promise<MarketplaceKeywordRef[]> {
  const res = await fetch(
    `${getCateringApiBase()}/api/marketplace/caterers/keywords`,
    fetchOpts
  );
  return parseJson<MarketplaceKeywordRef[]>(res);
}

export async function fetchMarketplaceKeywordSuggestions(term: string): Promise<MarketplaceKeywordRef[]> {
  const t = term.trim();
  if (t.length < 1) {
    return [];
  }
  const sp = new URLSearchParams({ q: t.slice(0, 80) });
  const res = await fetch(
    `${getCateringApiBase()}/api/marketplace/caterers/keywords/suggest?${sp.toString()}`,
    fetchOpts
  );
  return parseJson<MarketplaceKeywordRef[]>(res);
}

export async function fetchMarketplaceCaterers(params: {
  q?: string;
  city?: string;
  categoryId?: string;
  priceBand?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<MarketplaceListResponse> {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.city?.trim()) sp.set("city", params.city.trim());
  if (params.categoryId?.trim()) sp.set("categoryId", params.categoryId.trim());
  if (params.priceBand?.trim()) sp.set("priceBand", params.priceBand.trim());
  if (params.keyword?.trim()) sp.set("keyword", params.keyword.trim().toLowerCase());
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const res = await fetch(
    `${getCateringApiBase()}/api/marketplace/caterers${q ? `?${q}` : ""}`,
    fetchOpts
  );
  return parseJson<MarketplaceListResponse>(res);
}

export async function fetchMarketplaceCaterer(slug: string): Promise<MarketplaceDetail> {
  const res = await fetch(
    `${getCateringApiBase()}/api/marketplace/caterers/${encodeURIComponent(slug)}`,
    fetchOpts
  );
  if (!res.ok) {
    throw new Error(res.status === 404 ? "not_found" : `API error ${res.status}`);
  }
  const data = await parseJson<MarketplaceDetail>(res);
  if (!Array.isArray(data.reviews)) {
    return { ...data, reviews: [] };
  }
  return data;
}

export async function fetchServiceOfferings(): Promise<{ id: string; name: string }[]> {
  const res = await fetch(`${getCateringApiBase()}/api/marketplace/service-offerings`, fetchOpts);
  return parseJson<{ id: string; name: string }[]>(res);
}

export async function fetchWorkspaceCatererProfile(accessToken: string): Promise<CatererWorkspaceProfile> {
  const res = await fetch(`${getCateringApiBase()}/api/marketplace/caterer/profile`, {
    ...fetchOpts,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseJson<CatererWorkspaceProfile>(res);
}

function formatUploadImageError(data: unknown, status: number): string {
  if (data && typeof data === "object" && "message" in data) {
    const msg = (data as { message?: string | string[] }).message;
    if (Array.isArray(msg) && msg.length > 0) return String(msg[0]);
    if (typeof msg === "string") return msg;
  }
  return `Could not upload image (${status})`;
}

/** Multipart field name `file`. Returns public URL under API `/uploads/…` (requires caterer or admin JWT). */
export async function uploadCateringImage(
  accessToken: string,
  file: File
): Promise<{ url: string; key: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${getCateringApiBase()}/api/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: fd,
    cache: "no-store",
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatUploadImageError(data, res.status));
  }
  if (!data || typeof data !== "object" || typeof (data as { url?: unknown }).url !== "string") {
    throw new Error("Invalid upload response");
  }
  const o = data as { url: string; key?: string };
  return { url: o.url, key: typeof o.key === "string" ? o.key : "" };
}

function formatWorkspaceProfileSaveError(data: unknown, status: number): string {
  if (data && typeof data === "object" && "message" in data) {
    const msg = (data as { message?: string | string[] }).message;
    if (Array.isArray(msg) && msg.length > 0) return String(msg[0]);
    if (typeof msg === "string") return msg;
  }
  return `Could not save workspace profile (${status})`;
}

/** Align `ABOUT_MIN_LEN` on the workspace wizard with backend `WORKSPACE_ABOUT_MIN_LEN`. */
export type PatchWorkspaceProfileStep0Body = {
  cityId: string;
  about: string;
  streetAddress?: string;
  tagline?: string;
  heroImageUrl?: string;
  priceBand?: "budget" | "mid" | "premium" | "custom";
  priceFrom?: number;
  yearsInBusiness?: number;
  capacityGuestMin?: number;
  capacityGuestMax?: number;
};

export type PatchWorkspaceProfileStep1Body = {
  categoryCodes: string[];
  serviceOfferingIds: string[];
  keywords: string[];
  priceBand?: "budget" | "mid" | "premium" | "custom";
  priceFrom?: number;
  yearsInBusiness?: number;
  capacityGuestMin?: number;
  capacityGuestMax?: number;
};

export type PatchWorkspaceProfileStep2Body = {
  galleryImageUrls: string[];
  heroImageUrl?: string;
};

export async function patchWorkspaceCatererProfileStep(
  accessToken: string,
  step: 0 | 1 | 2,
  body: PatchWorkspaceProfileStep0Body | PatchWorkspaceProfileStep1Body | PatchWorkspaceProfileStep2Body
): Promise<CatererWorkspaceProfile> {
  const res = await fetch(`${getCateringApiBase()}/api/marketplace/caterer/profile/step/${step}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    ...fetchOpts,
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatWorkspaceProfileSaveError(data, res.status));
  }
  return data as CatererWorkspaceProfile;
}

export async function publishWorkspaceCatererProfile(accessToken: string): Promise<CatererWorkspaceProfile> {
  const res = await fetch(`${getCateringApiBase()}/api/marketplace/caterer/profile/step/3`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: "{}",
    ...fetchOpts,
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatWorkspaceProfileSaveError(data, res.status));
  }
  return data as CatererWorkspaceProfile;
}

export async function updateWorkspaceCatererProfile(
  accessToken: string,
  body: {
    cityId: string;
    streetAddress?: string;
    tagline?: string;
    about: string;
    heroImageUrl?: string;
    priceBand?: "budget" | "mid" | "premium" | "custom";
    priceFrom?: number;
    yearsInBusiness?: number;
    capacityGuestMin?: number;
    capacityGuestMax?: number;
    categoryCodes: string[];
    serviceOfferingIds: string[];
    keywords: string[];
    galleryImageUrls: string[];
  }
): Promise<CatererWorkspaceProfile> {
  const res = await fetch(`${getCateringApiBase()}/api/marketplace/caterer/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    ...fetchOpts,
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatWorkspaceProfileSaveError(data, res.status));
  }
  return data as CatererWorkspaceProfile;
}

function formatPostReviewError(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const msg = o.message;
    if (Array.isArray(msg) && msg.length > 0) return String(msg[0]);
    if (typeof msg === "string") return msg;
  }
  return `Could not submit review (${status})`;
}

export async function postCatererReview(
  slug: string,
  body: { authorName: string; rating: number; title?: string; comment: string }
): Promise<{ review: CatererReviewView; avgRating: number; reviewCount: number }> {
  const res = await fetch(
    `${getCateringApiBase()}/api/marketplace/caterers/${encodeURIComponent(slug)}/reviews`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      ...fetchOpts,
    }
  );
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatPostReviewError(data, res.status));
  }
  return data as { review: CatererReviewView; avgRating: number; reviewCount: number };
}

export async function searchCaterers(
  cityId?: string,
  categoryId?: string
): Promise<SearchResponse> {
  const sp = new URLSearchParams();
  if (cityId?.trim()) sp.set("cityId", cityId.trim());
  if (categoryId?.trim()) sp.set("categoryId", categoryId.trim());
  const q = sp.toString();
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/search${q ? `?${q}` : ""}`,
    fetchOpts
  );
  return parseJson<SearchResponse>(res);
}

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  featuredImageUrl: string | null;
  publishedAt: string;
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
    fetchOpts
  );
  return parseJson<BlogListResponse>(res);
}

export async function fetchBlogPost(slug: string): Promise<BlogPostDetail> {
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/blog/${encodeURIComponent(slug)}`,
    fetchOpts
  );
  if (res.status === 404) {
    throw new Error("not_found");
  }
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<BlogPostDetail>(res);
}

function formatContactApiError(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const msg = o.message;
    if (Array.isArray(msg) && msg.length > 0) return String(msg[0]);
    if (typeof msg === "string") return msg;
  }
  return `Could not send message (${status})`;
}

export async function postContact(body: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${getCateringApiBase()}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...fetchOpts,
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatContactApiError(data, res.status));
  }
  return data as { id: string };
}
