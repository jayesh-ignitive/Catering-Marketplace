const KEY = "catering_pending_verify_email";

export function setPendingVerifyEmail(email: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, email.trim().toLowerCase());
}

export function getPendingVerifyEmail(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export function clearPendingVerifyEmail(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
