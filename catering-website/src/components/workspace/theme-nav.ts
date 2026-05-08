import type { Icon } from "@phosphor-icons/react";
import { ListDashes } from "@phosphor-icons/react";

export type WorkspaceThemeNavItem = {
  href: string;
  label: string;
  icon: Icon;
  badge?: string;
};

/** Caterer workspace navigation only — admins use `components/admin/admin-nav`. */
const CATERER_WORKSPACE_THEME_NAV: WorkspaceThemeNavItem[] = [
  { href: "/workspace/profile", label: "Profile", icon: ListDashes },
];

export function getWorkspaceThemeNav(): WorkspaceThemeNavItem[] {
  return CATERER_WORKSPACE_THEME_NAV;
}
