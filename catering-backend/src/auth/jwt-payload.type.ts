import type { UserRole } from '../user/user-role.enum';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  /** Email verified (caterer accounts must verify before login). */
  ev: boolean;
  /** Caterer SaaS tenant id (null for platform admins). */
  tid: string | null;
};
