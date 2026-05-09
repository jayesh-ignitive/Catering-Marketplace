"use client";

import type { AuthUser } from "@/lib/auth-api";
import { ADMIN_NAV_SECTIONS, isAdminNavActive } from "@/components/admin/admin-nav";
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
        className={`fixed inset-y-0 left-0 z-40 flex h-[100dvh] w-64 max-w-[86vw] shrink-0 flex-col justify-between border-r border-gray-100 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 md:static md:max-w-none md:translate-x-0 ${
          compact ? "md:w-20" : "md:w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={`flex h-20 shrink-0 items-center border-b border-gray-50 transition-all duration-300 ${
              compact ? "justify-center px-2" : "px-6"
            }`}
          >
            <Link
              href="/admin"
              onClick={onCloseMobile}
              className={`flex min-w-0 items-center gap-2 rounded-xl outline-none ring-brand-red/30 transition hover:bg-brand-red-light focus-visible:ring-2 ${
                compact ? "justify-center p-2" : ""
              }`}
              aria-label="Admin home"
            >
              <ChefHat className="shrink-0 text-[#d4af37]" size={compact ? 26 : 30} weight="fill" aria-hidden />
              {!compact ? (
                <div className="logo-text relative flex min-w-0 flex-col pl-1 leading-none">
                  <span className="font-logo translate-y-0.5 text-3xl tracking-tight text-brand-dark">Bharat</span>
                  <span className="-mt-1 w-fit rotate-[-2deg] rounded-sm bg-brand-red px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.3em] text-white shadow-sm">
                    Catering
                  </span>
                </div>
              ) : null}
            </Link>
          </div>

          <nav
            className={`admin-shell-scroll flex-1 space-y-1 overflow-y-auto transition-all duration-300 ${
              compact ? "max-h-[calc(100dvh-180px)] p-2" : "max-h-[calc(100dvh-220px)] p-4"
            }`}
          >
            {ADMIN_NAV_SECTIONS.map((section) => (
              <div key={section.label} className={compact ? "space-y-1" : "space-y-1"}>
                {!compact ? (
                  <div className="menu-header mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-gray-400 first:mt-0">
                    {section.label}
                  </div>
                ) : (
                  <div className="my-2 border-t border-gray-100 first:mt-0 first:border-t-0" aria-hidden />
                )}
                {section.items.map((item) => {
                  const active = isAdminNavActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`nav-link group flex items-center gap-3 rounded-xl py-3 transition-all duration-300 ${
                        compact ? "justify-center px-2" : "px-3"
                      } ${
                        active
                          ? "bg-brand-red-light font-bold text-brand-red shadow-sm"
                          : "text-brand-text-muted hover:translate-x-1 hover:bg-brand-red-light hover:text-brand-red"
                      }`}
                    >
                      <Icon
                        size={20}
                        weight={active ? "fill" : "regular"}
                        className={`shrink-0 transition-transform ${active ? "" : "group-hover:scale-110"}`}
                        aria-hidden
                      />
                      {!compact ? <span className="text-sm font-medium">{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className={`shrink-0 border-t border-gray-50 transition-all duration-300 ${compact ? "p-2" : "p-4"}`}>
          {!compact ? (
            <>
              <p className="truncate text-sm font-semibold text-brand-text-dark" title={user.fullName}>
                {user.fullName}
              </p>
              <p className="truncate text-xs text-brand-text-muted" title={user.email}>
                {user.email}
              </p>
            </>
          ) : null}
          <div className={`mt-3 flex flex-wrap items-center gap-2 ${compact ? "justify-center" : ""}`}>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onCloseMobile();
              }}
              className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-brand-page py-2 text-xs font-semibold text-brand-text-dark transition hover:border-brand-red hover:bg-brand-red-light hover:text-brand-red ${
                compact ? "px-2" : "px-3"
              }`}
            >
              <SignOut size={16} aria-hidden />
              {!compact ? <span>Sign out</span> : null}
            </button>
            {!compact ? (
              <button
                type="button"
                onClick={() => {
                  router.push("/");
                  onCloseMobile();
                }}
                className="rounded-xl px-2 py-2 text-xs font-semibold text-brand-text-muted transition hover:bg-brand-page hover:text-brand-red"
              >
                Public site
              </button>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
