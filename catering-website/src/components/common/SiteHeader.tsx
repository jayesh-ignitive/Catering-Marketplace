"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

const links = [
  { label: "Home", href: "/" },
  { label: "Caterers", href: "/caterers" },
  { label: "Categories", href: "/#service-categories" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Trust", href: "/#trust" },
  { label: "Reviews", href: "/#testimonials" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, ready, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 shadow-[0_1px_0_rgb(195_85_41/0.08)] backdrop-blur-xl backdrop-saturate-150">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-90"
        aria-hidden
      />
      <div className="container-max flex min-h-14 items-center justify-between gap-4 py-3">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--orange-deep)] text-lg font-extrabold text-white shadow-md shadow-[var(--primary)]/25 transition group-hover:shadow-lg group-hover:shadow-[var(--primary)]/30"
            aria-hidden
          >
            C
          </span>
          <span className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">
            <span className="text-[var(--primary)]">Catering</span>
            <span className="font-semibold text-stone-600"> Website</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/caterers"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-[var(--primary)]/30 hover:text-[var(--primary)]"
          >
            Browse
          </Link>
          <Link
            href="/caterers"
            className="rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/25 transition hover:opacity-[0.96] hover:shadow-lg hover:shadow-[var(--primary)]/30"
          >
            Find caterers
          </Link>
          {ready && user ? (
            <>
              <span
                className="max-w-[10rem] truncate text-sm font-semibold text-stone-600"
                title={user.email}
              >
                {user.fullName}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:text-stone-900"
              >
                Sign out
              </button>
            </>
          ) : ready ? (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-[var(--primary)]/30 hover:text-[var(--primary)]"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-transparent bg-[var(--primary-soft)] px-4 py-2.5 text-sm font-bold text-[var(--primary)] transition hover:bg-[color-mix(in_srgb,var(--primary)_22%,white)]"
              >
                List your business
              </Link>
            </>
          ) : null}
        </div>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-sm md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-stone-100 bg-white/95 px-4 pb-5 pt-2 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {ready && user ? (
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  className="w-full rounded-xl border border-stone-200 bg-white py-3.5 text-center text-sm font-semibold text-stone-800 shadow-sm"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  Sign out ({user.fullName})
                </button>
              </div>
            ) : ready ? (
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-stone-200 bg-white py-3.5 text-center text-sm font-semibold text-stone-800 shadow-sm"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] py-3.5 text-center text-sm font-bold text-white shadow-md"
                  onClick={() => setOpen(false)}
                >
                  List your business
                </Link>
              </div>
            ) : null}
            <Link
              href="/caterers"
              className="mt-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] py-3.5 text-center text-sm font-bold text-white shadow-md"
              onClick={() => setOpen(false)}
            >
              Find caterers
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
