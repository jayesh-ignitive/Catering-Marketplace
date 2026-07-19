"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { useAuth } from "@/context/AuthContext";
import type { AdminTenantSnapshot, AdminUserDetail } from "@/lib/admin-api";
import { fetchAdminUserDetail } from "@/lib/admin-api";
import { resolveCateringImageDisplayUrl } from "@/lib/catering-api";
import {
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  Database,
  Envelope,
  Phone,
  Storefront,
  UserCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

function DlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:grid-cols-[minmax(160px,220px)_1fr] sm:gap-6">
      <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-brand-text-muted">{label}</dt>
      <dd className="break-words text-sm text-brand-text-dark">{children}</dd>
    </div>
  );
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-violet-50 text-violet-800";
    case "caterer":
      return "bg-brand-red-light text-brand-red";
    default:
      return "bg-gray-100 text-brand-text-muted";
  }
}

function provisionBadgeClass(status: string): string {
  switch (status) {
    case "ready":
      return "bg-emerald-50 text-emerald-800";
    case "failed":
      return "bg-rose-50 text-rose-800";
    default:
      return "bg-amber-50 text-amber-900";
  }
}

function provisionLabel(status: string): string {
  switch (status) {
    case "ready":
      return "Database ready";
    case "failed":
      return "Provision failed";
    case "pending":
      return "Not provisioned";
    default:
      return status;
  }
}

function formatPhone(country: string | null, number: string | null): string {
  if (!number) return "—";
  return country ? `${country} ${number}` : number;
}

