"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminTableSortArrows } from "@/components/admin/AdminTableSortArrows";
import { useAuth } from "@/context/AuthContext";
import {
  type AdminCatererSortDir,
  type AdminCatererSortField,
  fetchAdminCaterersList,
} from "@/lib/admin-api";
import { ArrowRight, CaretLeft, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
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
  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
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
  }, [appliedQ]);

  const listQ = useQuery({
    queryKey: ["admin", "caterers", token, page, appliedQ, limit, sortBy, sortDir],
    queryFn: () =>
      fetchAdminCaterersList(token!, {
        page,
        limit,
        q: appliedQ || undefined,
        sortBy,
        sortDir,
      }),
    enabled: Boolean(token && user?.role === "admin"),
    retry: 1,
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
                <SortableTh
                  label="Published"
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
                  <td colSpan={9} className="admin-datatable-cell py-20 text-center">
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
                    <td className="admin-datatable-cell whitespace-nowrap text-right">
                      {row.ownerUserId ? (
                        <Link
                          href={`/admin/users/${row.ownerUserId}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-2 text-xs font-bold text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
                        >
                          Owner
                          <ArrowRight size={14} weight="bold" aria-hidden />
                        </Link>
                      ) : (
                        <span className="text-xs text-brand-text-muted">—</span>
                      )}
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
