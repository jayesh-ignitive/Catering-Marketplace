"use client";

import {
  ADMIN_NAV_SECTIONS,
  isAdminNavActive,
  isAdminNavSubmenu,
  isAdminSubmenuActive,
} from "@/components/admin/admin-nav";
import { CaretDown, ChefHat } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AdminSidebarProps = {
  mobileOpen: boolean;
  collapsed: boolean;
  hoverExpanded: boolean;
  onDesktopHoverStart: () => void;
  onDesktopHoverEnd: () => void;
  onCloseMobile: () => void;
};

function submenuKey(sectionLabel: string, groupLabel: string): string {
  return `${sectionLabel}::${groupLabel}`;
}

export function AdminSidebar({
  mobileOpen,
  collapsed,
  hoverExpanded,
  onDesktopHoverStart,
  onDesktopHoverEnd,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const compact = collapsed && !hoverExpanded;
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const isSubmenuOpen = useCallback(
    (key: string) => openSubmenus[key] ?? false,
    [openSubmenus],
  );

  const toggleSubmenu = useCallback((key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    for (const section of ADMIN_NAV_SECTIONS) {
      for (const item of section.items) {
        if (isAdminNavSubmenu(item) && isAdminSubmenuActive(pathname, item)) {
          const key = submenuKey(section.label, item.label);
          setOpenSubmenus((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
        }
      }
    }
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Close admin menu overlay"
        className={`fixed inset-0 z-30 bg-black/50 transition md:hidden ${
          mobileOpen ? "cursor-pointer opacity-100" : "pointer-events-none cursor-default opacity-0"
        }`}
        onClick={onCloseMobile}
      />
      <aside
        onMouseEnter={onDesktopHoverStart}
        onMouseLeave={onDesktopHoverEnd}
        className={`fixed inset-y-0 left-0 z-40 flex h-[100dvh] w-64 max-w-[86vw] shrink-0 flex-col border-r border-gray-100 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 md:static md:max-w-none md:translate-x-0 ${
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
              className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-xl outline-none ring-brand-red/30 transition hover:bg-brand-red-light focus-visible:ring-2 ${
                compact ? "justify-center p-2" : ""
              }`}
              aria-label="Admin home"
            >
              <ChefHat className="shrink-0 text-[#d4af37]" size={compact ? 26 : 30} weight="fill" aria-hidden />
              {!compact ? (
                <div className="logo-text relative flex min-w-0 flex-col pl-1 leading-none">
                  <span className="font-logo translate-y-0.5 text-3xl tracking-tight text-brand-dark">Bharat</span>
                  <span className="-mt-1 w-fit rotate-[-2deg] rounded-sm bg-brand-red px-1 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
                    Cater Hub
                  </span>
                </div>
              ) : null}
            </Link>
          </div>

          <nav
            className={`admin-shell-scroll min-h-0 flex-1 space-y-1 overflow-y-auto transition-all duration-300 ${
              compact ? "p-2" : "p-4"
            }`}
          >
            {ADMIN_NAV_SECTIONS.map((section) => (
              <div key={section.label} className="space-y-1">
                {!compact ? (
                  <div className="menu-header mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-gray-400 first:mt-0">
                    {section.label}
                  </div>
                ) : (
                  <div className="my-2 border-t border-gray-100 first:mt-0 first:border-t-0" aria-hidden />
                )}
                {section.items.map((item) => {
                  if (isAdminNavSubmenu(item)) {
                    const key = submenuKey(section.label, item.label);
                    const expanded = isSubmenuOpen(key);
                    const submenuActive = isAdminSubmenuActive(pathname, item);

                    if (compact) {
                      return (
                        <div key={key} className="space-y-1">
                          {item.children.map((child) => {
                            const active = isAdminNavActive(pathname, child.href);
                            const Icon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={onCloseMobile}
                                title={child.label}
                                className={`nav-link group flex cursor-pointer items-center gap-3 rounded-xl py-3 transition-all duration-300 ${
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
                              </Link>
                            );
                          })}
                        </div>
                      );
                    }

                    const SubmenuParentIcon = item.icon;
                    return (
                      <div key={key} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(key)}
                          aria-expanded={expanded}
                          className={`nav-link flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-300 ${
                            submenuActive
                              ? "bg-brand-red-light/70 font-semibold text-brand-red"
                              : "text-brand-text-muted hover:bg-brand-red-light hover:text-brand-red"
                          }`}
                        >
                          <SubmenuParentIcon
                            size={20}
                            weight={submenuActive ? "fill" : "regular"}
                            className="shrink-0"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">{item.label}</span>
                          <CaretDown
                            size={16}
                            weight="bold"
                            className={`shrink-0 text-brand-text-muted transition-transform ${expanded ? "" : "-rotate-90"}`}
                            aria-hidden
                          />
                        </button>
                        <div
                          className={`ml-4 space-y-0.5 overflow-hidden border-l border-gray-100 pl-2 transition-all duration-200 ${
                            expanded ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
                          }`}
                        >
                          {expanded
                            ? item.children.map((child) => {
                                const active = isAdminNavActive(pathname, child.href);
                                const Icon = child.icon;
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={onCloseMobile}
                                    className={`nav-link group flex cursor-pointer items-center gap-3 rounded-xl py-2.5 pl-2 pr-3 text-sm transition-all duration-300 ${
                                      active
                                        ? "bg-brand-red-light font-bold text-brand-red shadow-sm"
                                        : "text-brand-text-muted hover:translate-x-0.5 hover:bg-brand-red-light/80 hover:text-brand-red"
                                    }`}
                                  >
                                    <Icon
                                      size={18}
                                      weight={active ? "fill" : "regular"}
                                      className={`shrink-0 transition-transform ${active ? "" : "group-hover:scale-110"}`}
                                      aria-hidden
                                    />
                                    <span className="font-medium">{child.label}</span>
                                  </Link>
                                );
                              })
                            : null}
                        </div>
                      </div>
                    );
                  }

                  const active = isAdminNavActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      title={compact ? item.label : undefined}
                      className={`nav-link group flex cursor-pointer items-center gap-3 rounded-xl py-3 transition-all duration-300 ${
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
      </aside>
    </>
  );
}