function TenantCard({
  title,
  subtitle,
  tenant,
  catererReviewHref,
}: {
  title: string;
  subtitle: string;
  tenant: AdminTenantSnapshot;
  catererReviewHref?: string;
}) {
  return (
    <div className="admin-panel-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-brand-text-dark">{title}</h2>
          <p className="mt-1 text-xs text-brand-text-muted">{subtitle}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${provisionBadgeClass(tenant.provisionStatus)}`}
        >
          {provisionLabel(tenant.provisionStatus)}
        </span>
      </div>
      <dl className="mt-3">
        <DlRow label="Business name">{tenant.name}</DlRow>
        <DlRow label="Slug">
          <span className="font-mono text-xs">{tenant.slug}</span>
        </DlRow>
        <DlRow label="Subdomain">{tenant.subdomain ?? "—"}</DlRow>
        <DlRow label="Database name">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
            <Database size={14} className="text-brand-text-muted" aria-hidden />
            {tenant.dbName ?? "—"}
          </span>
        </DlRow>
        <DlRow label="Marketplace published">
          {tenant.profilePublished ? (
            <span className="font-semibold text-emerald-600">Yes</span>
          ) : (
            <span className="font-semibold text-brand-text-muted">No</span>
          )}
        </DlRow>
        <DlRow label="Tenant ID">
          <span className="font-mono text-xs">{tenant.id}</span>
        </DlRow>
        <DlRow label="Created">{new Date(tenant.createdAt).toLocaleString()}</DlRow>
        <DlRow label="Updated">{new Date(tenant.updatedAt).toLocaleString()}</DlRow>
        {catererReviewHref ? (
          <DlRow label="Admin review">
            <Link
              href={catererReviewHref}
              className="inline-flex items-center gap-1 font-semibold text-brand-red hover:underline"
            >
              Open caterer review
              <ArrowSquareOut size={14} aria-hidden />
            </Link>
          </DlRow>
        ) : null}
      </dl>
    </div>
  );
}

function UserDetailContent({ u }: { u: AdminUserDetail }) {
  const phone = formatPhone(u.phoneCountryCode, u.phoneNumber);
  const primaryTenant = u.tenant ?? u.ownedTenant;
  const tenantId = primaryTenant?.id ?? u.tenantId;
  const isCaterer = u.role === "caterer";
  const catererReviewHref =
    isCaterer && tenantId ? `/admin/caterers/${encodeURIComponent(tenantId)}` : undefined;
  const sameTenant =
    u.tenant && u.ownedTenant && u.tenant.id === u.ownedTenant.id;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    u.fullName,
  )}&background=5b3e18&color=ffffff&bold=true`;

  return (
    <section className="mx-auto max-w-5xl">
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: u.fullName },
        ]}
      />

      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-bold text-brand-red transition hover:underline"
      >
        <ArrowLeft size={18} weight="bold" aria-hidden />
        All users
      </Link>

      <div className="admin-panel-card mt-6 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 ring-gray-100">
            <Image
              src={avatarUrl}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.05em] text-brand-text-muted">
              User account
            </p>
            <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-brand-text-dark">
              {u.fullName}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-brand-text-muted">
              <span className="inline-flex items-center gap-1">
                <Envelope size={16} aria-hidden />
                {u.email}
              </span>
              {phone !== "—" ? (
                <span className="inline-flex items-center gap-1">
                  <Phone size={16} aria-hidden />
                  {phone}
                </span>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleBadgeClass(u.role)}`}
              >
                {u.role}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  u.emailVerified
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-900"
                }`}
              >
                {u.emailVerified ? (
                  <CheckCircle size={14} weight="fill" aria-hidden />
                ) : (
                  <XCircle size={14} weight="fill" aria-hidden />
                )}
                {u.emailVerified ? "Email verified" : "Email not verified"}
              </span>
              {u.businessName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-brand-text-dark">
                  <Storefront size={14} aria-hidden />
                  {u.businessName}
                </span>
              ) : null}
            </div>
          </div>

          {catererReviewHref ? (
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <Link
                href={catererReviewHref}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-red/20 transition hover:bg-red-700"
              >
                <UserCircle size={18} weight="bold" aria-hidden />
                Caterer review
              </Link>
            </div>
          ) : null}
        </div>

        <dl className="mt-6 grid gap-0 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <DlRow label="User ID">
            <span className="font-mono text-xs">{u.id}</span>
          </DlRow>
          <DlRow label="Joined">{new Date(u.createdAt).toLocaleString()}</DlRow>
          <DlRow label="Last updated">{new Date(u.updatedAt).toLocaleString()}</DlRow>
          <DlRow label="Workspace slug">
            {u.tenantSlug ? (
              <span className="font-mono text-xs">/{u.tenantSlug}</span>
            ) : (
              "—"
            )}
          </DlRow>
        </dl>
      </div>

      {!u.emailVerified ? (
        <div className="admin-panel-card mt-6 border border-amber-200 bg-amber-50/80 p-5">
          <p className="text-sm font-bold text-amber-950">Email not verified</p>
          <p className="mt-1 text-sm text-amber-900/90">
            This account cannot sign in until email verification completes.
            {u.hasPendingEmailOtp ? " A verification OTP is on file." : null}
            {u.hasEmailVerificationLink ? " An unused verification link token exists." : null}
          </p>
          {u.emailVerificationExpiresAt ? (
            <p className="mt-2 text-xs text-amber-800">
              Verification expires {new Date(u.emailVerificationExpiresAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="admin-panel-card p-5">
          <h2 className="text-sm font-bold text-brand-text-dark">Contact & identity</h2>
          <dl className="mt-3">
            <DlRow label="Full name">{u.fullName}</DlRow>
            <DlRow label="Email">{u.email}</DlRow>
            <DlRow label="Business name">{u.businessName ?? "—"}</DlRow>
            <DlRow label="Phone">{phone}</DlRow>
            <DlRow label="Role">
              <span className="font-semibold capitalize">{u.role}</span>
            </DlRow>
          </dl>
        </div>

        <div className="admin-panel-card p-5">
          <h2 className="text-sm font-bold text-brand-text-dark">Verification & security</h2>
          <p className="mt-1 text-xs text-brand-text-muted">
            Passwords and OTP secrets are never exposed through the admin API.
          </p>
          <dl className="mt-3">
            <DlRow label="Verified at">
              {u.emailVerifiedAt ? new Date(u.emailVerifiedAt).toLocaleString() : "—"}
            </DlRow>
            <DlRow label="Pending email OTP">
              {u.hasPendingEmailOtp ? (
                <span className="font-semibold text-amber-700">Yes</span>
              ) : (
                <span className="text-brand-text-muted">No</span>
              )}
            </DlRow>
            <DlRow label="Unused link token">
              {u.hasEmailVerificationLink ? (
                <span className="font-semibold text-amber-700">Yes</span>
              ) : (
                <span className="text-brand-text-muted">No</span>
              )}
            </DlRow>
            <DlRow label="Verification expiry">
              {u.emailVerificationExpiresAt
                ? new Date(u.emailVerificationExpiresAt).toLocaleString()
                : "—"}
            </DlRow>
          </dl>
        </div>
      </div>

      {primaryTenant ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {sameTenant || !u.tenant ? (
            <TenantCard
              title={u.tenant ? "Linked workspace" : "Owned workspace"}
              subtitle={
                sameTenant
                  ? "Tenant linked on the user record and as workspace owner."
                  : "Tenant where this user is the registered owner."
              }
              tenant={primaryTenant}
              catererReviewHref={catererReviewHref}
            />
          ) : (
            <>
              <TenantCard
                title="Linked workspace"
                subtitle="Tenant attached to this user account (users.tenant_id)."
                tenant={u.tenant}
                catererReviewHref={catererReviewHref}
              />
              {u.ownedTenant && u.ownedTenant.id !== u.tenant.id ? (
                <TenantCard
                  title="Owned workspace"
                  subtitle="Tenant where this user is owner (tenants.user_id)."
                  tenant={u.ownedTenant}
                  catererReviewHref={`/admin/caterers/${encodeURIComponent(u.ownedTenant.id)}`}
                />
              ) : null}
            </>
          )}
        </div>
      ) : (
        <div className="admin-panel-card mt-6 p-5">
          <h2 className="text-sm font-bold text-brand-text-dark">Workspace</h2>
          <p className="mt-2 text-sm text-brand-text-muted">No tenant linked to this account.</p>
        </div>
      )}

      <div className="admin-panel-card mt-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-brand-text-dark">Marketplace listing</h2>
            <p className="mt-1 text-xs text-brand-text-muted">
              Public caterer profile as shown on the marketplace.
            </p>
          </div>
          {u.marketplaceProfile?.published ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Live on marketplace
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-brand-text-muted">
              Not published
            </span>
          )}
        </div>

        {!u.marketplaceProfile ? (
          <p className="mt-4 text-sm text-brand-text-muted">
            No marketplace profile row for this user&apos;s workspace.
          </p>
        ) : (
          <>
            {u.marketplaceProfile.heroImageUrl ? (
              <div className="relative mt-4 aspect-[21/9] max-h-56 w-full overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveCateringImageDisplayUrl(u.marketplaceProfile.heroImageUrl)}
                  alt="Listing banner"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <dl className="mt-4">
              <DlRow label="Public slug">
                <span className="font-mono text-xs">/caterers/{u.marketplaceProfile.profileSlug}</span>
              </DlRow>
              <DlRow label="Tagline">{u.marketplaceProfile.tagline ?? "—"}</DlRow>
              <DlRow label="About">
                {u.marketplaceProfile.aboutPreview ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-brand-text-muted">
                    {u.marketplaceProfile.aboutPreview}
                  </p>
                ) : (
                  "—"
                )}
              </DlRow>
              <DlRow label="Average rating">{u.marketplaceProfile.avgRating}</DlRow>
              <DlRow label="Review count">{u.marketplaceProfile.reviewCount}</DlRow>
              <DlRow label="Profile created">
                {new Date(u.marketplaceProfile.createdAt).toLocaleString()}
              </DlRow>
              <DlRow label="Profile updated">
                {new Date(u.marketplaceProfile.updatedAt).toLocaleString()}
              </DlRow>
              <DlRow label="Public page">
                <Link
                  href={`/caterers/${encodeURIComponent(u.marketplaceProfile.profileSlug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-brand-red hover:underline"
                >
                  View public page
                  <ArrowSquareOut size={14} aria-hidden />
                </Link>
              </DlRow>
            </dl>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-brand-text-muted">
        Account record updated {new Date(u.updatedAt).toLocaleString()}
      </p>
    </section>
  );
}

export function AdminUserDetailView({ userId }: { userId: string }) {
  const { token, user } = useAuth();

  const detailQ = useQuery({
    queryKey: ["admin", "users", userId, token],
    queryFn: () => fetchAdminUserDetail(token!, userId),
    enabled: Boolean(token && user?.role === "admin" && userId),
    retry: 1,
  });

  if (!userId) {
    return (
      <div className="admin-panel-card border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <p className="font-semibold">Invalid user id.</p>
        <Link href="/admin/users" className="mt-3 inline-block text-sm font-bold text-brand-red underline">
          Back to users
        </Link>
      </div>
    );
  }

  if (detailQ.isPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-brand-text-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-red" />
        <p className="text-sm font-semibold">Loading user…</p>
      </div>
    );
  }

  if (detailQ.isError || !detailQ.data) {
    const missing = detailQ.error instanceof Error && detailQ.error.message === "not_found";
    return (
      <div className="admin-panel-card mx-auto max-w-3xl border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <h1 className="text-lg font-bold">{missing ? "User not found" : "Could not load user"}</h1>
        <Link href="/admin/users" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-red">
          <ArrowLeft size={16} weight="bold" aria-hidden />
          Back to users
        </Link>
      </div>
    );
  }

  return <UserDetailContent u={detailQ.data} />;
}
