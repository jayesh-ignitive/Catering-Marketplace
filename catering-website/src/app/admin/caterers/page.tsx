"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminTableSortArrows } from "@/components/admin/AdminTableSortArrows";
import { useAuth } from "@/context/AuthContext";
import {
  type AdminCatererSortDir,
  type AdminCatererSortField,
  type CatererMarketplaceApprovalStatus,
  fetchAdminCaterersList,
  setAdminCatererMarketplaceApproval,
} from "@/lib/admin-api";
import { CaretLeft, CaretRight, Check, MagnifyingGlass, User, X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/hooks/useDebouncedValue";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function initials(fullName: string | null | undefined, email: string | null | undefined): string {
  const n = fullName?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
    }
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (email?.trim()) return email.trim().slice(0, 2).toUpperCase();
  return "—";
}

function defaultSortDir(field: AdminCatererSortField): AdminCatererSortDir {
  if (field === "createdAt" || field === "updatedAt" || field === "profilePublished") return "desc";
  return "asc";
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

function provisionBadgeClass(status: string): string {
  switch (status) {
    case "ready":
      return "bg-emerald-50 text-emerald-800";
    case "failed":
      return "bg-rose-50 text-rose-800";
    default:
      return "bg-amber-50 text-amber-800";
  }
}

function visiblePageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const want = new Set<number>([1, total, current, current - 1, current + 1]);
  const pages = [...want].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}

const adminRowActionBtn =
  "inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md px-2 text-[11px] font-bold leading-none transition disabled:cursor-not-allowed disabled:opacity-50";

function CatererRowActions({
  tenantId,
  ownerUserId,
  pendingReview,
  actionsDisabled,
  onApprove,
  onReject,
}: {
  tenantId: string;
  ownerUserId: string | null;
  pendingReview: boolean;
  actionsDisabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/caterers/${tenantId}`}
        className={`${adminRowActionBtn} bg-brand-red text-white hover:bg-red-700`}
      >
        Review
      </Link>
      {pendingReview ? (
        <>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={onApprove}
            title="Approve listing"
            aria-label="Approve listing"
            className={`${adminRowActionBtn} w-7 bg-emerald-600 px-0 text-white hover:bg-emerald-700`}
          >
            <Check size={14} weight="bold" aria-hidden />
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={onReject}
            title="Reject listing"
            aria-label="Reject listing"
            className={`${adminRowActionBtn} w-7 border border-rose-200 bg-rose-50 px-0 text-rose-700 hover:bg-rose-100`}
          >
            <X size={14} weight="bold" aria-hidden />
          </button>
        </>
      ) : null}
      {ownerUserId ? (
        <Link
          href={`/admin/users/${ownerUserId}`}
          title="View owner account"
          aria-label="View owner account"
          className={`${adminRowActionBtn} w-7 bg-blue-50 px-0 text-blue-600 hover:bg-blue-600 hover:text-white`}
        >
          <User size={14} weight="bold" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function SortableTh({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  field: AdminCatererSortField;
  sortBy: AdminCatererSortField;
  sortDir: AdminCatererSortDir;
  onSort: (field: AdminCatererSortField) => void;
  align?: "left" | "right";
}) {
  const active = sortBy === field;
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
      className={`admin-datatable-th whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        title={active ? `Sorted ${sortDir === "asc" ? "ascending" : "descending"}. Click to reverse.` : `Sort by ${label}`}
        className={`group inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 transition hover:bg-brand-page ${
          align === "right" ? "ml-auto flex-row-reverse" : ""
        }`}
      >
        <span>{label}</span>
        <AdminTableSortArrows active={active} sortDir={sortDir} size={14} />
      </button>
    </th>
  );
}

