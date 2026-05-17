"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { useAuth } from "@/context/AuthContext";
import {
  type AdminCatererReviewDetail,
  type CatererMarketplaceApprovalStatus,
  fetchAdminCatererReviewDetail,
  setAdminCatererMarketplaceApproval,
} from "@/lib/admin-api";
import { ArrowLeft, ArrowSquareOut, Check, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

function DlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:grid-cols-[minmax(160px,220px)_1fr] sm:gap-6">
      <dt className="text-[11px] font-bold uppercase tracking-[0.05em] text-brand-text-muted">{label}</dt>
      <dd className="break-words text-sm text-brand-text-dark">{children}</dd>
    </div>
  );
}

function approvalBadgeClass(status: CatererMarketplaceApprovalStatus): string {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-800";
    case "pending_review":
      return "bg-amber-50 text-amber-900";
    case "rejected":
      return "bg-rose-50 text-rose-800";
    default:
      return "bg-gray-100 text-brand-text-muted";
  }
}

function approvalLabel(status: CatererMarketplaceApprovalStatus): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending_review":
      return "Pending review";
    case "rejected":
      return "Rejected";
    default:
      return "Draft";
  }
}

function formatPriceBand(band: string | null): string {
  if (!band) return "—";
  switch (band) {
    case "budget":
      return "Budget";
    case "mid":
      return "Mid-range";
    case "premium":
      return "Premium";
    case "custom":
      return "Custom";
    default:
      return band;
  }
}

