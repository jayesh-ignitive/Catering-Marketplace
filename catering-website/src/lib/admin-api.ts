/**
 * Platform admin API client (`/api/admin/*`).
 * Keep separate from `catering-api.ts` (catalog, marketplace, workspace caterer flows).
 */
import { publicSiteConfig } from "@/lib/site-config";

function getAdminApiBase(): string {
  return publicSiteConfig.cateringApiUrl.replace(/\/$/, "");
}

const fetchOpts: RequestInit = { cache: "no-store" };

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function bearer(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

// --- Types -----------------------------------------------------------------

export type AdminDashboardTimelineDay = {
  date: string;
  signups: number;
  inquiries: number;
  reviews: number;
};

export type AdminDashboardOverview = {
  totals: {
    users: number;
    caterers: number;
    admins: number;
    inquiries: number;
    listedCaterers: number;
    reviews: number;
    draftsListed: number;
  };
  recent: {
    usersLast7Days: number;
    inquiriesLast7Days: number;
    reviewsLast7Days: number;
  };
  timeline: {
    days: number;
    rows: AdminDashboardTimelineDay[];
  };
  generatedAt: string;
};

export type AdminContactSortField = "createdAt" | "name" | "email" | "subject" | "solved";
export type AdminContactSortDir = "asc" | "desc";
export type AdminContactStatusFilter = "all" | "open" | "solved";

export type AdminContactListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  messagePreview: string;
  solved: boolean;
  solvedAt: string | null;
  createdAt: string;
};

export type AdminContactDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  solved: boolean;
  solvedAt: string | null;
  createdAt: string;
};

export type AdminContactListResponse = {
  items: AdminContactListItem[];
  total: number;
  page: number;
  limit: number;
  sortBy: AdminContactSortField;
  sortDir: AdminContactSortDir;
};

export type AdminTenantSnapshot = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  dbName: string | null;
  provisionStatus: string;
  profilePublished: boolean;
  profileOptions: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminMarketplaceProfileSnapshot = {
  tenantId: string;
  profileSlug: string;
  published: boolean;
  tagline: string | null;
  aboutPreview: string | null;
  heroImageUrl: string | null;
  avgRating: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserListItem = {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  role: string;
  emailVerified: boolean;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  createdAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  emailVerifiedAt: string | null;
  emailVerificationExpiresAt: string | null;
  hasEmailVerificationLink: boolean;
  hasPendingEmailOtp: boolean;
  updatedAt: string;
  tenant: AdminTenantSnapshot | null;
  ownedTenant: AdminTenantSnapshot | null;
  marketplaceProfile: AdminMarketplaceProfileSnapshot | null;
};

export type AdminUserSortField =
  | "createdAt"
  | "email"
  | "fullName"
  | "role"
  | "tenantSlug"
  | "tenantName"
  | "emailVerified";

export type AdminUserSortDir = "asc" | "desc";

export type AdminUserListResponse = {
  items: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  sortBy: AdminUserSortField;
  sortDir: AdminUserSortDir;
};

/** Labels for toolbar / column headers (must match backend whitelist). */
export const ADMIN_USER_SORT_OPTIONS: { value: AdminUserSortField; label: string }[] = [
  { value: "createdAt", label: "Date joined" },
  { value: "email", label: "Email" },
  { value: "fullName", label: "Full name" },
  { value: "role", label: "Role" },
  { value: "tenantSlug", label: "Workspace slug" },
  { value: "tenantName", label: "Workspace name" },
  { value: "emailVerified", label: "Email verified" },
];

export type CatererMarketplaceApprovalStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected";

export type AdminCatererListItem = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  dbName: string | null;
  provisionStatus: string;
  profilePublished: boolean;
  marketplaceApprovalStatus: CatererMarketplaceApprovalStatus;
  submittedForReviewAt: string | null;
  ownerUserId: string | null;
  ownerEmail: string | null;
  ownerFullName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCatererSortField =
  | "createdAt"
  | "name"
  | "slug"
  | "subdomain"
  | "provisionStatus"
  | "profilePublished"
  | "updatedAt"
  | "ownerEmail"
  | "ownerFullName";

export type AdminCatererSortDir = "asc" | "desc";

export type AdminCatererListResponse = {
  items: AdminCatererListItem[];
  total: number;
  page: number;
  limit: number;
  sortBy: AdminCatererSortField;
  sortDir: AdminCatererSortDir;
};

export type AdminCatererReviewOwner = {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
};

export type AdminCatererReviewDetail = {
  tenantId: string;
  workspaceName: string;
  workspaceSlug: string;
  profileSlug: string;
  subdomain: string | null;
  provisionStatus: string;
  owner: AdminCatererReviewOwner | null;
  published: boolean;
  approvalStatus: CatererMarketplaceApprovalStatus;
  submittedForReviewAt: string | null;
  reviewedAt: string | null;
  completion: { isComplete: boolean; missingFields: string[] };
  business: {
    cityName: string | null;
    streetAddress: string | null;
    tagline: string | null;
    about: string | null;
    yearsInBusiness: number | null;
    capacityGuestMin: number | null;
    capacityGuestMax: number | null;
    priceBand: string | null;
    priceFrom: number | null;
  };
  categories: { code: string; name: string }[];
  serviceOfferings: { id: string; name: string }[];
  keywords: string[];
  portfolio: {
    heroImageUrl: string | null;
    galleryImageUrls: string[];
  };
  profileCreatedAt: string;
  profileUpdatedAt: string;
};

export type AdminLanguageItem = {
  id: string;
  code: string;
  name: string;
  nativeName: string | null;
  direction: "ltr" | "rtl" | string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

export type AdminMenuCategoryTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  description: string | null;
};

export type AdminMenuCategoryItem = {
  id: string;
  parentId: string | null;
  slug: string;
  imageUrl: string | null;
  iconUrl: string | null;
  displayOrder: number;
  categoryType: string | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminMenuCategoryTranslationItem[];
};

export type AdminIngredientCategoryTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
};

