import type { Icon } from "@phosphor-icons/react";
import {
  ListBullets,
  SquaresFour,
  Storefront,
  Translate,
  UsersThree,
} from "@phosphor-icons/react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: Icon;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: SquaresFour },
  { href: "/admin/caterers", label: "Caterers", icon: Storefront },
  { href: "/admin/users", label: "Users", icon: UsersThree },
  { href: "/admin/languages", label: "Languages", icon: Translate },
  { href: "/admin/menu-categories", label: "Menu Categories", icon: ListBullets },
];

/** Active nav item for `/admin`, `/admin/caterers`, `/admin/users`, etc. */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
