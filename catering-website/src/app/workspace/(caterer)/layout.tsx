"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const nav = [
  { href: "/workspace", label: "Overview" },
  { href: "/workspace/business", label: "Business" },
  { href: "/workspace/gallery", label: "Gallery" },
];

export default function CatererWorkspaceShellLayout({ children }: { children: React.ReactNode }) {
  const { ready, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "admin") {
      router.replace("/");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
        Loading…
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-stone-200/90 bg-white py-6 shadow-[1px_0_0_rgb(0_0_0/0.03)] md:flex">
        <div className="px-5 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Caterer</p>
          <p className="mt-1 text-sm font-bold text-stone-900">My business</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {nav.map((item) => {
            const active =
              item.href === "/workspace"
                ? pathname === "/workspace"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-stone-200/90 px-4 pt-4">
          <p className="truncate text-xs font-medium text-stone-500" title={user.email}>
            {user.fullName}
          </p>
          <Link
            href="/"
            className="mt-2 block text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            View public site
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="mt-2 text-xs font-semibold text-stone-500 hover:text-stone-800"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-stone-200/90 bg-white/90 px-4 backdrop-blur md:px-8">
          <h2 className="text-sm font-semibold text-stone-700">Workspace</h2>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm md:hidden"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