export type AdminIngredientCategoryItem = {
  id: string;
  parentId: string | null;
  slug: string;
  imageUrl: string | null;
  iconUrl: string | null;
  displayOrder: number;
  categoryType: string | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminIngredientCategoryTranslationItem[];
};

export type AdminAttributeType =
  | "audience"
  | "beverage_type"
  | "counter_type"
  | "course"
  | "cuisine"
  | "dietary"
  | "event"
  | "food_category"
  | "meal_time"
  | "package_type"
  | "portion"
  | "preparation"
  | "recommendation"
  | "season"
  | "service"
  | "spice"
  | "temperature";

export type AdminAttributeTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
};

export type AdminAttributeItem = {
  id: string;
  type: AdminAttributeType;
  image: string | null;
  isSearchable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminAttributeTranslationItem[];
};

// --- Calls -----------------------------------------------------------------

export async function fetchAdminDashboardOverview(accessToken: string): Promise<AdminDashboardOverview> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/dashboard/overview`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminDashboardOverview>(res);
}

export async function fetchAdminContactInquiriesList(
  accessToken: string,
  params?: {
    page?: number;
    limit?: number;
    q?: string;
    sortBy?: AdminContactSortField;
    sortDir?: AdminContactSortDir;
    status?: AdminContactStatusFilter;
  },
): Promise<AdminContactListResponse> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortDir) sp.set("sortDir", params.sortDir);
  if (params?.status && params.status !== "all") sp.set("status", params.status);
  const q = sp.toString();
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/contact-inquiries${q ? `?${q}` : ""}`,
    { ...fetchOpts, headers: bearer(accessToken) },
  );
  return parseJson<AdminContactListResponse>(res);
}

export async function fetchAdminContactInquiryDetail(
  accessToken: string,
  id: string,
): Promise<AdminContactDetail> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/contact-inquiries/${id}`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminContactDetail>(res);
}

export async function setAdminContactInquiryStatus(
  accessToken: string,
  id: string,
  solved: boolean,
): Promise<AdminContactDetail> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/contact-inquiries/${id}/status`, {
    method: "PATCH",
    ...fetchOpts,
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ solved }),
  });
  return parseJson<AdminContactDetail>(res);
}

export async function fetchAdminUsersList(
  accessToken: string,
  params?: {
    page?: number;
    limit?: number;
    q?: string;
    sortBy?: AdminUserSortField;
    sortDir?: AdminUserSortDir;
  }
): Promise<AdminUserListResponse> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortDir) sp.set("sortDir", params.sortDir);
  const q = sp.toString();
  const res = await fetch(`${getAdminApiBase()}/api/admin/users${q ? `?${q}` : ""}`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminUserListResponse>(res);
}

export async function fetchAdminCaterersList(
  accessToken: string,
  params?: {
    page?: number;
    limit?: number;
    q?: string;
    sortBy?: AdminCatererSortField;
    sortDir?: AdminCatererSortDir;
    approvalStatus?: CatererMarketplaceApprovalStatus;
  }
): Promise<AdminCatererListResponse> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortDir) sp.set("sortDir", params.sortDir);
  if (params?.approvalStatus) sp.set("approvalStatus", params.approvalStatus);
  const q = sp.toString();
  const res = await fetch(`${getAdminApiBase()}/api/admin/caterers${q ? `?${q}` : ""}`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminCatererListResponse>(res);
}

export async function fetchAdminCatererReviewDetail(
  accessToken: string,
  tenantId: string
): Promise<AdminCatererReviewDetail> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/caterers/${encodeURIComponent(tenantId)}/review`,
    {
      ...fetchOpts,
      headers: bearer(accessToken),
    }
  );
  if (res.status === 404) {
    throw new Error("not_found");
  }
  return parseJson<AdminCatererReviewDetail>(res);
}

export async function setAdminCatererMarketplaceApproval(
  accessToken: string,
  tenantId: string,
  decision: "approve" | "reject"
): Promise<void> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/caterers/${encodeURIComponent(tenantId)}/marketplace-approval`,
    {
      method: "PATCH",
      ...fetchOpts,
      headers: {
        ...bearer(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ decision }),
    }
  );
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => ({}));
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
}

