"use client";

import { SignOut } from "@phosphor-icons/react";
import Link from "next/link";
import { BrandLogoLink } from "@/components/common/BrandLogoLink";
import { usePathname, useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth-api";
import { WORKSPACE_THEME_NAV } from "../theme-nav";

type WorkspaceSidebarProps = {
  user: AuthUser;
  mobileOpen: boolean;
  collapsed: boolean;
  hoverExpanded: boolean;
  onDesktopHoverStart: () => void;
  onDesktopHoverEnd: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
};

export function WorkspaceSidebar({
  user,
  mobileOpen,
  collapsed,
  hoverExpanded,
  onDesktopHoverStart,
  onDesktopHoverEnd,
  onCloseMobile,
  onLogout,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const displayBusiness = user.tenant?.name ?? user.businessName ?? "My business";
  const compact = collapsed && !hoverExpanded;

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar overlay"
        className={`fixed inset-0 z-30 bg-black/45 transition md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      />
      <aside
        onMouseEnter={onDesktopHoverStart}
        onMouseLeave={onDesktopHoverEnd}
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[86vw] flex-col border-r border-stone-200/80 bg-white shadow-xl transition-all duration-300 md:static md:max-w-none md:translate-x-0 md:shadow-none ${
          compact ? "md:w-20" : "md:w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`h-20 border-b border-stone-100 transition-all duration-300 ${compact ? "px-3" : "px-6"}`}>
          <BrandLogoLink
            preset="workspaceSidebar"
            showWordmark={!compact}
            className="h-full"
            onClick={onCloseMobile}
          />
        </div>

        <div className={`flex flex-1 flex-col overflow-y-auto transition-all duration-300 ${compact ? "p-2" : "p-4"}`}>
          <p
            className={`mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400 transition-all duration-300 ${
              compact ? "hidden" : "block"
            }`}
          >
            Workspace
          </p>
          <nav className="space-y-1">
            {WORKSPACE_THEME_NAV.map((item) => {
              const active =
                item.href === "/workspace"
                  ? pathname === "/workspace"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center rounded-xl py-2.5 text-sm font-medium transition ${
                    compact ? "justify-center px-2" : "justify-between px-3"
                  } ${
                    active
                      ? "bg-brand-red text-white shadow-[0_8px_16px_rgba(229,57,53,0.26)]"
                      : "text-stone-600 hover:bg-red-50 hover:text-brand-red"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden />
                    <span className={compact ? "hidden" : "inline"}>{item.label}</span>
                  </span>
                  {item.badge && !compact ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        active ? "bg-white/20 text-white" : "bg-red-50 text-brand-red"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={`border-t border-stone-200/80 transition-all duration-300 ${compact ? "p-2" : "p-4"}`}>
          <p className={`truncate text-sm font-semibold text-stone-800 ${compact ? "hidden" : "block"}`} title={user.fullName}>
            {displayBusiness}
          </p>
          <p className={`truncate text-xs text-stone-500 ${compact ? "hidden" : "block"}`} title={user.email}>
            {user.email}
          </p>
          <div className={`mt-3 flex items-center gap-2 ${compact ? "justify-center" : ""}`}>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onCloseMobile();
              }}
              className={`inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white py-1.5 text-xs font-semibold text-stone-600 transition hover:border-stone-300 hover:text-stone-900 ${
                compact ? "px-2" : "px-3"
              }`}
            >
              <SignOut size={16} aria-hidden />
              <span className={compact ? "hidden" : "inline"}>Sign out</span>
            </button>
            <button
              type="button"
              onClick={() => {
                router.push("/");
                onCloseMobile();
              }}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-red hover:bg-red-50 ${
                compact ? "hidden" : "inline"
              }`}
            >
              Public site
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
