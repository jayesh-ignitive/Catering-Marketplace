"use client";

import { useAuth } from "@/context/AuthContext";
import type { AdminTenantSnapshot } from "@/lib/admin-api";
import { fetchAdminUserDetail } from "@/lib/admin-api";
import { ArrowLeft } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

function DlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-stone-100 py-3 last:border-b-0 sm:grid-cols-[minmax(160px,220px)_1fr] sm:gap-6">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className="break-words text-sm text-stone-900">{children}</dd>
    </div>
  );
}

function YesNo({ v }: { v: boolean }) {
  return (
    <span className={v ? "font-semibold text-emerald-600" : "font-semibold text-stone-400"}>{v ? "Yes" : "No"}</span>
  );
}

function TenantSection({ title, t }: { title: string; t: AdminTenantSnapshot | null }) {
  if (!t) {
    return (
      <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-stone-900">{title}</h2>
        <p className="mt-2 text-sm text-stone-500">None linked.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-stone-900">{title}</h2>
      <dl className="mt-2">
        <DlRow label="Tenant ID">{t.id}</DlRow>
        <DlRow label="Business name">{t.name}</DlRow>
        <DlRow label="Slug">{t.slug}</DlRow>
        <DlRow label="Subdomain">{t.subdomain ?? "—"}</DlRow>
        <DlRow label="DB name">{t.dbName ?? "—"}</DlRow>
        <DlRow label="Provision status">{t.provisionStatus}</DlRow>
        <DlRow label="Profile published">
          <YesNo v={t.profilePublished} />
        </DlRow>
        <DlRow label="Created">{new Date(t.createdAt).toLocaleString()}</DlRow>
        <DlRow label="Updated">{new Date(t.updatedAt).toLocaleString()}</DlRow>
        <DlRow label="Profile options (JSON)">
          {t.profileOptions && Object.keys(t.profileOptions).length > 0 ? (
            <pre className="max-h-48 overflow-auto rounded-lg bg-stone-900 p-3 text-xs text-stone-100">
              {JSON.stringify(t.profileOptions, null, 2)}
            </pre>
          ) : (
            <span className="text-stone-400">—</span>
          )}
        </DlRow>
      </dl>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { token, user } = useAuth();

  const detailQ = useQuery({
    queryKey: ["admin", "users", id, token],
    queryFn: () => fetchAdminUserDetail(token!, id),
    enabled: Boolean(token && user?.role === "admin" && id),
    retry: 1,
  });

  if (!id) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-semibold">Invalid user id.</p>
        <Link href="/admin/users" className="mt-3 inline-block text-sm font-bold underline">
          Back to users
        </Link>
      </div>
    );
  }

  if (detailQ.isPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-stone-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-brand-red" />
        <p className="text-sm font-semibold">Loading user…</p>
      </div>
    );
  }

  if (detailQ.isError || !detailQ.data) {
    const missing = detailQ.error instanceof Error && detailQ.error.message === "not_found";
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <h1 className="text-lg font-bold">{missing ? "User not found" : "Could not load user"}</h1>
        <Link href="/admin/users" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-red">
          <ArrowLeft size={16} weight="bold" aria-hidden />
          Back to users
        </Link>
      </div>
    );
  }

  const u = detailQ.data;
  const mp = u.marketplaceProfile;

  return (
    <section className="mx-auto max-w-4xl">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-bold text-brand-red hover:underline"
      >
        <ArrowLeft size={18} weight="bold" aria-hidden />
        All users
      </Link>

      <div className="mt-6 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400">User record</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">{u.fullName}</h1>
        <p className="mt-1 font-mono text-sm text-stone-500">{u.email}</p>
      </div>

      <div className="mt-6 grid gap-6">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900">Identity & contact</h2>
          <dl className="mt-2">
            <DlRow label="User ID">{u.id}</DlRow>
            <DlRow label="Email">{u.email}</DlRow>
            <DlRow label="Full name">{u.fullName}</DlRow>
            <DlRow label="Business name">{u.businessName ?? "—"}</DlRow>
            <DlRow label="Phone country code">{u.phoneCountryCode ?? "—"}</DlRow>
            <DlRow label="Phone number">{u.phoneNumber ?? "—"}</DlRow>
            <DlRow label="Role">
              <span className="font-semibold capitalize">{u.role}</span>
            </DlRow>
            <DlRow label="Created">{new Date(u.createdAt).toLocaleString()}</DlRow>
            <DlRow label="Updated">{new Date(u.updatedAt).toLocaleString()}</DlRow>
          </dl>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900">Email verification & auth flags</h2>
          <p className="mt-1 text-xs text-stone-500">
            Secrets (password, OTP hash, verification token value) are never exposed via this API.
          </p>
          <dl className="mt-3">
            <DlRow label="Email verified">
              <YesNo v={u.emailVerified} />
            </DlRow>
            <DlRow label="Verified at">{u.emailVerifiedAt ? new Date(u.emailVerifiedAt).toLocaleString() : "—"}</DlRow>
            <DlRow label="Verification expiry">
              {u.emailVerificationExpiresAt ? new Date(u.emailVerificationExpiresAt).toLocaleString() : "—"}
            </DlRow>
            <DlRow label="Has unused email link token">
              <YesNo v={u.hasEmailVerificationLink} />
            </DlRow>
            <DlRow label="Has pending email OTP on file">
              <YesNo v={u.hasPendingEmailOtp} />
            </DlRow>
          </dl>
        </div>

        <TenantSection title="Workspace (tenant_id on user)" t={u.tenant} />
        <TenantSection title="Owned tenant (tenants.user_id)" t={u.ownedTenant} />

        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900">Marketplace profile</h2>
          {!mp ? (
            <p className="mt-2 text-sm text-stone-500">No caterer marketplace profile row for this workspace.</p>
          ) : (
            <dl className="mt-3">
              <DlRow label="Tenant ID">{mp.tenantId}</DlRow>
              <DlRow label="Public slug (URL segment)">{mp.profileSlug}</DlRow>
              <DlRow label="Published on marketplace">
                <YesNo v={mp.published} />
              </DlRow>
              <DlRow label="Average rating">{mp.avgRating}</DlRow>
              <DlRow label="Review count">{mp.reviewCount}</DlRow>
              <DlRow label="Tagline">{mp.tagline ?? "—"}</DlRow>
              <DlRow label="About (preview)">{mp.aboutPreview ?? "—"}</DlRow>
              <DlRow label="Hero image URL">
                {mp.heroImageUrl ? (
                  <span className="break-all font-mono text-xs text-stone-600">{mp.heroImageUrl}</span>
                ) : (
                  "—"
                )}
              </DlRow>
              <DlRow label="Profile created">{new Date(mp.createdAt).toLocaleString()}</DlRow>
              <DlRow label="Profile updated">{new Date(mp.updatedAt).toLocaleString()}</DlRow>
              <DlRow label="Public page">
                <Link
                  href={`/caterers/${encodeURIComponent(mp.profileSlug)}`}
                  className="font-semibold text-brand-red hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open /caterers/{mp.profileSlug}
                </Link>
              </DlRow>
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