export async function fetchAdminUserDetail(accessToken: string, userId: string): Promise<AdminUserDetail> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/users/${encodeURIComponent(userId)}`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  if (!res.ok) {
    throw new Error(res.status === 404 ? "not_found" : `API error ${res.status}`);
  }
  return parseJson<AdminUserDetail>(res);
}

export async function fetchAdminLanguages(accessToken: string): Promise<AdminLanguageItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/languages`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminLanguageItem[]>(res);
}

export async function createAdminLanguage(
  accessToken: string,
  payload: {
    code: string;
    name: string;
    nativeName?: string;
    direction?: "ltr" | "rtl";
    isDefault?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  },
): Promise<AdminLanguageItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/languages`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminLanguageItem>(res);
}

export async function updateAdminLanguage(
  accessToken: string,
  languageId: string,
  payload: Partial<{
    code: string;
    name: string;
    nativeName: string;
    direction: "ltr" | "rtl";
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
  }>,
): Promise<AdminLanguageItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/languages/${encodeURIComponent(languageId)}`, {
    ...fetchOpts,
    method: "PATCH",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminLanguageItem>(res);
}

export async function deleteAdminLanguage(accessToken: string, languageId: string): Promise<{ success: true }> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/languages/${encodeURIComponent(languageId)}`, {
    ...fetchOpts,
    method: "DELETE",
    headers: bearer(accessToken),
  });
  return parseJson<{ success: true }>(res);
}

export type AdminServiceCategoryTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  shortDescription: string;
};

export type AdminServiceCategoryItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  shortDescription: string;
  iconKey: string;
  iconUrl: string | null;
  borderClass: string;
  iconWrapClass: string;
  titleHoverClass: string;
  displayOrder: number;
  isActive: boolean;
  profileLinkCount: number;
  createdAt: string;
  updatedAt: string;
  translations: AdminServiceCategoryTranslationItem[];
};

export async function fetchAdminServiceCategories(
  accessToken: string,
): Promise<AdminServiceCategoryItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/service-categories`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminServiceCategoryItem[]>(res);
}

export async function createAdminServiceCategory(
  accessToken: string,
  payload: {
    code: string;
    englishName: string;
    slug?: string;
    shortDescription: string;
    iconKey?: string;
    iconUrl?: string | null;
    borderClass?: string;
    iconWrapClass?: string;
    titleHoverClass?: string;
    displayOrder?: number;
    isActive?: boolean;
  },
): Promise<AdminServiceCategoryItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/service-categories`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminServiceCategoryItem>(res);
}

export async function updateAdminServiceCategory(
  accessToken: string,
  id: string,
  payload: Partial<{
    code: string;
    slug: string;
    iconKey: string;
    iconUrl: string | null;
    borderClass: string;
    iconWrapClass: string;
    titleHoverClass: string;
    displayOrder: number;
    isActive: boolean;
  }>,
): Promise<AdminServiceCategoryItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/service-categories/${encodeURIComponent(id)}`,
    {
      ...fetchOpts,
      method: "PATCH",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminServiceCategoryItem>(res);
}

// --- Cities -----------------------------------------------------------------

export type AdminCityTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
};

export type AdminStateOption = {
  id: string;
  name: string;
  countryName: string;
};

export type AdminCityItem = {
  id: string;
  slug: string;
  legacyCatalogId: string | null;
  stateId: string;
  stateName: string;
  countryName: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  profileLinkCount: number;
  createdAt: string;
  updatedAt: string;
  translations: AdminCityTranslationItem[];
};

export async function fetchAdminCityStates(
  accessToken: string,
): Promise<AdminStateOption[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/cities/states`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminStateOption[]>(res);
}

export async function fetchAdminCities(accessToken: string): Promise<AdminCityItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/cities`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminCityItem[]>(res);
}

export async function createAdminCity(
  accessToken: string,
  payload: {
    stateId: string;
    englishName: string;
    slug?: string;
    legacyCatalogId?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  },
): Promise<AdminCityItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/cities`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminCityItem>(res);
}

export async function updateAdminCity(
  accessToken: string,
  id: string,
  payload: Partial<{
    stateId: string;
    slug: string;
    legacyCatalogId: string | null;
    displayOrder: number;
    isActive: boolean;
  }>,
): Promise<AdminCityItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/cities/${encodeURIComponent(id)}`, {
    ...fetchOpts,
    method: "PATCH",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminCityItem>(res);
}

