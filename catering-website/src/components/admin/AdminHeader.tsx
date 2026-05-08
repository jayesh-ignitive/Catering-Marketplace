"use client";

import type { AuthUser } from "@/lib/auth-api";
import { List, SignOut, UserCircle } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function adminSectionTitle(pathname: string): string {
  if (pathname.startsWith("/admin/users/") && pathname !== "/admin/users") {
    return "User details";
  }
  if (pathname.startsWith("/admin/caterers")) {
    return "Caterers";
  }
  if (pathname.startsWith("/admin/users")) {
    return "Users";
  }
  if (pathname === "/admin") {
    return "Dashboard";
  }
  return "Admin";
}

type AdminHeaderProps = {
  user: AuthUser;
  onToggleSidebar: () => void;
  onLogout: () => void;
};

export function AdminHeader({ user, onToggleSidebar, onLogout }: AdminHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.fullName
  )}&background=334155&color=f1f5f9&bold=true`;

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

  const title = adminSectionTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-4 shadow-sm shadow-slate-200/30 md:px-8">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-900 hover:text-white"
          aria-label="Toggle admin navigation"
        >
          <List size={22} weight="bold" aria-hidden />
        </button>
        <div className="hidden h-9 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Admin console</p>
          <h1 className="font-heading truncate text-xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        </div>
      </div>

      <div className="relative flex items-center gap-3" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`group flex items-center justify-center rounded-lg p-1 transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
            menuOpen ? "bg-slate-100" : "hover:bg-slate-100"
          }`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Account menu"
        >
          <div className="relative">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-slate-200 shadow-sm transition-transform group-hover:scale-[1.02]">
              <Image
                src={avatarUrl}
                alt={user.fullName}
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
              />
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
              aria-hidden
            />
          </div>
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-[60] mt-3 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-300/40"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-bold text-slate-900">{user.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <span className="mt-2 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                Administrator
              </span>
            </div>
            <Link
              href="/admin"
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => setMenuOpen(false)}
            >
              <UserCircle size={18} weight="bold" className="text-slate-400" aria-hidden />
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 border-t border-slate-50 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
            >
              <SignOut size={18} weight="bold" className="text-slate-400" aria-hidden />
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
