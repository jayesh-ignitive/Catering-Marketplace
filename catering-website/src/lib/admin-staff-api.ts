import { AuthApiError } from "@/lib/auth-api";
import { getCateringApiBase } from "@/lib/catering-api";

export type AdminStaffMember = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
};

async function parseJsonUnknown(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}));
}

function formatApiError(data: unknown, status: number): { message: string } {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const message = o.message;
    if (typeof message === "string") return { message };
    if (Array.isArray(message) && message.length > 0) return { message: String(message[0]) };
  }
  return { message: `Request failed (${status})` };
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchAdminStaffList(token: string): Promise<AdminStaffMember[]> {
  const res = await fetch(`${getCateringApiBase()}/api/admin/staff`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status);
  }
  return data as AdminStaffMember[];
}

export async function fetchAdminStaffOne(token: string, id: string): Promise<AdminStaffMember> {
  const res = await fetch(`${getCateringApiBase()}/api/admin/staff/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status);
  }
  return data as AdminStaffMember;
}

export async function createAdminStaff(
  token: string,
  body: { email: string; fullName: string; password: string }
): Promise<AdminStaffMember> {
  const res = await fetch(`${getCateringApiBase()}/api/admin/staff`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status);
  }
  return data as AdminStaffMember;
}

export async function updateAdminStaff(
  token: string,
  id: string,
  body: { email?: string; fullName?: string; password?: string }
): Promise<AdminStaffMember> {
  const res = await fetch(`${getCateringApiBase()}/api/admin/staff/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status);
  }
  return data as AdminStaffMember;
}

export async function deleteAdminStaff(token: string, id: string): Promise<void> {
  const res = await fetch(`${getCateringApiBase()}/api/admin/staff/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data: unknown = await parseJsonUnknown(res);
    const { message } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status);
  }
}