export async function deleteAdminCity(
  accessToken: string,
  id: string,
): Promise<{ success: true }> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/cities/${encodeURIComponent(id)}`, {
    ...fetchOpts,
    method: "DELETE",
    headers: bearer(accessToken),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<{ success: true }>(res);
}

export async function upsertAdminCityTranslation(
  accessToken: string,
  cityId: string,
  payload: { languageId: number; name: string },
): Promise<AdminCityItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/cities/${encodeURIComponent(cityId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminCityItem>(res);
}

export async function deleteAdminCityTranslation(
  accessToken: string,
  cityId: string,
  languageId: string,
): Promise<AdminCityItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/cities/${encodeURIComponent(cityId)}/translations/${encodeURIComponent(languageId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminCityItem>(res);
}

export async function deleteAdminServiceCategory(
  accessToken: string,
  id: string,
): Promise<{ success: true }> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/service-categories/${encodeURIComponent(id)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<{ success: true }>(res);
}

export async function upsertAdminServiceCategoryTranslation(
  accessToken: string,
  categoryId: string,
  payload: {
    languageId: number;
    name: string;
    shortDescription: string;
  },
): Promise<AdminServiceCategoryItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/service-categories/${encodeURIComponent(categoryId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminServiceCategoryItem>(res);
}

export async function deleteAdminServiceCategoryTranslation(
  accessToken: string,
  categoryId: string,
  languageId: string,
): Promise<AdminServiceCategoryItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/service-categories/${encodeURIComponent(categoryId)}/translations/${encodeURIComponent(languageId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminServiceCategoryItem>(res);
}

export type AdminHomeBannerItem = {
  id: string;
  placement: "hero" | "stats" | "testimonial";
  title: string | null;
  subtitle: string | null;
  imageKey: string;
  imageUrl: string;
  linkHref: string | null;
  linkLabel: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAdminHomeBanners(
  accessToken: string,
): Promise<AdminHomeBannerItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/home-banners`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminHomeBannerItem[]>(res);
}

export async function createAdminHomeBanner(
  accessToken: string,
  payload: {
    title?: string | null;
    subtitle?: string | null;
    imageKey: string;
    linkHref?: string | null;
    linkLabel?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  },
): Promise<AdminHomeBannerItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/home-banners`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminHomeBannerItem>(res);
}

export async function updateAdminHomeBanner(
  accessToken: string,
  id: string,
  payload: Partial<{
    title: string | null;
    subtitle: string | null;
    imageKey: string;
    linkHref: string | null;
    linkLabel: string | null;
    displayOrder: number;
    isActive: boolean;
  }>,
): Promise<AdminHomeBannerItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/home-banners/${encodeURIComponent(id)}`,
    {
      ...fetchOpts,
      method: "PATCH",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminHomeBannerItem>(res);
}

export async function deleteAdminHomeBanner(
  accessToken: string,
  id: string,
): Promise<{ success: true }> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/home-banners/${encodeURIComponent(id)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<{ success: true }>(res);
}

export type AdminBlogPostItem = {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  excerpt: string;
  metaDescription: string | null;
  bodyHtml: string;
  categoryLabel: string;
  featuredImageUrl: string | null;
  featuredImageResolved: string | null;
  ogImageUrl: string | null;
  ogImageResolved: string | null;
  publishedAt: string;
  isPublished: boolean;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAdminBlogPosts(accessToken: string): Promise<AdminBlogPostItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/blog-posts`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminBlogPostItem[]>(res);
}

export async function createAdminBlogPost(
  accessToken: string,
  payload: {
    title: string;
    slug?: string;
    metaTitle?: string | null;
    excerpt: string;
    metaDescription?: string | null;
    bodyHtml: string;
    categoryLabel?: string;
    featuredImageUrl?: string | null;
    ogImageUrl?: string | null;
    publishedAt: string;
    isPublished?: boolean;
  },
): Promise<AdminBlogPostItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/blog-posts`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminBlogPostItem>(res);
}

export async function updateAdminBlogPost(
  accessToken: string,
  id: string,
  payload: Partial<{
    title: string;
    slug: string;
    metaTitle: string | null;
    excerpt: string;
    metaDescription: string | null;
    bodyHtml: string;
    categoryLabel: string;
    featuredImageUrl: string | null;
    ogImageUrl: string | null;
    publishedAt: string;
    isPublished: boolean;
  }>,
): Promise<AdminBlogPostItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/blog-posts/${encodeURIComponent(id)}`,
    {
      ...fetchOpts,
      method: "PATCH",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<AdminBlogPostItem>(res);
}

export async function deleteAdminBlogPost(
  accessToken: string,
  id: string,
): Promise<{ success: true }> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/blog-posts/${encodeURIComponent(id)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return parseJson<{ success: true }>(res);
}

export async function fetchAdminMenuCategories(accessToken: string): Promise<AdminMenuCategoryItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/menu-categories`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminMenuCategoryItem[]>(res);
}

