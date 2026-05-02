import type { Icon } from "@phosphor-icons/react";
import { ListDashes } from "@phosphor-icons/react";

export type WorkspaceThemeNavItem = {
  href: string;
  label: string;
  icon: Icon;
  badge?: string;
};

export const WORKSPACE_THEME_NAV: WorkspaceThemeNavItem[] = [
  { href: "/workspace/profile", label: "Profile", icon: ListDashes },
];