export default function AdminCaterersListPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<CatererMarketplaceApprovalStatus | "">("");
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<AdminCatererSortField>("createdAt");
  const [sortDir, setSortDir] = useState<AdminCatererSortDir>("desc");

  const debouncedQ = useDebouncedValue(draftQ, ADMIN_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const next = debouncedQ.trim();
    setAppliedQ((prev) => (prev === next ? prev : next));
  }, [debouncedQ]);

  useEffect(() => {
    setPage(1);
  }, [appliedQ, approvalFilter]);

  const listQ = useQuery({
    queryKey: ["admin", "caterers", token, page, appliedQ, approvalFilter, limit, sortBy, sortDir],
    queryFn: () =>
      fetchAdminCaterersList(token!, {
        page,
        limit,
        q: appliedQ || undefined,
        approvalStatus: approvalFilter || undefined,
        sortBy,
        sortDir,
      }),
    enabled: Boolean(token && user?.role === "admin"),
    retry: 1,
  });

  const approvalM = useMutation({
    mutationFn: ({
      tenantId,
      decision,
    }: {
      tenantId: string;
      decision: "approve" | "reject";
    }) => setAdminCatererMarketplaceApproval(token!, tenantId, decision),
    onSuccess: (_, { decision }) => {
      toast.success(decision === "approve" ? "Listing approved and published." : "Listing rejected.");
      void qc.invalidateQueries({ queryKey: ["admin", "caterers"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalPages = useMemo(() => {
    const t = listQ.data?.total ?? 0;
    return Math.max(1, Math.ceil(t / limit));
  }, [listQ.data?.total, limit]);

  const pageButtons = useMemo(() => visiblePageNumbers(page, totalPages), [page, totalPages]);

  function flushSearchNow() {
    const next = draftQ.trim();
    setAppliedQ(next);
    setPage(1);
  }

  function toggleColumnSort(field: AdminCatererSortField) {
    setPage(1);
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(defaultSortDir(field));
    }
  }

  if (listQ.isPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-brand-text-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-red" />
        <p className="text-sm font-semibold">Loading caterers…</p>
      </div>
    );
  }

  if (listQ.isError || !listQ.data) {
    return (
      <div className="admin-panel-card mx-auto max-w-3xl border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <h1 className="text-lg font-bold">Could not load caterers</h1>
        <p className="mt-2 text-sm">Check your connection and admin permissions, then try again.</p>
      </div>
    );
  }

  const { items, total } = listQ.data;
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <section className="mx-auto max-w-[1400px]">
      <AdminBreadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Caterers" }]} />

      <div className="admin-datatable-shell">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-6 pt-6">
          {(
            [
              { value: "", label: "All listings" },
              { value: "pending_review", label: "Pending review" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "draft", label: "Draft" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => {
                setApprovalFilter(opt.value);
                setPage(1);
              }}
              className={`cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition ${
                approvalFilter === opt.value
                  ? "bg-brand-red text-white shadow-sm"
                  : "bg-gray-100 text-brand-text-dark hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-stretch justify-between gap-4 border-b border-gray-100 p-6 md:flex-row md:items-center">
          <label className="flex flex-wrap items-center gap-2 text-sm text-brand-text-muted">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="admin-field-quiet rounded-lg px-3 py-1.5 font-semibold"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </label>

          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center md:max-w-md md:flex-1 lg:max-w-xl">
            <div className="relative min-w-0 flex-1">
              <MagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted"
                size={20}
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search workspace, slug, subdomain, or owner…"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    flushSearchNow();
                  }
                }}
                className="admin-field-quiet w-full py-2.5 pl-10 pr-4"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:justify-end">
              {appliedQ ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraftQ("");
                    setAppliedQ("");
                    setPage(1);
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-brand-text-dark transition hover:bg-brand-page"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead className="admin-datatable-thead sticky top-0 z-[1]">
              <tr>
                <SortableTh label="Workspace" field="name" sortBy={sortBy} sortDir={sortDir} onSort={toggleColumnSort} />
                <SortableTh label="Slug" field="slug" sortBy={sortBy} sortDir={sortDir} onSort={toggleColumnSort} />
                <SortableTh
                  label="Subdomain"
                  field="subdomain"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh
                  label="Owner"
                  field="ownerFullName"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh
                  label="Owner email"
                  field="ownerEmail"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh
                  label="Provision"
                  field="provisionStatus"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <th scope="col" className="admin-datatable-th whitespace-nowrap text-left">
                  Review
                </th>
                <SortableTh
                  label="Live"
                  field="profilePublished"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh
                  label="Created"
                  field="createdAt"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <th scope="col" className="admin-datatable-th whitespace-nowrap text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="admin-datatable-cell py-20 text-center">
                    <p className="text-base font-semibold text-brand-text-dark">No caterers match your filters</p>
                    <p className="mt-1 text-sm text-brand-text-muted">Try a different search or clear the query.</p>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-datatable-cell">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-red to-red-700 text-xs font-bold text-white shadow-inner"
                          aria-hidden
                        >
                          {initials(row.name, row.slug)}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate font-bold text-brand-text-dark">{row.name}</p>
                          <p className="font-mono text-xs text-brand-text-muted">ID · {row.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="admin-datatable-cell max-w-[140px] truncate font-mono text-xs font-semibold">
                      {row.slug}
                    </td>
                    <td className="admin-datatable-cell max-w-[140px] truncate text-brand-text-dark" title={row.subdomain ?? ""}>
                      {row.subdomain ? (
                        <span className="font-mono text-xs">{row.subdomain}</span>
                      ) : (
                        <span className="text-brand-text-muted">—</span>
                      )}
                    </td>
                    <td className="admin-datatable-cell">
                      <p className="max-w-[180px] truncate font-medium text-brand-text-dark">
                        {row.ownerFullName ? row.ownerFullName : <span className="text-brand-text-muted">—</span>}
                      </p>
                    </td>
                    <td className="admin-datatable-cell max-w-[200px] truncate" title={row.ownerEmail ?? ""}>
                      {row.ownerEmail ? row.ownerEmail : <span className="text-brand-text-muted">—</span>}
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${provisionBadgeClass(row.provisionStatus)}`}
                      >
                        {row.provisionStatus}
                      </span>
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${approvalBadgeClass(row.marketplaceApprovalStatus)}`}
                      >
                        {approvalLabel(row.marketplaceApprovalStatus)}
                      </span>
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap">
                      {row.profilePublished ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-brand-text-muted">
                          No
                        </span>
                      )}
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap tabular-nums text-brand-text-muted">
                      {new Date(row.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="admin-datatable-cell w-px whitespace-nowrap py-3 text-right">
                      <CatererRowActions
                        tenantId={row.id}
                        ownerUserId={row.ownerUserId}
                        pendingReview={row.marketplaceApprovalStatus === "pending_review"}
                        actionsDisabled={approvalM.isPending}
                        onApprove={() =>
                          approvalM.mutate({ tenantId: row.id, decision: "approve" })
                        }
                        onReject={() =>
                          approvalM.mutate({ tenantId: row.id, decision: "reject" })
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-4 border-t border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
          <p className="text-center text-sm text-brand-text-muted md:text-left">
            Showing {showingFrom} to {showingTo} of {total} entries
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="admin-pagination-btn disabled:pointer-events-none disabled:opacity-35"
            >
              <CaretLeft size={18} weight="bold" aria-hidden />
            </button>
            {totalPages > 0 &&
              pageButtons.map((item, idx) =>
                item === "gap" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="select-none px-2 text-sm font-medium text-brand-text-muted"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    aria-current={item === page ? "page" : undefined}
                    className={`admin-pagination-btn min-w-[2.25rem] font-bold tabular-nums ${
                      item === page ? "admin-pagination-btn--active" : ""
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
              className="admin-pagination-btn disabled:pointer-events-none disabled:opacity-35"
            >
              <CaretRight size={18} weight="bold" aria-hidden />
            </button>
          </nav>
        </footer>
      </div>
    </section>
  );
}
