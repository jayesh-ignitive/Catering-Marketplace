import { publicSiteConfig } from "@/lib/site-config";

export function getCateringApiBase(): string {
  return publicSiteConfig.cateringApiUrl.replace(/\/$/, "");
}

/** Public CDN origin for R2 keys — matches `S3_PUBLIC_BASE_URL` on the API when using R2. */
export function getCateringImageCdnBase(): string | null {
  const fromBase = process.env.NEXT_PUBLIC_IMAGE_CDN_BASE_URL?.trim();
  if (fromBase) {
    const b = fromBase.replace(/\/$/, "");
    return b.includes("://") ? b : `https://${b.replace(/^\/+/, "")}`;
  }
  const hostList = process.env.NEXT_PUBLIC_IMAGE_CDN_HOSTNAME?.trim();
  if (!hostList) return null;
  const host = hostList.split(",")[0]!.trim();
  if (!host) return null;
  return host.includes("://") ? host.replace(/\/$/, "") : `https://${host.replace(/^\/+/, "")}`;
}

/**
 * Browser-ready URL for banner/gallery values from upload (`key`) or profile API (absolute URL).
 * Mirrors backend `ImagePublicUrlService.resolveToPublicUrl`.
 */
export function resolveCateringImageDisplayUrl(stored: string): string {
  const t = stored.trim();
  if (!t) return "";
  if (t.startsWith("data:")) return t;
  if (/^https?:\/\//i.test(t)) return t;

  const key = t.replace(/^\/+/, "");
  const cdnBase = getCateringImageCdnBase();
  if (cdnBase) return `${cdnBase}/${key}`;

  return `${getCateringApiBase()}/uploads/${key}`;
}

/** Prefer API `url` (CDN) for previews; fall back to resolving storage `key`. */
export function cateringImagePreviewUrl(upload: { url: string; key: string }): string {
  const url = upload.url.trim();
  if (url && (/^https?:\/\//i.test(url) || url.startsWith("data:"))) {
    return url;
  }
  return resolveCateringImageDisplayUrl(upload.key || url);
}

export type City = {
  id: string;
  name: string;
  slug: string;
  legacyCatalogId: string | null;
  displayOrder: number;
};

export type MarketplaceCityFilter = {
  /** English canonical name for API `city` filter param. */
  city: string;
  slug: string;
  displayName: string;
};
export type ServiceCategory = {
  /** Stable filter id (`code`, e.g. `c1`). */
  id: string;
  code: string;
  uuid: string;
  name: string;
  slug: string;
  shortDescription: string;
  iconKey: string;
  iconUrl: string | null;
  borderClass: string;
  iconWrapClass: string;
  titleHoverClass: string;
  displayOrder: number;
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

export async function fetchCities(locale: string = "en"): Promise<City[]> {
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/cities?locale=${encodeURIComponent(locale)}`,
    fetchOpts,
  );
  return parseJson<City[]>(res);
}

export async function fetchServiceCategories(
  locale: string = "en",
): Promise<ServiceCategory[]> {
  const res = await fetch(
    `${getCateringApiBase()}/api/catalog/service-categories?locale=${encodeURIComponent(locale)}`,
    fetchOpts,
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
  about: string | null;
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

/** Compact guest range for listing cards (e.g. `150–800`). */
export function formatMarketplaceCapacityShort(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  if (min != null && max != null) {
    return `${inGuestCount.format(min)}–${inGuestCount.format(max)}`;
  }
  if (min != null) {
    return `${inGuestCount.format(min)}+`;
  }
  if (max != null) {
    return `Up to ${inGuestCount.format(max)}`;
  }
  return null;
}

/** Per-plate price chip for listing cards. */
export function formatMarketplacePriceChip(priceFrom: number | null | undefined): string | null {
  if (priceFrom == null || !Number.isFinite(priceFrom)) {
    return null;
  }
  const low = inrWhole.format(priceFrom).replace(/\s/g, "");
  const high = inrWhole.format(Math.round(priceFrom * 2.2)).replace(/\s/g, "");
  return `${low} – ${high}`;
}

export function formatCuisinesChip(cuisines: string[]): string | null {
  if (!cuisines.length) return null;
  if (cuisines.length === 1) return cuisines[0]!;
  if (cuisines.length === 2) return cuisines.join(" & ");
  return "Multi-Cuisine";
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
  approvalStatus: "draft" | "pending_review" | "approved" | "rejected";
  submittedForReviewAt: string | null;
  completion: WorkspaceCompletionStatus;
};

export type MarketplaceListResponse = {
  items: MarketplaceListItem[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchMarketplaceCities(
  locale: string = "en",
): Promise<MarketplaceCityFilter[]> {
  const res = await fetch(
    `${getCateringApiBase()}/api/marketplace/caterers/cities?locale=${encodeURIComponent(locale)}`,
    fetchOpts,
  );
  return parseJson<MarketplaceCityFilter[]>(res);
}

export async function fetchMarketplaceCitiesForWorkspace(
  locale: string = "en",
): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `${getCateringApiBase()}/api/marketplace/cities?locale=${encodeURIComponent(locale)}`,
    fetchOpts,
  );
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
  priceMin?: number;
  priceMax?: number;
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<MarketplaceListResponse> {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.city?.trim()) sp.set("city", params.city.trim());
  if (params.categoryId?.trim()) sp.set("categoryId", params.categoryId.trim());
  if (params.priceBand?.trim()) sp.set("priceBand", params.priceBand.trim());
  if (params.priceMin != null) sp.set("priceMin", String(params.priceMin));
  if (params.priceMax != null) sp.set("priceMax", String(params.priceMax));
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

export type UploadImageProgressHandler = (percent: number) => void;

/** Multipart field name `file`. Query `kind=banner|gallery|home` selects folder under `images/`. Returns `{ url, key }` (`key` is the DB value). */
export async function uploadCateringImage(
  accessToken: string,
  file: File,
  kind: "banner" | "gallery" | "home",
  options?: { onProgress?: UploadImageProgressHandler }
): Promise<{ url: string; key: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const q = new URLSearchParams({ kind });
  const endpoint = `${getCateringApiBase()}/api/upload/image?${q.toString()}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

    xhr.upload.addEventListener("progress", (event) => {
      if (!options?.onProgress) return;
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.min(100, Math.round((event.loaded / event.total) * 100));
        options.onProgress(pct);
      } else {
        options.onProgress(0);
      }
    });

    xhr.addEventListener("load", () => {
      let data: unknown = {};
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        data = {};
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(formatUploadImageError(data, xhr.status)));
        return;
      }
      if (!data || typeof data !== "object" || typeof (data as { url?: unknown }).url !== "string") {
        reject(new Error("Invalid upload response"));
        return;
      }
      const o = data as { url: string; key?: string };
      options?.onProgress?.(100);
      resolve({ url: o.url, key: typeof o.key === "string" ? o.key : "" });
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error while uploading image"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled"));
    });

    xhr.send(fd);
  });
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
  heroImageUrl: string;
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
    heroImageUrl: string;
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

export type {
  BlogListResponse,
  BlogPostDetail,
  BlogPostSeo,
  BlogPostSummary,
} from "@/lib/blog";
export { fetchBlogPost, fetchBlogPosts } from "@/lib/blog";

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
