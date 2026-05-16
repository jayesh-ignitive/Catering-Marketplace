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
