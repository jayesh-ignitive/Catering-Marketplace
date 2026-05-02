"use client";

import type { AuthUser } from "@/lib/auth-api";
import { SignOut, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function profileHref(user: AuthUser) {
  if (user.role === "admin") return "/";
  return "/workspace/profile";
}

function UserAvatarButton({
  user,
  expanded,
  onToggle,
  buttonRef,
}: {
  user: AuthUser;
  expanded: boolean;
  onToggle: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.fullName
  )}&background=ff3b30&color=fff&bold=true`;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-haspopup="menu"
      aria-label="Account menu"
      className={`group flex items-center justify-center rounded-md p-1 transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/20 ${
        expanded ? "bg-stone-100" : "hover:bg-stone-100"
      }`}
    >
      <div className="relative">
        <div className="h-9 w-9 overflow-hidden rounded-md border border-stone-200 shadow-sm transition-transform group-hover:scale-105">
          {/* eslint-disable-next-line @next/next/no-img-element -- ui-avatars external dynamic URL */}
          <img src={avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
        </div>
        <div
          className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"
          title="Online"
        />
      </div>
    </button>
  );
}

type Props = {
  user: AuthUser;
  onLogout: () => void;
  /** Menu alignment on wide screens */
  align?: "right" | "left";
};

/**
 * Same profile avatar + dropdown as the public site header (desktop).
 */
export function UserAccountMenu({ user, onLogout, align = "right" }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) {
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
    <div ref={wrapRef} className="relative">
      <UserAvatarButton
        user={user}
        expanded={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        buttonRef={buttonRef}
      />
      {menuOpen ? (
        <div
          role="menu"
          className={`absolute top-full mt-3 w-56 rounded-none border border-stone-200 bg-white py-1 shadow-lg shadow-stone-200/50 z-[60] ${
            align === "right" ? "right-0 sm:right-2" : "left-0"
          }`}
        >
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-stone-900">{user.fullName}</p>
            <p className="truncate text-xs text-stone-500">{user.email}</p>
            <span className="mt-2 inline-block rounded-sm bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-stone-600">
              {user.role === "admin" ? "Administrator" : "Caterer Profile"}
            </span>
          </div>
          <Link
            href={profileHref(user)}
            role="menuitem"
            className="group/item flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-brand-red"
            onClick={() => setMenuOpen(false)}
          >
            <UserCircle
              className="text-stone-400 transition-colors group-hover/item:text-brand-red"
              size={18}
              weight="bold"
              aria-hidden
            />
            Profile Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="group/item flex w-full items-center gap-3 border-t border-stone-50 px-4 py-2.5 text-left text-sm font-semibold text-stone-700 transition hover:bg-stone-50 hover:text-brand-red"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            <SignOut
              className="text-stone-400 transition-colors group-hover/item:text-brand-red"
              size={18}
              weight="bold"
              aria-hidden
            />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