export async function createAdminMenuCategory(
  accessToken: string,
  payload: {
    parentId?: number;
    slug: string;
    imageUrl?: string;
    displayOrder?: number;
    categoryType?: string;
    isFeatured?: boolean;
    isActive?: boolean;
    englishName: string;
    englishDescription?: string;
    translations?: Array<{
      languageId: number;
      name: string;
      description?: string;
    }>;
  },
): Promise<AdminMenuCategoryItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/menu-categories`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminMenuCategoryItem>(res);
}

export async function updateAdminMenuCategory(
  accessToken: string,
  categoryId: string,
  payload: Partial<{
    parentId: number | null;
    slug: string;
    imageUrl: string | null;
    displayOrder: number;
    categoryType: string | null;
    isFeatured: boolean;
    isActive: boolean;
  }>,
): Promise<AdminMenuCategoryItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/menu-categories/${encodeURIComponent(categoryId)}`, {
    ...fetchOpts,
    method: "PATCH",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminMenuCategoryItem>(res);
}

export async function deleteAdminMenuCategory(
  accessToken: string,
  categoryId: string,
): Promise<{ success: true }> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/menu-categories/${encodeURIComponent(categoryId)}`, {
    ...fetchOpts,
    method: "DELETE",
    headers: bearer(accessToken),
  });
  return parseJson<{ success: true }>(res);
}

export async function upsertAdminMenuCategoryTranslation(
  accessToken: string,
  categoryId: string,
  payload: {
    languageId: number;
    name: string;
    description?: string;
  },
): Promise<AdminMenuCategoryItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/menu-categories/${encodeURIComponent(categoryId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminMenuCategoryItem>(res);
}

export async function deleteAdminMenuCategoryTranslation(
  accessToken: string,
  categoryId: string,
  languageId: string,
): Promise<AdminMenuCategoryItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/menu-categories/${encodeURIComponent(categoryId)}/translations/${encodeURIComponent(languageId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  return parseJson<AdminMenuCategoryItem>(res);
}

export async function fetchAdminIngredientCategories(accessToken: string): Promise<AdminIngredientCategoryItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/ingredient-categories`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminIngredientCategoryItem[]>(res);
}

export async function createAdminIngredientCategory(
  accessToken: string,
  payload: {
    parentId?: number;
    slug: string;
    imageUrl?: string;
    displayOrder?: number;
    categoryType?: string;
    isFeatured?: boolean;
    isActive?: boolean;
    englishName: string;
    translations?: Array<{
      languageId: number;
      name: string;
    }>;
  },
): Promise<AdminIngredientCategoryItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/ingredient-categories`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminIngredientCategoryItem>(res);
}

export async function updateAdminIngredientCategory(
  accessToken: string,
  categoryId: string,
  payload: Partial<{
    parentId: number | null;
    slug: string;
    imageUrl: string | null;
    displayOrder: number;
    categoryType: string | null;
    isFeatured: boolean;
    isActive: boolean;
  }>,
): Promise<AdminIngredientCategoryItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/ingredient-categories/${encodeURIComponent(categoryId)}`, {
    ...fetchOpts,
    method: "PATCH",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminIngredientCategoryItem>(res);
}

export async function deleteAdminIngredientCategory(
  accessToken: string,
  categoryId: string,
): Promise<{ success: true }> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/ingredient-categories/${encodeURIComponent(categoryId)}`, {
    ...fetchOpts,
    method: "DELETE",
    headers: bearer(accessToken),
  });
  return parseJson<{ success: true }>(res);
}

export async function upsertAdminIngredientCategoryTranslation(
  accessToken: string,
  categoryId: string,
  payload: {
    languageId: number;
    name: string;
  },
): Promise<AdminIngredientCategoryItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/ingredient-categories/${encodeURIComponent(categoryId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminIngredientCategoryItem>(res);
}

export async function deleteAdminIngredientCategoryTranslation(
  accessToken: string,
  categoryId: string,
  languageId: string,
): Promise<AdminIngredientCategoryItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/ingredient-categories/${encodeURIComponent(categoryId)}/translations/${encodeURIComponent(languageId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  return parseJson<AdminIngredientCategoryItem>(res);
}

export async function fetchAdminAttributes(accessToken: string): Promise<AdminAttributeItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/attributes`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminAttributeItem[]>(res);
}

export async function createAdminAttribute(
  accessToken: string,
  payload: {
    type: AdminAttributeType;
    image?: string;
    isSearchable?: boolean;
    isActive?: boolean;
    englishName: string;
    translations?: Array<{ languageId: number; name: string }>;
  },
): Promise<AdminAttributeItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/attributes`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminAttributeItem>(res);
}

export async function updateAdminAttribute(
  accessToken: string,
  attributeId: string,
  payload: Partial<{
    type: AdminAttributeType;
    image: string | null;
    isSearchable: boolean;
    isActive: boolean;
  }>,
): Promise<AdminAttributeItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/attributes/${encodeURIComponent(attributeId)}`, {
    ...fetchOpts,
    method: "PATCH",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminAttributeItem>(res);
}

