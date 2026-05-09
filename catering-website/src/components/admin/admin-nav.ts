import type { Icon } from "@phosphor-icons/react";
import {
  Carrot,
  CookingPot,
  FolderOpen,
  ListBullets,
  SquaresFour,
  Storefront,
  Tag,
  Translate,
  UsersThree,
} from "@phosphor-icons/react";

export type AdminNavLinkItem = {
  href: string;
  label: string;
  icon: Icon;
};

export type AdminNavSubmenuGroup = {
  label: string;
  icon: Icon;
  children: AdminNavLinkItem[];
};

export type AdminNavItem = AdminNavLinkItem | AdminNavSubmenuGroup;

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

export function isAdminNavSubmenu(item: AdminNavItem): item is AdminNavSubmenuGroup {
  return "children" in item;
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    label: "Menu",
    items: [
      { href: "/admin", label: "Dashboard", icon: SquaresFour },
      { href: "/admin/caterers", label: "Caterers", icon: Storefront },
      { href: "/admin/users", label: "Users", icon: UsersThree },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/languages", label: "Languages", icon: Translate },
      {
        label: "Categories and Attributes",
        icon: FolderOpen,
        children: [
          { href: "/admin/menu-categories", label: "Menu categories", icon: ListBullets },
          { href: "/admin/ingredient-categories", label: "Ingredient categories", icon: Carrot },
          { href: "/admin/ingredients", label: "Ingredients", icon: CookingPot },
          { href: "/admin/attributes", label: "Attributes", icon: Tag },
        ],
      },
    ],
  },
];

/** Flat list of link targets (submenu children expanded) */
export const ADMIN_NAV_ITEMS: AdminNavLinkItem[] = ADMIN_NAV_SECTIONS.flatMap((s) =>
  s.items.flatMap((item) => (isAdminNavSubmenu(item) ? item.children : [item])),
);

/** Active nav item for `/admin`, `/admin/caterers`, `/admin/users`, etc. */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** True if any child of the submenu matches the current path */
export function isAdminSubmenuActive(pathname: string, group: AdminNavSubmenuGroup): boolean {
  return group.children.some((c) => isAdminNavActive(pathname, c.href));
}