function formatInr(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function missingFieldLabel(field: string): string {
  switch (field) {
    case "city":
      return "City";
    case "about":
      return "About";
    case "category":
      return "Categories";
    case "services":
      return "Services";
    case "keywords":
      return "Keywords";
    case "gallery":
      return "Gallery photos";
    case "banner":
      return "Banner image";
    default:
      return field;
  }
}

function ReviewImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

export function AdminCatererReviewDetailView({ tenantId }: { tenantId: string }) {
  const { token, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["admin", "caterers", "review", tenantId, token],
    queryFn: () => fetchAdminCatererReviewDetail(token!, tenantId),
    enabled: Boolean(token && user?.role === "admin" && tenantId),
    retry: 1,
  });

  const approvalM = useMutation({
    mutationFn: (decision: "approve" | "reject") =>
      setAdminCatererMarketplaceApproval(token!, tenantId, decision),
    onSuccess: (_, decision) => {
      toast.success(decision === "approve" ? "Listing approved and published." : "Listing rejected.");
      void qc.invalidateQueries({ queryKey: ["admin", "caterers"] });
      void qc.invalidateQueries({ queryKey: ["admin", "caterers", "review", tenantId] });
      router.push("/admin/caterers");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (detailQ.isPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-brand-text-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-red" />
        <p className="text-sm font-semibold">Loading profile for review…</p>
      </div>
    );
  }

  if (detailQ.isError || !detailQ.data) {
    const missing = detailQ.error instanceof Error && detailQ.error.message === "not_found";
    return (
      <div className="admin-panel-card mx-auto max-w-3xl border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <h1 className="text-lg font-bold">{missing ? "Caterer not found" : "Could not load profile"}</h1>
        <Link href="/admin/caterers" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-red">
          <ArrowLeft size={16} weight="bold" aria-hidden />
          Back to caterers
        </Link>
      </div>
    );
  }

  const d = detailQ.data;
  const phone =
    d.owner?.phoneCountryCode && d.owner?.phoneNumber
      ? `${d.owner.phoneCountryCode} ${d.owner.phoneNumber}`
      : d.owner?.phoneNumber ?? "—";

  return (
    <section className="mx-auto max-w-5xl">
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Caterers", href: "/admin/caterers" },
          { label: d.workspaceName },
        ]}
      />

      <Link
        href="/admin/caterers"
        className="inline-flex items-center gap-2 text-sm font-bold text-brand-red transition hover:underline"
      >
        <ArrowLeft size={18} weight="bold" aria-hidden />
        All caterers
      </Link>

      <div className="admin-panel-card mt-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.05em] text-brand-text-muted">
              Cater profile review
            </p>
            <h1 className="font-heading mt-2 text-2xl font-bold tracking-tight text-brand-text-dark">
              {d.workspaceName}
            </h1>
            <p className="mt-1 font-mono text-sm text-brand-text-muted">/{d.profileSlug}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${approvalBadgeClass(d.approvalStatus)}`}
              >
                {approvalLabel(d.approvalStatus)}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  d.published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-brand-text-muted"
                }`}
              >
                {d.published ? "Live on marketplace" : "Not published"}
              </span>
              {!d.completion.isComplete ? (
                <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                  Profile incomplete
                </span>
              ) : null}
            </div>
          </div>

          {d.approvalStatus === "pending_review" ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                disabled={approvalM.isPending}
                onClick={() => approvalM.mutate("approve")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check weight="bold" size={18} aria-hidden />
                Approve listing
              </button>
              <button
                type="button"
                disabled={approvalM.isPending}
                onClick={() => approvalM.mutate("reject")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X weight="bold" size={18} aria-hidden />
                Reject
              </button>
            </div>
          ) : null}
        </div>

        <dl className="mt-6 grid gap-0 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <DlRow label="Submitted for review">
            {d.submittedForReviewAt
              ? new Date(d.submittedForReviewAt).toLocaleString()
              : "—"}
          </DlRow>
          <DlRow label="Last reviewed">
            {d.reviewedAt ? new Date(d.reviewedAt).toLocaleString() : "—"}
          </DlRow>
          <DlRow label="Public profile">
            <Link
              href={`/caterers/${encodeURIComponent(d.profileSlug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-brand-red hover:underline"
            >
              View public page
              <ArrowSquareOut size={14} aria-hidden />
            </Link>
          </DlRow>
          <DlRow label="Provision">{d.provisionStatus}</DlRow>
        </dl>
      </div>

      {!d.completion.isComplete ? (
        <div className="admin-panel-card mt-6 border border-amber-200 bg-amber-50/80 p-5">
          <p className="text-sm font-bold text-amber-950">Missing required fields</p>
          <p className="mt-1 text-sm text-amber-900/90">
            The caterer submitted before completing:{" "}
            {d.completion.missingFields.map(missingFieldLabel).join(", ")}.
          </p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="admin-panel-card p-5">
          <h2 className="text-sm font-bold text-brand-text-dark">Account owner</h2>
          {!d.owner ? (
            <p className="mt-2 text-sm text-brand-text-muted">No owner linked.</p>
          ) : (
            <dl className="mt-3">
              <DlRow label="Name">{d.owner.fullName}</DlRow>
              <DlRow label="Email">{d.owner.email}</DlRow>
              <DlRow label="Business name">{d.owner.businessName ?? "—"}</DlRow>
              <DlRow label="Phone">{phone}</DlRow>
              <DlRow label="User ID">
                <Link href={`/admin/users/${d.owner.id}`} className="font-semibold text-brand-red hover:underline">
                  {d.owner.id}
                </Link>
              </DlRow>
            </dl>
          )}
        </div>

        <div className="admin-panel-card p-5">
          <h2 className="text-sm font-bold text-brand-text-dark">Workspace</h2>
          <dl className="mt-3">
            <DlRow label="Display name">{d.workspaceName}</DlRow>
            <DlRow label="Slug">{d.workspaceSlug}</DlRow>
            <DlRow label="Subdomain">{d.subdomain ?? "—"}</DlRow>
            <DlRow label="Tenant ID">
              <span className="font-mono text-xs">{d.tenantId}</span>
            </DlRow>
          </dl>
        </div>
      </div>

      <div className="admin-panel-card mt-6 p-5">
        <h2 className="text-sm font-bold text-brand-text-dark">Business information</h2>
        <dl className="mt-3">
          <DlRow label="City">{d.business.cityName ?? "—"}</DlRow>
          <DlRow label="Address">{d.business.streetAddress ?? "—"}</DlRow>
          <DlRow label="Tagline">{d.business.tagline ?? "—"}</DlRow>
          <DlRow label="About">
            {d.business.about ? (
              <p className="whitespace-pre-wrap leading-relaxed">{d.business.about}</p>
            ) : (
              "—"
            )}
          </DlRow>
          <DlRow label="Years in business">
            {d.business.yearsInBusiness != null ? String(d.business.yearsInBusiness) : "—"}
          </DlRow>
          <DlRow label="Guest capacity">
            {d.business.capacityGuestMin != null || d.business.capacityGuestMax != null
              ? `${d.business.capacityGuestMin ?? "—"} – ${d.business.capacityGuestMax ?? "—"} guests`
              : "—"}
          </DlRow>
          <DlRow label="Price band">{formatPriceBand(d.business.priceBand)}</DlRow>
          <DlRow label="Price from (per guest)">{formatInr(d.business.priceFrom)}</DlRow>
        </dl>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="admin-panel-card p-5">
          <h2 className="text-sm font-bold text-brand-text-dark">Categories & services</h2>
          <p className="mt-1 text-xs text-brand-text-muted">What this caterer offers on the marketplace.</p>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.05em] text-brand-text-muted">
            Categories
          </p>
          {d.categories.length === 0 ? (
            <p className="mt-2 text-sm text-brand-text-muted">None selected.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {d.categories.map((c) => (
                <li
                  key={c.code}
                  className="rounded-full bg-brand-page px-3 py-1 text-xs font-semibold text-brand-text-dark"
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.05em] text-brand-text-muted">
            Service offerings
          </p>
          {d.serviceOfferings.length === 0 ? (
            <p className="mt-2 text-sm text-brand-text-muted">None selected.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {d.serviceOfferings.map((s) => (
                <li key={s.id} className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm font-medium">
                  {s.name}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.05em] text-brand-text-muted">
            Search keywords
          </p>
          {d.keywords.length === 0 ? (
            <p className="mt-2 text-sm text-brand-text-muted">None added.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {d.keywords.map((kw) => (
                <li
                  key={kw}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-brand-text-dark"
                >
                  {kw}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="admin-panel-card p-5">
          <h2 className="text-sm font-bold text-brand-text-dark">Portfolio</h2>
          <p className="mt-1 text-xs text-brand-text-muted">Banner and gallery as customers will see them.</p>

          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.05em] text-brand-text-muted">Banner</p>
          {d.portfolio.heroImageUrl ? (
            <ReviewImage
              src={d.portfolio.heroImageUrl}
              alt="Listing banner"
              className="mt-2 aspect-[21/9] max-h-56 w-full rounded-xl ring-1 ring-gray-200"
            />
          ) : (
            <p className="mt-2 text-sm text-brand-text-muted">No banner uploaded.</p>
          )}

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.05em] text-brand-text-muted">
            Gallery ({d.portfolio.galleryImageUrls.length})
          </p>
          {d.portfolio.galleryImageUrls.length === 0 ? (
            <p className="mt-2 text-sm text-brand-text-muted">No gallery photos.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {d.portfolio.galleryImageUrls.map((url, idx) => (
                <ReviewImage
                  key={`${url}-${idx}`}
                  src={url}
                  alt={`Gallery photo ${idx + 1}`}
                  className="aspect-[4/3] rounded-lg ring-1 ring-gray-200"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-brand-text-muted">
        Profile record updated {new Date(d.profileUpdatedAt).toLocaleString()}
      </p>
    </section>
  );
}