export async function deleteAdminAttribute(
  accessToken: string,
  attributeId: string,
): Promise<{ success: true }> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/attributes/${encodeURIComponent(attributeId)}`, {
    ...fetchOpts,
    method: "DELETE",
    headers: bearer(accessToken),
  });
  return parseJson<{ success: true }>(res);
}

export async function upsertAdminAttributeTranslation(
  accessToken: string,
  attributeId: string,
  payload: { languageId: number; name: string },
): Promise<AdminAttributeItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/attributes/${encodeURIComponent(attributeId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminAttributeItem>(res);
}

export async function deleteAdminAttributeTranslation(
  accessToken: string,
  attributeId: string,
  languageId: string,
): Promise<AdminAttributeItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/attributes/${encodeURIComponent(attributeId)}/translations/${encodeURIComponent(languageId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  return parseJson<AdminAttributeItem>(res);
}

export type AdminIngredientUnit =
  | "KG"
  | "GM"
  | "LTR"
  | "ML"
  | "PCS"
  | "BOX"
  | "PACKET"
  | "BOTTLE"
  | "TRAY";

export type AdminIngredientTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  shortName: string | null;
  description: string | null;
};

export type AdminIngredientItem = {
  id: string;
  ingredientCategoryId: string | null;
  ingredientCategorySlug: string | null;
  ingredientCode: string;
  sku: string | null;
  slug: string;
  image: string | null;
  purchaseUnit: AdminIngredientUnit;
  consumptionUnit: AdminIngredientUnit;
  conversionFactor: number;
  shelfLifeDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminIngredientTranslationItem[];
};

export async function fetchAdminIngredients(accessToken: string): Promise<AdminIngredientItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/ingredients`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminIngredientItem[]>(res);
}

export async function createAdminIngredient(
  accessToken: string,
  payload: {
    ingredientCategoryId?: number;
    ingredientCode?: string;
    sku?: string;
    slug?: string;
    image?: string;
    purchaseUnit?: AdminIngredientUnit;
    consumptionUnit?: AdminIngredientUnit;
    conversionFactor?: number;
    shelfLifeDays?: number | null;
    isActive?: boolean;
    englishName: string;
    englishShortName?: string;
    englishDescription?: string;
    translations?: Array<{
      languageId: number;
      name: string;
      shortName?: string;
      description?: string;
    }>;
  },
): Promise<AdminIngredientItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/ingredients`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminIngredientItem>(res);
}

export async function updateAdminIngredient(
  accessToken: string,
  ingredientId: string,
  payload: Partial<{
    ingredientCategoryId: number | null;
    ingredientCode: string;
    sku: string | null;
    slug: string;
    image: string | null;
    purchaseUnit: AdminIngredientUnit;
    consumptionUnit: AdminIngredientUnit;
    conversionFactor: number;
    shelfLifeDays: number | null;
    isActive: boolean;
  }>,
): Promise<AdminIngredientItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/ingredients/${encodeURIComponent(ingredientId)}`, {
    ...fetchOpts,
    method: "PATCH",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminIngredientItem>(res);
}

export async function deleteAdminIngredient(
  accessToken: string,
  ingredientId: string,
): Promise<{ success: true }> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/ingredients/${encodeURIComponent(ingredientId)}`, {
    ...fetchOpts,
    method: "DELETE",
    headers: bearer(accessToken),
  });
  return parseJson<{ success: true }>(res);
}

export async function upsertAdminIngredientTranslation(
  accessToken: string,
  ingredientId: string,
  payload: {
    languageId: number;
    name: string;
    shortName?: string;
    description?: string;
  },
): Promise<AdminIngredientItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/ingredients/${encodeURIComponent(ingredientId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminIngredientItem>(res);
}

export async function deleteAdminIngredientTranslation(
  accessToken: string,
  ingredientId: string,
  languageId: string,
): Promise<AdminIngredientItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/ingredients/${encodeURIComponent(ingredientId)}/translations/${encodeURIComponent(languageId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  return parseJson<AdminIngredientItem>(res);
}

export type AdminMenuItemTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  description: string | null;
};

export type AdminMenuItemIngredientRow = {
  id: string;
  ingredientId: string;
  ingredientCode: string;
  ingredientSlug: string;
  quantity: number;
  unit: AdminIngredientUnit;
  isOptional: boolean;
  notes: string | null;
};

export type AdminMenuItemAttributeRow = {
  id: string;
  attributeId: string;
  attributeType: AdminAttributeType;
};

export type AdminMenuItemItem = {
  id: string;
  categoryId: string;
  categorySlug: string;
  subcategoryId: string | null;
  subcategorySlug: string | null;
  itemCode: string;
  slug: string;
  image: string | null;
  gallery: string[] | null;
  videoUrl: string | null;
  preparationTime: number;
  cookingTime: number;
  shelfLifeHours: number | null;
  baseCost: number;
  isActive: boolean;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  translations: AdminMenuItemTranslationItem[];
  ingredients: AdminMenuItemIngredientRow[];
  attributes: AdminMenuItemAttributeRow[];
};

export async function fetchAdminMenuItems(accessToken: string): Promise<AdminMenuItemItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/menu-items`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminMenuItemItem[]>(res);
}

