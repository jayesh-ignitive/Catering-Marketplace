"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminTableSortArrows } from "@/components/admin/AdminTableSortArrows";
import { useAuth } from "@/context/AuthContext";
import {
  type AdminContactSortDir,
  type AdminContactSortField,
  type AdminContactStatusFilter,
  fetchAdminContactInquiriesList,
} from "@/lib/admin-api";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ArrowRight, CaretLeft, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function defaultSortDir(field: AdminContactSortField): AdminContactSortDir {
  return field === "createdAt" || field === "solved" ? "desc" : "asc";
}

function inquiryStatusBadgeClass(solved: boolean): string {
  return solved ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900";
}

function inquiryStatusLabel(solved: boolean): string {
  return solved ? "Solved" : "Open";
}

function visiblePageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
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
}: {
  label: string;
  field: AdminContactSortField;
  sortBy: AdminContactSortField;
  sortDir: AdminContactSortDir;
  onSort: (field: AdminContactSortField) => void;
}) {
  const active = sortBy === field;
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
      className="admin-datatable-th whitespace-nowrap text-left"
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="group inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 transition hover:bg-brand-page"
      >
        <span>{label}</span>
        <AdminTableSortArrows active={active} sortDir={sortDir} size={14} />
      </button>
    </th>
  );
}

export default function AdminContactInquiriesPage() {
  const { token, user } = useAuth();
  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<AdminContactSortField>("createdAt");
  const [sortDir, setSortDir] = useState<AdminContactSortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<AdminContactStatusFilter>("all");

  const debouncedQ = useDebouncedValue(draftQ, ADMIN_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const next = debouncedQ.trim();
    setAppliedQ((prev) => (prev === next ? prev : next));
  }, [debouncedQ]);

  useEffect(() => {
    setPage(1);
  }, [appliedQ, statusFilter]);

  const listQ = useQuery({
    queryKey: ["admin", "contact-inquiries", token, page, appliedQ, limit, sortBy, sortDir, statusFilter],
    queryFn: () =>
      fetchAdminContactInquiriesList(token!, {
        page,
        limit,
        q: appliedQ || undefined,
        sortBy,
        sortDir,
        status: statusFilter,
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
    setAppliedQ(draftQ.trim());
    setPage(1);
  }

  function toggleColumnSort(field: AdminContactSortField) {
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
        <p className="text-sm font-semibold">Loading inquiries…</p>
      </div>
    );
  }

  if (listQ.isError || !listQ.data) {
    return (
      <div className="admin-panel-card mx-auto max-w-3xl border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <h1 className="text-lg font-bold">Could not load contact inquiries</h1>
        <p className="mt-2 text-sm">Check your connection and admin permissions, then try again.</p>
      </div>
    );
  }

  const { items, total } = listQ.data;
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <section className="mx-auto max-w-[1400px]">
      <AdminBreadcrumb
        items={[{ label: "Dashboard", href: "/admin" }, { label: "Contact inquiries" }]}
      />

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
            </select>
            <span>entries</span>
          </label>

          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center md:max-w-lg md:flex-1">
            <div className="relative min-w-0 flex-1">
              <MagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted"
                size={20}
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search name, email, subject, message…"
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
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as AdminContactStatusFilter);
                setPage(1);
              }}
              className="admin-field-quiet shrink-0 rounded-lg px-3 py-2.5 text-sm font-semibold"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="open">Open only</option>
              <option value="solved">Solved only</option>
            </select>
            {appliedQ ? (
              <button
                type="button"
                onClick={() => {
                  setDraftQ("");
                  setAppliedQ("");
                  setPage(1);
                }}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-brand-text-dark transition hover:bg-brand-page"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="admin-datatable-thead sticky top-0 z-[1]">
              <tr>
                <SortableTh
                  label="From"
                  field="name"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh
                  label="Email"
                  field="email"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <th className="admin-datatable-th whitespace-nowrap">Phone</th>
                <SortableTh
                  label="Subject"
                  field="subject"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <th className="admin-datatable-th">Message</th>
                <SortableTh
                  label="Status"
                  field="solved"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh
                  label="Received"
                  field="createdAt"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <th className="admin-datatable-th text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-datatable-cell py-20 text-center">
                    <p className="text-base font-semibold text-brand-text-dark">No inquiries yet</p>
                    <p className="mt-1 text-sm text-brand-text-muted">
                      Submissions from the public contact form will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-datatable-cell font-semibold text-brand-text-dark">
                      {row.name}
                    </td>
                    <td className="admin-datatable-cell max-w-[200px] truncate">
                      <a
                        href={`mailto:${encodeURIComponent(row.email)}`}
                        className="text-brand-red hover:underline"
                      >
                        {row.email}
                      </a>
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap tabular-nums text-brand-text-muted">
                      {row.phone ?? "—"}
                    </td>
                    <td className="admin-datatable-cell max-w-[180px] truncate font-medium" title={row.subject}>
                      {row.subject}
                    </td>
                    <td className="admin-datatable-cell max-w-[280px] truncate text-brand-text-muted" title={row.messagePreview}>
                      {row.messagePreview}
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${inquiryStatusBadgeClass(row.solved)}`}
                      >
                        {inquiryStatusLabel(row.solved)}
                      </span>
                    </td>
                    <td className="admin-datatable-cell whitespace-nowrap tabular-nums text-brand-text-muted">
                      {new Date(row.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="admin-datatable-cell w-px whitespace-nowrap py-3 text-right">
                      <Link
                        href={`/admin/contact-inquiries/${row.id}`}
                        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-brand-red px-2.5 text-[11px] font-bold leading-none text-white transition hover:bg-red-700"
                      >
                        View
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
            Showing {showingFrom} to {showingTo} of {total} inquiries
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
            {pageButtons.map((item, idx) =>
              item === "gap" ? (
                <span
                  key={`gap-${idx}`}
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
                  className={`admin-pagination-btn ${item === page ? "admin-pagination-btn-active" : ""}`}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
