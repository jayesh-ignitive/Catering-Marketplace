"use client";

import { useState } from "react";
import type { AuthUser } from "@/lib/auth-api";
import { WorkspaceFooter } from "./commons/WorkspaceFooter";
import { WorkspaceHeader } from "./commons/WorkspaceHeader";
import { WorkspaceSidebar } from "./commons/WorkspaceSidebar";

type WorkspaceThemeLayoutProps = {
  user: AuthUser;
  onLogout: () => void;
  children: React.ReactNode;
};

export function WorkspaceThemeLayout({ user, onLogout, children }: WorkspaceThemeLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);

  function handleToggleSidebar() {
    if (window.innerWidth < 768) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((prev) => !prev);
    setHoverExpanded(false);
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-stone-700">
      <WorkspaceSidebar
        user={user}
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
        onLogout={onLogout}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader user={user} onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        <WorkspaceFooter />
      </div>
    </div>
  );
}
