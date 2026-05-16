"use client";

import type { AuthUser } from "@/lib/auth-api";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useState } from "react";

type AdminThemeLayoutProps = {
  user: AuthUser;
  onLogout: () => void;
  children: React.ReactNode;
};

export function AdminThemeLayout({ user, onLogout, children }: AdminThemeLayoutProps) {
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
      <AdminSidebar
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
        <AdminHeader user={user} onToggleSidebar={handleToggleSidebar} onLogout={onLogout} />
        <main className="admin-shell-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-brand-page px-4 pt-4 pb-4 md:px-8 md:pt-8 md:pb-6">
          {children}
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
