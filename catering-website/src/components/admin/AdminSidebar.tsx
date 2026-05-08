"use client";

import type { AuthUser } from "@/lib/auth-api";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/components/admin/admin-nav";
import { ChefHat, SignOut } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type AdminSidebarProps = {
  user: AuthUser;
  mobileOpen: boolean;
  collapsed: boolean;
  hoverExpanded: boolean;
  onDesktopHoverStart: () => void;
  onDesktopHoverEnd: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
};

export function AdminSidebar({
  user,
  mobileOpen,
  collapsed,
  hoverExpanded,
  onDesktopHoverStart,
  onDesktopHoverEnd,
  onCloseMobile,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const compact = collapsed && !hoverExpanded;

  return (
    <>
      <button
        type="button"
        aria-label="Close admin menu overlay"
        className={`fixed inset-0 z-30 bg-black/50 transition md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      />
      <aside
        onMouseEnter={onDesktopHoverStart}
        onMouseLeave={onDesktopHoverEnd}
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[86vw] flex-col border-r border-slate-700/80 bg-slate-900 text-slate-100 shadow-xl transition-all duration-300 md:static md:max-w-none md:translate-x-0 md:shadow-none ${
          compact ? "md:w-20" : "md:w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div
          className={`flex h-20 shrink-0 items-center border-b border-slate-700/80 transition-all duration-300 ${
            compact ? "justify-center px-2" : "gap-3 px-5"
          }`}
        >
          <Link
            href="/admin"
            onClick={onCloseMobile}
            className={`flex min-w-0 items-center gap-3 rounded-lg outline-none ring-brand-red/40 transition hover:bg-slate-800/80 focus-visible:ring-2 ${
              compact ? "justify-center p-2" : ""
            }`}
            aria-label="Admin home"
          >
            <ChefHat className="shrink-0 text-amber-400" size={compact ? 26 : 30} weight="fill" aria-hidden />
            {!compact ? (
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Console</p>
                <p className="font-heading text-lg font-extrabold tracking-tight text-white">Admin</p>
              </div>
            ) : null}
          </Link>
        </div>

        <div className={`flex flex-1 flex-col overflow-y-auto transition-all duration-300 ${compact ? "p-2" : "p-4"}`}>
          {!compact ? (
            <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Navigation
            </p>
          ) : null}
          <nav className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isAdminNavActive(pathname, item.href);
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
                      ? "bg-brand-red text-white shadow-lg shadow-red-900/40"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden />
                    <span className={compact ? "hidden" : "inline"}>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={`border-t border-slate-700/80 transition-all duration-300 ${compact ? "p-2" : "p-4"}`}>
          <p
            className={`truncate text-sm font-semibold text-white ${compact ? "hidden" : "block"}`}
            title={user.fullName}
          >
            {user.fullName}
          </p>
          <p
            className={`truncate text-xs text-slate-400 ${compact ? "hidden" : "block"}`}
            title={user.email}
          >
            {user.email}
          </p>
          <div className={`mt-3 flex flex-wrap items-center gap-2 ${compact ? "justify-center" : ""}`}>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onCloseMobile();
              }}
              className={`inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-700 ${
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
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold text-amber-400/90 hover:bg-slate-800 hover:text-amber-300 ${
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
