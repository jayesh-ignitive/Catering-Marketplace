"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { useAuth } from "@/context/AuthContext";
import { type AdminUserSortDir, type AdminUserSortField, fetchAdminUsersList } from "@/lib/admin-api";
import { ArrowRight, CaretDown, CaretLeft, CaretRight, CaretUp, MagnifyingGlass } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/hooks/useDebouncedValue";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function formatPhone(cc: string | null, num: string | null): string {
  if (!num && !cc) return "—";
  return [cc, num].filter(Boolean).join(" ");
}

function initials(fullName: string | null | undefined, email: string): string {
  const n = fullName?.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
    }
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function defaultSortDir(field: AdminUserSortField): AdminUserSortDir {
  return field === "createdAt" ? "desc" : "asc";
}

/** Page indices to show as numbered buttons (with ellipsis gaps). */
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
  field: AdminUserSortField;
  sortBy: AdminUserSortField;
  sortDir: AdminUserSortDir;
  onSort: (field: AdminUserSortField) => void;
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
        <span className="flex flex-col leading-none text-brand-text-muted group-hover:text-brand-text-dark">
          {active ? (
            sortDir === "asc" ? (
              <CaretUp size={14} weight="bold" className="text-brand-red" aria-hidden />
            ) : (
              <CaretDown size={14} weight="bold" className="text-brand-red" aria-hidden />
            )
          ) : (
            <CaretUp size={14} weight="bold" className="opacity-35" aria-hidden />
          )}
        </span>
      </button>
    </th>
  );
}

export default function AdminUsersListPage() {
  const { token, user } = useAuth();
  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<AdminUserSortField>("createdAt");
  const [sortDir, setSortDir] = useState<AdminUserSortDir>("desc");

  const debouncedQ = useDebouncedValue(draftQ, ADMIN_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const next = debouncedQ.trim();
    setAppliedQ((prev) => (prev === next ? prev : next));
  }, [debouncedQ]);

  useEffect(() => {
    setPage(1);
  }, [appliedQ]);

  const listQ = useQuery({
    queryKey: ["admin", "users", token, page, appliedQ, limit, sortBy, sortDir],
    queryFn: () =>
      fetchAdminUsersList(token!, {
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

  function toggleColumnSort(field: AdminUserSortField) {
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
        <p className="text-sm font-semibold">Loading users…</p>
      </div>
    );
  }

  if (listQ.isError || !listQ.data) {
    return (
      <div className="admin-panel-card mx-auto max-w-3xl border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <h1 className="text-lg font-bold">Could not load users</h1>
        <p className="mt-2 text-sm">Check your connection and admin permissions, then try again.</p>
      </div>
    );
  }

  const { items, total } = listQ.data;
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <section className="mx-auto max-w-[1400px]">
      <AdminBreadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Users" }]} />

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
                placeholder="Search email or name…"
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
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead className="admin-datatable-thead sticky top-0 z-[1]">
              <tr>
                <SortableTh
                  label="User"
                  field="fullName"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh label="Email" field="email" sortBy={sortBy} sortDir={sortDir} onSort={toggleColumnSort} />
                <th className="admin-datatable-th whitespace-nowrap">Phone</th>
                <SortableTh label="Role" field="role" sortBy={sortBy} sortDir={sortDir} onSort={toggleColumnSort} />
                <SortableTh
                  label="Verified"
                  field="emailVerified"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh
                  label="Workspace"
                  field="tenantSlug"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh
                  label="Joined"
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
                  <td colSpan={8} className="admin-datatable-cell py-20 text-center">
                    <p className="text-base font-semibold text-brand-text-dark">No users match your filters</p>
                    <p className="mt-1 text-sm text-brand-text-muted">Try a different search or clear the query.</p>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-datatable-cell">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-inner ${
                            row.role === "admin"
                              ? "bg-gradient-to-br from-slate-600 to-slate-800"
                              : "bg-gradient-to-br from-brand-red to-red-700"
                          }`}
                          aria-hidden
                        >
                          {initials(row.fullName, row.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[200px] truncate font-bold text-brand-text-dark">{row.fullName || "—"}</p>
                          <p className="text-xs text-brand-text-muted">ID · {row.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="admin-datatable-cell max-w-[220px] truncate" title={row.email}>
                      {row.email}
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap tabular-nums text-brand-text-muted">
                      {formatPhone(row.phoneCountryCode, row.phoneNumber)}
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                          row.role === "admin"
                            ? "bg-gray-100 text-brand-text-dark"
                            : "bg-brand-red-light text-brand-red"
                        }`}
                      >
                        {row.role}
                      </span>
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap">
                      {row.emailVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="admin-datatable-cell max-w-[200px]">
                      {row.tenantSlug ? (
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-brand-text-dark">{row.tenantSlug}</span>
                          {row.tenantName ? (
                            <p className="truncate text-xs text-brand-text-muted" title={row.tenantName}>
                              {row.tenantName}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-brand-text-muted">—</span>
                      )}
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap tabular-nums text-brand-text-muted">
                      {new Date(row.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap text-right">
                      <Link
                        href={`/admin/users/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-2 text-xs font-bold text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
                      >
                        Details
                        <ArrowRight size={14} weight="bold" aria-hidden />
                      </Link>
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
