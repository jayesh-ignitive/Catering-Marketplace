import type { Icon } from "@phosphor-icons/react";
import {
  House,
  ImageSquare,
  Storefront,
} from "@phosphor-icons/react";

export type WorkspaceThemeNavItem = {
  href: string;
  label: string;
  icon: Icon;
  badge?: string;
};

export const WORKSPACE_THEME_NAV: WorkspaceThemeNavItem[] = [
  { href: "/workspace", label: "Dashboard", icon: House },
  { href: "/workspace/onboarding", label: "Onboarding", icon: Storefront },
  { href: "/workspace/gallery", label: "Gallery", icon: ImageSquare },
];
