"use client";

import {
  ChartLineUp,
  ForkKnife,
  List,
  ShoppingCart,
  SignOut,
  SquaresFour,
  Storefront,
} from "@phosphor-icons/react";
import type { AuthUser } from "@/lib/auth-api";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LocaleContext";
import { workspaceHeaderSubtitle, workspaceHeaderTitle } from "../theme-nav";

type WorkspaceHeaderProps = {
  user: AuthUser;
  onToggleSidebar: () => void;
};

export function WorkspaceHeader({ user, onToggleSidebar }: WorkspaceHeaderProps) {
  const { ws } = useI18n();
  const { logout } = useAuth();
  const pathname = usePathname();
  const title = workspaceHeaderTitle(pathname, ws);
  const subtitle = workspaceHeaderSubtitle(pathname, ws);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.fullName,
  )}&background=5b3e18&color=ffffff&bold=true`;

  useEffect(() => {
    if (!menuOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 flex h-20 shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md md:px-8 ${
        menuOpen ? "z-[250]" : "z-20"
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-brand-text-muted transition-colors hover:bg-brand-red/10 hover:text-brand-red focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/30 focus-visible:ring-offset-2"
          aria-label={ws.header.toggleNav}
        >
          <List size={26} weight="regular" aria-hidden />
        </button>
        <div className="min-w-0 md:block">
          <h1 className="font-heading truncate text-lg font-bold tracking-tight text-brand-text-dark md:text-xl">
            {title}
          </h1>
          <p className="hidden truncate text-xs text-brand-text-muted sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="relative flex items-center gap-4" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white p-0.5 shadow-sm transition-all duration-300 hover:scale-110 hover:border-brand-red hover:shadow-md focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/35 focus-visible:ring-offset-2 ${
            menuOpen ? "border-brand-red ring-2 ring-brand-red/25" : ""
          }`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={ws.header.accountMenu}
          title={ws.header.accountMenu}
        >
          <div className="relative h-full w-full overflow-hidden rounded-full">
            <Image
              src={avatarUrl}
              alt=""
              fill
              sizes="40px"
              className="pointer-events-none object-cover"
              unoptimized
            />
            <span className="sr-only">{user.fullName}</span>
          </div>
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-[250] mt-3 w-56 rounded-2xl border border-gray-100 bg-white py-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)]"
          >
            <div className="border-b border-gray-50 px-4 py-3">
              <p className="truncate text-sm font-bold text-brand-text-dark">{user.fullName}</p>
              <p className="truncate text-xs text-brand-text-muted">{user.email}</p>
              <span className="mt-2 inline-block rounded-full bg-brand-red-light px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                {ws.header.roleCaterer}
              </span>
            </div>
            
            <Link
              href="/workspace/profile"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-brand-text-dark transition hover:bg-brand-page"
              onClick={() => setMenuOpen(false)}
            >
              <Storefront size={18} weight="bold" className="text-brand-text-muted" aria-hidden />
              {ws.nav.items.profile}
            </Link>
            
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-3 border-t border-gray-50 px-4 py-2.5 text-left text-sm font-semibold text-brand-text-dark transition hover:bg-brand-page"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              <SignOut size={18} weight="bold" className="text-brand-text-muted" aria-hidden />
              {ws.header.signOut}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
