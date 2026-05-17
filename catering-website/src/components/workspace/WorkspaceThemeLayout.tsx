"use client";

import { useState } from "react";
import type { AuthUser } from "@/lib/auth-api";
import type { CatererWorkspaceProfile } from "@/lib/catering-api";
import { usePathname } from "next/navigation";
import { WorkspaceFooter } from "./commons/WorkspaceFooter";
import { WorkspaceHeader } from "./commons/WorkspaceHeader";
import { WorkspaceSidebar } from "./commons/WorkspaceSidebar";
import { WorkspaceListingFlashBanner } from "./WorkspaceListingFlashBanner";

type WorkspaceThemeLayoutProps = {
  user: AuthUser;
  profile?: CatererWorkspaceProfile | null;
  children: React.ReactNode;
};

export function WorkspaceThemeLayout({
  user,
  profile,
  children,
}: WorkspaceThemeLayoutProps) {
  const pathname = usePathname();
  const flashOnDashboard = pathname === "/workspace" || pathname === "/workspace/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);

  function handleToggleSidebar() {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((prev) => !prev);
    setHoverExpanded(false);
  }

  return (
    <div className="fixed inset-0 z-0 flex overflow-hidden bg-brand-page font-sans text-brand-text-muted">
      <WorkspaceSidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        hoverExpanded={hoverExpanded}
        onDesktopHoverStart={() => {
          if (collapsed) setHoverExpanded(true);
        }}
        onDesktopHoverEnd={() => {
          if (collapsed) setHoverExpanded(false);
        }}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-brand-page">
        <WorkspaceHeader user={user} onToggleSidebar={handleToggleSidebar} />
        <WorkspaceListingFlashBanner
          profile={profile}
          size={flashOnDashboard ? "prominent" : "default"}
        />
        <main className="admin-shell-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-brand-page px-4 pt-4 pb-4 md:px-8 md:pt-8 md:pb-6">
          {children}
        </main>
        <WorkspaceFooter />
      </div>
    </div>
  );
}
