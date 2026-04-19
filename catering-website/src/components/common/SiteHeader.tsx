"use client";

import {
  Buildings,
  Cake,
  CaretDown,
  ChefHat,
  BowlFood,
  List,
  MagnifyingGlass,
  SignOut,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/lib/auth-api";
import { useEffect, useRef, useState } from "react";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase() || "?";
}

function profileHref(user: AuthUser) {
  if (user.role === "admin") return "/";
  return "/workspace/business";
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
  const label = initialsFromName(user.fullName);
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-haspopup="menu"
      aria-label="Account menu"
      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-2 shadow-sm transition hover:border-brand-red/40 hover:shadow-md focus-visible:outline focus-visible:ring-4 focus-visible:ring-brand-red/20"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-red-800 text-xs font-bold text-white shadow-inner ring-2 ring-white"
        aria-hidden
      >
        {label.slice(0, 2)}
      </span>
      <span className="hidden max-w-[10rem] truncate text-left text-sm font-semibold text-brand-dark sm:inline">
        {user.fullName}
      </span>
      <CaretDown
        className={`hidden shrink-0 text-gray-500 transition-transform sm:block ${expanded ? "rotate-180" : ""}`}
        size={16}
        aria-hidden
      />
    </button>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const { user, ready, logout } = useAuth();

  useEffect(() => {
    if (!userMenuOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = userMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  return (
    <>
      <div className="flex items-center justify-between bg-black px-6 py-2 text-[11px] font-medium tracking-wide text-gray-300">
        <div>Sales &amp; Support: +91 0123456789</div>
        <div className="hidden sm:block">
          India&apos;s Trusted Catering Directory · 10,000+ Happy Customers
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="relative flex flex-col pl-2">
              <ChefHat
                className="absolute -left-2 -top-4 -rotate-[10deg] text-3xl text-[#d4af37]"
                weight="fill"
                aria-hidden
              />
              <span className="font-logo translate-y-1 text-4xl leading-none tracking-tight text-brand-dark">
                Bharat
              </span>
              <span className="relative z-10 -mt-1 -rotate-2 rounded-sm bg-brand-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white shadow-sm">
                Catering
              </span>
            </div>
          </Link>

          <nav className="hidden items-center md:flex">
            <div className="group relative flex cursor-pointer flex-col border-l border-gray-200 px-6">
              <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                Catering Services
              </span>
              <div className="font-heading flex items-center gap-1 font-medium text-brand-dark transition group-hover:text-brand-red">
                Service Categories{" "}
                <CaretDown
                  className="text-sm text-gray-400 transition-transform duration-300 group-hover:rotate-180 group-hover:text-brand-red"
                  aria-hidden
                />
              </div>
              <div className="invisible absolute left-0 top-full z-50 mt-4 w-64 translate-y-2 overflow-hidden rounded-lg border border-gray-100 bg-white opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="p-2">
                  <Link
                    href="/caterers"
                    className="group/link flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-red-50 text-brand-red transition group-hover/link:bg-brand-red group-hover/link:text-white">
                      <BowlFood weight="fill" className="text-lg" />
                    </div>
                    <span className="font-heading font-semibold text-brand-dark group-hover/link:text-brand-red">
                      Wedding Catering
                    </span>
                  </Link>
                  <Link
                    href="/caterers"
                    className="group/link flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-green-50 text-brand-green transition group-hover/link:bg-brand-green group-hover/link:text-white">
                      <Cake weight="fill" className="text-lg" />
                    </div>
                    <span className="font-heading font-semibold text-brand-dark group-hover/link:text-brand-green">
                      Birthday Parties
                    </span>
                  </Link>
                  <Link
                    href="/caterers"
                    className="group/link flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow-50 text-brand-yellow transition group-hover/link:bg-brand-yellow group-hover/link:text-white">
                      <Buildings weight="fill" className="text-lg" />
                    </div>
                    <span className="font-heading font-semibold text-brand-dark group-hover/link:text-brand-yellow">
                      Corporate Events
                    </span>
                  </Link>
                </div>
                <div className="border-t border-gray-100 bg-gray-50 p-4 text-center">
                  <Link href="/caterers" className="text-sm font-bold text-brand-red hover:text-red-700">
                    View All Services →
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/packages"
              className="group flex cursor-pointer flex-col border-l border-gray-200 px-6"
            >
              <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                For caterers
              </span>
              <span className="font-heading font-medium text-brand-dark transition group-hover:text-brand-red">
                Packages
              </span>
            </Link>

            <Link
              href="/blog"
              className="group flex cursor-pointer flex-col border-l border-gray-200 px-6"
            >
              <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                Read
              </span>
              <span className="font-heading font-medium text-brand-dark transition group-hover:text-brand-red">
                Insights
              </span>
            </Link>

            <Link
              href="/contact"
              className="group flex cursor-pointer flex-col border-l border-gray-200 pl-6 pr-12"
            >
              <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                Get In Touch
              </span>
              <span className="font-heading font-medium text-brand-dark transition group-hover:text-brand-red">
                Contact Us
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/caterers"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-brand-dark shadow-sm transition-all duration-300 hover:scale-110 hover:border-brand-red hover:bg-brand-red hover:text-white md:flex"
              aria-label="Search caterers"
            >
              <MagnifyingGlass className="text-lg" aria-hidden />
            </Link>
            {ready && user ? (
              <div ref={userMenuRef} className="relative hidden md:block">
                <UserAvatarButton
                  user={user}
                  expanded={userMenuOpen}
                  onToggle={() => setUserMenuOpen((v) => !v)}
                  buttonRef={userMenuButtonRef}
                />
                {userMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-[60] mt-2 min-w-[220px] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl ring-1 ring-black/5"
                  >
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-bold text-brand-dark">{user.fullName}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href={profileHref(user)}
                      role="menuitem"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-brand-dark transition hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCircle className="text-brand-red" size={22} weight="duotone" aria-hidden />
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-brand-dark transition hover:bg-gray-50"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                    >
                      <SignOut className="text-gray-500" size={22} aria-hidden />
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : ready ? (
              <>
                <Link
                  href="/login"
                  className="hidden text-sm font-semibold hover:text-brand-red md:inline-block"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-xl sm:px-5"
                >
                  Create an account
                </Link>
              </>
            ) : null}

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-brand-dark md:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="text-xl" /> : <List className="text-xl" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-gray-100 bg-white px-4 pb-5 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              <Link
                href="/caterers"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Browse caterers
              </Link>
              <Link
                href="/#service-categories"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Service categories
              </Link>
              <Link
                href="/packages"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Packages
              </Link>
              <Link
                href="/blog"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Insights
              </Link>
              <Link
                href="/contact"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Contact
              </Link>
              {ready && user ? (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-3 rounded-lg px-4 py-2">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-red-800 text-sm font-bold text-white"
                      aria-hidden
                    >
                      {initialsFromName(user.fullName).slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-brand-dark">{user.fullName}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href={profileHref(user)}
                    className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    <UserCircle className="text-brand-red" size={22} weight="duotone" aria-hidden />
                    Profile
                  </Link>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-brand-dark hover:bg-gray-50"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                  >
                    <SignOut className="text-gray-500" size={22} aria-hidden />
                    Log out
                  </button>
                </div>
              ) : ready ? (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-brand-red px-4 py-3 text-center text-sm font-bold text-white"
                    onClick={() => setOpen(false)}
                  >
                    Create an account
                  </Link>
                </>
              ) : null}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
