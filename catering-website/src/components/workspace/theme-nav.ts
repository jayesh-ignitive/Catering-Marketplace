import type { Icon } from "@phosphor-icons/react";
import {
  ChartLineUp,
  ForkKnife,
  ShoppingCart,
  SquaresFour,
  Storefront,
} from "@phosphor-icons/react";
import type { WorkspaceMessages } from "@/i18n/workspace.messages";

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

export function getWorkspaceNavSections(ws: WorkspaceMessages): WorkspaceNavSection[] {
  return [
    {
      label: ws.nav.sections.overview,
      items: [{ href: "/workspace", label: ws.nav.items.dashboard, icon: SquaresFour }],
    },
    {
      label: ws.nav.sections.business,
      items: [
        { href: "/workspace/profile", label: ws.nav.items.profile, icon: Storefront },
        { href: "/workspace/menu", label: ws.nav.items.menu, icon: ForkKnife },
      ],
    },
    {
      label: ws.nav.sections.operations,
      items: [
        { href: "/workspace/orders", label: ws.nav.items.orders, icon: ShoppingCart },
        { href: "/workspace/analytics", label: ws.nav.items.analytics, icon: ChartLineUp },
      ],
    },
  ];
}

export function getWorkspaceThemeNav(ws: WorkspaceMessages): WorkspaceThemeNavItem[] {
  return getWorkspaceNavSections(ws).flatMap((s) => s.items);
}

export function isWorkspaceNavActive(pathname: string, href: string): boolean {
  if (href === "/workspace") {
    return pathname === "/workspace" || pathname === "/workspace/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function workspaceHeaderTitle(pathname: string, ws: WorkspaceMessages): string {
  if (pathname === "/workspace" || pathname === "/workspace/") {
    return ws.header.titles.dashboard;
  }
  if (pathname.startsWith("/workspace/profile")) {
    return ws.header.titles.profile;
  }
  if (pathname.startsWith("/workspace/menu")) {
    return ws.header.titles.menu;
  }
  if (pathname.startsWith("/workspace/orders")) {
    return ws.header.titles.orders;
  }
  if (pathname.startsWith("/workspace/analytics")) {
    return ws.header.titles.analytics;
  }
  if (pathname.startsWith("/workspace/onboarding")) {
    return ws.header.titles.setup;
  }
  return ws.header.titles.workspace;
}

export function workspaceHeaderSubtitle(pathname: string, ws: WorkspaceMessages): string {
  if (pathname === "/workspace" || pathname === "/workspace/") {
    return ws.header.subtitles.dashboard;
  }
  if (pathname.startsWith("/workspace/profile")) {
    return ws.header.subtitles.profile;
  }
  if (pathname.startsWith("/workspace/menu")) {
    return ws.header.subtitles.menu;
  }
  if (pathname.startsWith("/workspace/orders")) {
    return ws.header.subtitles.orders;
  }
  if (pathname.startsWith("/workspace/analytics")) {
    return ws.header.subtitles.analytics;
  }
  if (pathname.startsWith("/workspace/onboarding")) {
    return ws.header.subtitles.onboarding;
  }
  return ws.header.subtitles.default;
}
