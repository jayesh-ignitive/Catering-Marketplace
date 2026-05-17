import type { Icon } from "@phosphor-icons/react";
import {
  ChartLineUp,
  ForkKnife,
  ShoppingCart,
  SquaresFour,
  Storefront,
} from "@phosphor-icons/react";

export type WorkspaceThemeNavItem = {
  href: string;
  label: string;
  icon: Icon;
  badge?: string;
};

export type WorkspaceNavSection = {
  label: string;
  items: WorkspaceThemeNavItem[];
};

export const WORKSPACE_NAV_SECTIONS: WorkspaceNavSection[] = [
  {
    label: "Overview",
    items: [{ href: "/workspace", label: "Dashboard", icon: SquaresFour }],
  },
  {
    label: "Business",
    items: [
      { href: "/workspace/profile", label: "Profile", icon: Storefront },
      { href: "/workspace/menu", label: "Menu", icon: ForkKnife },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/workspace/orders", label: "Orders", icon: ShoppingCart },
      { href: "/workspace/analytics", label: "Analytics", icon: ChartLineUp },
    ],
  },
];

/** Caterer workspace navigation — admins use `components/admin/admin-nav`. */
export function getWorkspaceThemeNav(): WorkspaceThemeNavItem[] {
  return WORKSPACE_NAV_SECTIONS.flatMap((s) => s.items);
}

export function isWorkspaceNavActive(pathname: string, href: string): boolean {
  if (href === "/workspace") {
    return pathname === "/workspace" || pathname === "/workspace/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function workspaceHeaderTitle(pathname: string): string {
  if (pathname === "/workspace" || pathname === "/workspace/") {
    return "Dashboard";
  }
  if (pathname.startsWith("/workspace/profile")) {
    return "Profile";
  }
  if (pathname.startsWith("/workspace/menu")) {
    return "Menu";
  }
  if (pathname.startsWith("/workspace/orders")) {
    return "Orders";
  }
  if (pathname.startsWith("/workspace/analytics")) {
    return "Analytics";
  }
  if (pathname.startsWith("/workspace/onboarding")) {
    return "Setup";
  }
  return "Workspace";
}

export function workspaceHeaderSubtitle(pathname: string): string {
  if (pathname === "/workspace" || pathname === "/workspace/") {
    return "Listing status, quick actions, and marketplace preview.";
  }
  if (pathname.startsWith("/workspace/profile")) {
    return "Business details, services, keywords, and gallery for your public listing.";
  }
  if (pathname.startsWith("/workspace/menu")) {
    return "Categories, dishes, and pricing for enquiries and events.";
  }
  if (pathname.startsWith("/workspace/orders")) {
    return "Track enquiries, bookings, and fulfilment in one place.";
  }
  if (pathname.startsWith("/workspace/analytics")) {
    return "Views, leads, and performance insights for your catering business.";
  }
  if (pathname.startsWith("/workspace/onboarding")) {
    return "Complete your profile before submitting for marketplace review.";
  }
  return "Manage your catering business on Bharat Catering.";
}
