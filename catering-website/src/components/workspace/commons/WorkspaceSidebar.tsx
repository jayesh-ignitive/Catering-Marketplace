"use client";

import { getWorkspaceNavSections, isWorkspaceNavActive } from "@/components/workspace/theme-nav";
import { useI18n } from "@/context/LocaleContext";
import { BrandLogoLink } from "@/components/common/BrandLogoLink";
import Link from "next/link";
import { usePathname } from "next/navigation";

type WorkspaceSidebarProps = {
  mobileOpen: boolean;
  collapsed: boolean;
  hoverExpanded: boolean;
  onDesktopHoverStart: () => void;
  onDesktopHoverEnd: () => void;
  onCloseMobile: () => void;
};

export function WorkspaceSidebar({
  mobileOpen,
  collapsed,
  hoverExpanded,
  onDesktopHoverStart,
  onDesktopHoverEnd,
  onCloseMobile,
}: WorkspaceSidebarProps) {
  const { ws } = useI18n();
  const pathname = usePathname();
  const navSections = getWorkspaceNavSections(ws);
  const compact = collapsed && !hoverExpanded;

  return (
    <>
      <button
        type="button"
        aria-label={ws.sidebar.closeOverlay}
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
            <BrandLogoLink
              preset="workspaceSidebar"
              showWordmark={!compact}
              className="h-full min-w-0"
              onClick={onCloseMobile}
            />
          </div>

          <nav
            className={`admin-shell-scroll min-h-0 flex-1 space-y-1 overflow-y-auto transition-all duration-300 ${
              compact ? "p-2" : "p-4"
            }`}
          >
            {navSections.map((section) => (
              <div key={section.label} className="space-y-1">
                {!compact ? (
                  <div className="menu-header mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-gray-400 first:mt-0">
                    {section.label}
                  </div>
                ) : (
                  <div className="my-2 border-t border-gray-100 first:mt-0 first:border-t-0" aria-hidden />
                )}
                {section.items.map((item) => {
                  const active = isWorkspaceNavActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      title={compact ? item.label : undefined}
                      className={`nav-link group flex cursor-pointer items-center gap-3 rounded-xl py-3 transition-all duration-300 ${
                        compact ? "justify-center px-2" : "justify-between px-3"
                      } ${
                        active
                          ? "bg-brand-red-light font-bold text-brand-red shadow-sm"
                          : "text-brand-text-muted hover:translate-x-1 hover:bg-brand-red-light hover:text-brand-red"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          size={20}
                          weight={active ? "fill" : "regular"}
                          className={`shrink-0 transition-transform ${active ? "" : "group-hover:scale-110"}`}
                          aria-hidden
                        />
                        {!compact ? <span className="text-sm font-medium">{item.label}</span> : null}
                      </span>
                      {item.badge && !compact ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            active ? "bg-brand-red/15 text-brand-red" : "bg-gray-100 text-brand-text-muted"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
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
