"use client";

import { List, UserCircle, SignOut } from "@phosphor-icons/react";
import type { AuthUser } from "@/lib/auth-api";
import { BrandLogoLink } from "@/components/common/BrandLogoLink";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

type WorkspaceHeaderProps = {
  user: AuthUser;
  onToggleSidebar: () => void;
};

export function WorkspaceHeader({ user, onToggleSidebar }: WorkspaceHeaderProps) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Generate a nice avatar fallback using ui-avatars
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.fullName
  )}&background=ff3b30&color=fff&bold=true`;

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
    <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-stone-200/80 bg-white/95 px-4 backdrop-blur md:px-8 shadow-sm shadow-stone-200/20">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600 transition hover:bg-brand-red/10 hover:text-brand-red"
          aria-label="Toggle workspace navigation"
        >
          <List size={22} weight="bold" aria-hidden />
        </button>
        {/** Sidebar already shows the brand from `md`; avoid duplicate logos beside the top bar. */}
        <BrandLogoLink preset="workspaceHeader" className="min-w-0 shrink-0 md:hidden" />
        <div className="hidden h-9 w-px shrink-0 bg-stone-200 sm:block" aria-hidden />
        <div className="hidden min-w-0 sm:block">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-red/80">
            Workspace Panel
          </p>
          <h1 className="font-heading text-xl font-extrabold text-stone-900 tracking-tight">
            Dashboard
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="relative" ref={menuRef}>
          <button 
            type="button" 
            onClick={() => setMenuOpen(!menuOpen)}
            className={`group flex items-center justify-center rounded-md p-1 transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/20 ${menuOpen ? 'bg-stone-100' : 'hover:bg-stone-100'}`}
          >
            <div className="relative">
              <div className="relative h-9 w-9 overflow-hidden rounded-md border border-stone-200 shadow-sm transition-transform group-hover:scale-105">
                <Image
                  src={avatarUrl}
                  alt={user.fullName}
                  fill
                  sizes="36px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" title="Online"></div>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 sm:right-2 mt-3 w-56 rounded-none border border-stone-200 bg-white py-1 shadow-lg shadow-stone-200/50 z-[60]">
              <div className="border-b border-stone-100 px-4 py-3">
                <p className="truncate text-sm font-bold text-stone-900">{user.fullName}</p>
                <p className="truncate text-xs text-stone-500">{user.email}</p>
                <span className="mt-2 inline-block rounded-sm bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-stone-600">
                  {user.role === 'admin' ? 'Administrator' : 'Caterer Profile'}
                </span>
              </div>
              <button
                type="button"
                className="group/item flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-brand-red"
              >
                <UserCircle className="text-stone-400 transition-colors group-hover/item:text-brand-red" size={18} weight="bold" />
                Profile Settings
              </button>
              <button
                type="button"
                className="group/item flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-brand-red border-t border-stone-50"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <SignOut className="text-stone-400 transition-colors group-hover/item:text-brand-red" size={18} weight="bold" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