export async function fetchAdminMenuItem(
  accessToken: string,
  menuItemId: string,
): Promise<AdminMenuItemItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminMenuItemItem>(res);
}

export async function createAdminMenuItem(
  accessToken: string,
  payload: {
    categoryId: number;
    subcategoryId?: number;
    itemCode?: string;
    slug?: string;
    image?: string;
    gallery?: string[];
    videoUrl?: string;
    preparationTime?: number;
    cookingTime?: number;
    shelfLifeHours?: number | null;
    baseCost?: number;
    isActive?: boolean;
    englishName: string;
    englishDescription?: string;
    translations?: Array<{ languageId: number; name: string; description?: string }>;
    ingredients?: Array<{
      ingredientId: number;
      quantity: number;
      unit?: AdminIngredientUnit;
      isOptional?: boolean;
      notes?: string;
    }>;
    attributeIds?: number[];
  },
): Promise<AdminMenuItemItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/menu-items`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminMenuItemItem>(res);
}

export async function updateAdminMenuItem(
  accessToken: string,
  menuItemId: string,
  payload: Partial<{
    categoryId: number;
    subcategoryId: number | null;
    itemCode: string;
    slug: string;
    image: string | null;
    gallery: string[] | null;
    videoUrl: string | null;
    preparationTime: number;
    cookingTime: number;
    shelfLifeHours: number | null;
    baseCost: number;
    isActive: boolean;
    attributeIds: number[];
    ingredients: Array<{
      ingredientId: number;
      quantity: number;
      unit?: AdminIngredientUnit;
      isOptional?: boolean;
      notes?: string;
    }>;
  }>,
): Promise<AdminMenuItemItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}`, {
    ...fetchOpts,
    method: "PATCH",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminMenuItemItem>(res);
}

export async function deleteAdminMenuItem(
  accessToken: string,
  menuItemId: string,
): Promise<{ success: true }> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}`, {
    ...fetchOpts,
    method: "DELETE",
    headers: bearer(accessToken),
  });
  return parseJson<{ success: true }>(res);
}

export async function upsertAdminMenuItemTranslation(
  accessToken: string,
  menuItemId: string,
  payload: { languageId: number; name: string; description?: string },
): Promise<AdminMenuItemItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminMenuItemItem>(res);
}

export async function deleteAdminMenuItemTranslation(
  accessToken: string,
  menuItemId: string,
  languageId: string,
): Promise<AdminMenuItemItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}/translations/${encodeURIComponent(languageId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  return parseJson<AdminMenuItemItem>(res);
}

export async function addAdminMenuItemIngredient(
  accessToken: string,
  menuItemId: string,
  payload: {
    ingredientId: number;
    quantity: number;
    unit?: AdminIngredientUnit;
    isOptional?: boolean;
    notes?: string;
  },
): Promise<AdminMenuItemItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}/ingredients`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminMenuItemItem>(res);
}

export async function updateAdminMenuItemIngredient(
  accessToken: string,
  menuItemId: string,
  rowId: string,
  payload: Partial<{
    quantity: number;
    unit: AdminIngredientUnit;
    isOptional: boolean;
    notes: string | null;
  }>,
): Promise<AdminMenuItemItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}/ingredients/${encodeURIComponent(rowId)}`,
    {
      ...fetchOpts,
      method: "PATCH",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminMenuItemItem>(res);
}

export async function deleteAdminMenuItemIngredient(
  accessToken: string,
  menuItemId: string,
  rowId: string,
): Promise<AdminMenuItemItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}/ingredients/${encodeURIComponent(rowId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  return parseJson<AdminMenuItemItem>(res);
}

export async function addAdminMenuItemAttribute(
  accessToken: string,
  menuItemId: string,
  payload: { attributeId: number },
): Promise<AdminMenuItemItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}/attributes`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminMenuItemItem>(res);
}

export async function deleteAdminMenuItemAttribute(
  accessToken: string,
  menuItemId: string,
  attributeId: string,
): Promise<AdminMenuItemItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/menu-items/${encodeURIComponent(menuItemId)}/attributes/${encodeURIComponent(attributeId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  return parseJson<AdminMenuItemItem>(res);
}

// --- Legal pages (Terms & Privacy CMS) ---------------------------------------

export type AdminLegalPageSlug = "terms" | "privacy";

export type AdminLegalPageTranslationItem = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  title: string;
  lastUpdatedLabel: string;
  bodyHtml: string;
  updatedAt: string;
};

export type AdminLegalPageItem = {
  id: string;
  slug: AdminLegalPageSlug;
  label: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminLegalPageTranslationItem[];
};

