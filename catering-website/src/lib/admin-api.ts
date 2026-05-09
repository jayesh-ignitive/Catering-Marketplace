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

export type AdminCatererListItem = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  dbName: string | null;
  provisionStatus: string;
  profilePublished: boolean;
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

// --- Calls -----------------------------------------------------------------

export async function fetchAdminDashboardOverview(accessToken: string): Promise<AdminDashboardOverview> {
  const res = await fetch(`${getAdminApiBase()}/api/admin/dashboard/overview`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminDashboardOverview>(res);
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
  }
): Promise<AdminCatererListResponse> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortDir) sp.set("sortDir", params.sortDir);
  const q = sp.toString();
  const res = await fetch(`${getAdminApiBase()}/api/admin/caterers${q ? `?${q}` : ""}`, {
    ...fetchOpts,
    headers: bearer(accessToken),
  });
  return parseJson<AdminCatererListResponse>(res);
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
