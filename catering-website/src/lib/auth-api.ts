import { getCateringApiBase } from "./catering-api";

export type UserRole = "caterer" | "admin";

export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  role: UserRole;
  emailVerified: boolean;
  /** Caterer workspace; null for platform admins or legacy rows. */
  tenant: TenantSummary | null;
};

export type AuthSuccess = {
  accessToken: string;
  user: AuthUser;
};

export type RegisterResult = {
  requiresVerification: true;
  email: string;
  subdomain: string | null;
};

const TOKEN_KEY = "catering_auth_token";

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function formatApiError(data: unknown, status: number): { message: string; code?: string } {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const code = typeof o.code === "string" ? o.code : undefined;
    const message = o.message;
    if (typeof message === "string") return { message, code };
    if (Array.isArray(message) && message.length > 0) return { message: String(message[0]), code };
  }
  return { message: `Request failed (${status})` };
}

async function parseJsonUnknown(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}));
}

export async function registerAccount(body: {
  fullName: string;
  email: string;
  businessName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  password: string;
}): Promise<RegisterResult> {
  const res = await fetch(`${getCateringApiBase()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message, code } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status, code);
  }
  const d = data as RegisterResult;
  if (!d || d.requiresVerification !== true || typeof d.email !== "string") {
    throw new AuthApiError("Unexpected registration response", res.status);
  }
  return {
    ...d,
    subdomain: typeof d.subdomain === "string" || d.subdomain === null ? d.subdomain : null,
  };
}

export async function verifyOtp(body: { email: string; code: string }): Promise<AuthSuccess> {
  const res = await fetch(`${getCateringApiBase()}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email.trim().toLowerCase(), code: body.code.trim() }),
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message, code } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status, code);
  }
  return data as AuthSuccess;
}

export async function verifyEmail(token: string): Promise<AuthSuccess> {
  const res = await fetch(`${getCateringApiBase()}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message, code } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status, code);
  }
  return data as AuthSuccess;
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const res = await fetch(`${getCateringApiBase()}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message, code } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status, code);
  }
}

export async function loginAccount(body: {
  email: string;
  password: string;
}): Promise<AuthSuccess> {
  const res = await fetch(`${getCateringApiBase()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message, code } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status, code);
  }
  return data as AuthSuccess;
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  const res = await fetch(`${getCateringApiBase()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message, code } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status, code);
  }
  return data as AuthUser;
}

export async function patchAccountProfile(
  accessToken: string,
  body: { fullName: string; businessName: string }
): Promise<AuthUser> {
  const res = await fetch(`${getCateringApiBase()}/api/auth/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: body.fullName.trim(),
      businessName: body.businessName.trim(),
    }),
  });
  const data: unknown = await parseJsonUnknown(res);
  if (!res.ok) {
    const { message, code } = formatApiError(data, res.status);
    throw new AuthApiError(message, res.status, code);
  }
  return data as AuthUser;
}