export async function fetchAdminLegalPages(
  accessToken: string,
): Promise<AdminLegalPageItem[]> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/legal-pages`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminLegalPageItem[]>(res);
}

export async function updateAdminLegalPage(
  accessToken: string,
  id: string,
  payload: { isPublished?: boolean },
): Promise<AdminLegalPageItem> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/legal-pages/${encodeURIComponent(id)}`, {
    ...fetchOpts,
    method: "PATCH",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminLegalPageItem>(res);
}

export async function upsertAdminLegalPageTranslation(
  accessToken: string,
  pageId: string,
  payload: {
    languageId: number;
    title: string;
    lastUpdatedLabel: string;
    bodyHtml: string;
  },
): Promise<AdminLegalPageItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/legal-pages/${encodeURIComponent(pageId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminLegalPageItem>(res);
}

export async function deleteAdminLegalPageTranslation(
  accessToken: string,
  pageId: string,
  languageId: string,
): Promise<AdminLegalPageItem> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/legal-pages/${encodeURIComponent(pageId)}/translations/${encodeURIComponent(languageId)}`,
    {
      ...fetchOpts,
      method: "DELETE",
      headers: bearer(accessToken),
    },
  );
  return parseJson<AdminLegalPageItem>(res);
}

// --- Listing packages (/packages CMS) ----------------------------------------

export type AdminListingPackagesPageTranslation = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  valueTitle: string;
  valueBody: string;
  discoverTitle: string;
  discoverSubtitle: string;
  comparisonTitle: string;
  comparisonHint: string;
  featureColumnLabel: string;
  tierEssentialLabel: string;
  tierGrowthLabel: string;
  tierPremierLabel: string;
  recommendedBadge: string;
  audienceTitle: string;
  audienceSubtitle: string;
  audienceTags: string[];
  helpTitle: string;
  helpBody: string;
  browseDirectoryLabel: string;
  disclaimerText: string;
  updatedAt: string;
};

export type AdminListingPlanTranslation = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  name: string;
  subtitle: string;
  periodLabel: string;
  ctaLabel: string;
  features: string[];
  updatedAt: string;
};

export type AdminListingPlan = {
  id: string;
  code: string;
  priceDisplay: string;
  icon: string;
  isRecommended: boolean;
  isDarkTheme: boolean;
  displayOrder: number;
  isActive: boolean;
  contactTopic: string;
  createdAt: string;
  updatedAt: string;
  translations: AdminListingPlanTranslation[];
};

export type AdminListingComparisonTranslation = {
  id: string;
  languageId: string;
  languageCode: string;
  languageName: string;
  label: string;
  essentialValue: string;
  growthValue: string;
  premierValue: string;
  updatedAt: string;
};

export type AdminListingComparisonRow = {
  id: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: AdminListingComparisonTranslation[];
};

export type AdminListingPackagesBundle = {
  pageTranslations: AdminListingPackagesPageTranslation[];
  plans: AdminListingPlan[];
  comparisonRows: AdminListingComparisonRow[];
};

export async function fetchAdminListingPackages(
  accessToken: string,
): Promise<AdminListingPackagesBundle> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/listing-packages`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminListingPackagesBundle>(res);
}

export async function upsertAdminListingPackagesPageTranslation(
  accessToken: string,
  payload: Omit<AdminListingPackagesPageTranslation, "id" | "languageCode" | "languageName" | "updatedAt">,
): Promise<AdminListingPackagesBundle> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/listing-packages/page/translations`, {
    ...fetchOpts,
    method: "POST",
    headers: { ...bearer(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<AdminListingPackagesBundle>(res);
}

export async function updateAdminListingPlan(
  accessToken: string,
  planId: string,
  payload: Partial<{
    priceDisplay: string;
    icon: string;
    isRecommended: boolean;
    isDarkTheme: boolean;
    displayOrder: number;
    isActive: boolean;
    contactTopic: string;
  }>,
): Promise<AdminListingPackagesBundle> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/listing-packages/plans/${encodeURIComponent(planId)}`,
    {
      ...fetchOpts,
      method: "PATCH",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminListingPackagesBundle>(res);
}

export async function upsertAdminListingPlanTranslation(
  accessToken: string,
  planId: string,
  payload: {
    languageId: string;
    name: string;
    subtitle: string;
    periodLabel: string;
    ctaLabel: string;
    features: string[];
  },
): Promise<AdminListingPackagesBundle> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/listing-packages/plans/${encodeURIComponent(planId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminListingPackagesBundle>(res);
}

export async function upsertAdminListingComparisonTranslation(
  accessToken: string,
  rowId: string,
  payload: {
    languageId: string;
    label: string;
    essentialValue: string;
    growthValue: string;
    premierValue: string;
  },
): Promise<AdminListingPackagesBundle> {
  const res = await fetch(
    `${getAdminApiBase()}/api/admin/listing-packages/comparison-rows/${encodeURIComponent(rowId)}/translations`,
    {
      ...fetchOpts,
      method: "POST",
      headers: { ...bearer(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return parseJson<AdminListingPackagesBundle>(res);
}
