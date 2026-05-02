"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function WorkspaceOverviewPage() {
  const { user } = useAuth();
  const t = user?.tenant;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
        Overview
      </p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
        Hi, {user?.fullName}
      </h1>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        Signed in as <span className="font-medium text-stone-700">{user?.email}</span>
      </p>

      <div className="mt-8 rounded-[var(--radius-xl)] border border-stone-200/80 bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        {t ? (
          <>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Your business</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-stone-500">Display name</dt>
                <dd className="mt-0.5 text-stone-900">{t.name}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-500">Workspace slug</dt>
                <dd className="mt-0.5 font-mono text-stone-900">{t.slug}</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm leading-relaxed text-[var(--foreground-muted)]">
              Subdomain routing and per-tenant databases are not enabled yet. This slug is reserved for
              when you map <span className="font-mono text-stone-700">{t.slug}</span> to a hostname
              (e.g. <span className="font-mono text-stone-700">{t.slug}.yourdomain.com</span>).
            </p>
          </>
        ) : (
          <p className="text-sm text-stone-600">
            No workspace is linked to this account (often older signups). Contact support or register a
            new caterer account to get a tenant record.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/workspace/profile"
          className="rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/25 transition hover:opacity-[0.96]"
        >
          Manage listing
        </Link>
        <Link
          href="/workspace/onboarding"
          className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-[var(--primary)]/30"
        >
          Full onboarding
        </Link>
        <Link
          href="/workspace/gallery"
          className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-[var(--primary)]/30"
        >
          Gallery page
        </Link>
      </div>
    </div>
  );
}
