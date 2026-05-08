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
