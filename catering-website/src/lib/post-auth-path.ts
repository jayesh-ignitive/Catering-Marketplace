import type { AuthUser } from "@/lib/auth-api";

/** Where to send someone after caterer login / verification. */
export function postAuthPath(user: Pick<AuthUser, "role">): string {
  if (user.role === "admin") return "/";
  return "/workspace";
}
