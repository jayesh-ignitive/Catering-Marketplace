"use client";

import { useAuth } from "@/context/AuthContext";
import { type AdminUserSortDir, type AdminUserSortField, fetchAdminUsersList } from "@/lib/admin-api";
import { ArrowRight, CaretDown, CaretUp, MagnifyingGlass } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

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
      className={`whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        title={active ? `Sorted ${sortDir === "asc" ? "ascending" : "descending"}. Click to reverse.` : `Sort by ${label}`}
        className={`group inline-flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 -mx-1.5 transition hover:bg-slate-200/80 hover:text-slate-800 ${
          align === "right" ? "ml-auto flex-row-reverse" : ""
        }`}
      >
        <span>{label}</span>
        <span className="flex flex-col leading-none text-slate-400 group-hover:text-slate-600">
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

  function applySearch() {
    setAppliedQ(draftQ.trim());
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
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-red" />
        <p className="text-sm font-semibold">Loading users…</p>
      </div>
    );
  }

  if (listQ.isError || !listQ.data) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <h1 className="text-lg font-bold">Could not load users</h1>
        <p className="mt-2 text-sm">Check your connection and admin permissions, then try again.</p>
      </div>
    );
  }

  const { items } = listQ.data;

  return (
    <section className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Directory</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Users</h1>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:max-w-2xl">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search email or name…"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-brand-red/25 transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={applySearch}
              className="rounded-lg bg-brand-red px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-[0.96]"
            >
              Search
            </button>
            {appliedQ ? (
              <button
                type="button"
                onClick={() => {
                  setDraftQ("");
                  setAppliedQ("");
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/40">
        <div className="overflow-x-auto border-b border-slate-100">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
              <tr>
                <SortableTh
                  label="User"
                  field="fullName"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={toggleColumnSort}
                />
                <SortableTh label="Email" field="email" sortBy={sortBy} sortDir={sortDir} onSort={toggleColumnSort} />
                <th className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Phone
                </th>
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
                <th
                  scope="col"
                  className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-20 text-center">
                    <p className="text-base font-semibold text-slate-700">No users match your filters</p>
                    <p className="mt-1 text-sm text-slate-500">Try a different search or clear the query.</p>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-red-50/50 odd:bg-slate-50/40 hover:odd:bg-red-50/50"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner ${
                            row.role === "admin"
                              ? "bg-gradient-to-br from-slate-600 to-slate-800"
                              : "bg-gradient-to-br from-brand-red to-red-700"
                          }`}
                          aria-hidden
                        >
                          {initials(row.fullName, row.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-[200px] truncate font-semibold text-slate-900">{row.fullName || "—"}</p>
                          <p className="text-xs text-slate-500">ID · {row.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3.5 font-medium text-slate-800" title={row.email}>
                      {row.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">
                      {formatPhone(row.phoneCountryCode, row.phoneNumber)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                          row.role === "admin"
                            ? "bg-slate-200 text-slate-800"
                            : "bg-red-50 text-brand-red ring-1 ring-red-100"
                        }`}
                      >
                        {row.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {row.emailVerified ? (
                        <span className="font-semibold text-emerald-600">Verified</span>
                      ) : (
                        <span className="font-semibold text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="max-w-[200px] px-4 py-3.5">
                      {row.tenantSlug ? (
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-slate-800">{row.tenantSlug}</span>
                          {row.tenantName ? (
                            <p className="truncate text-xs text-slate-500" title={row.tenantName}>
                              {row.tenantName}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">
                      {new Date(row.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/users/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-brand-red transition hover:bg-red-50"
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

        <footer className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-6 md:px-6">
          <nav
            className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 md:flex-1"
            aria-label="Pagination"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {totalPages > 0 &&
              pageButtons.map((item, idx) =>
                item === "gap" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="select-none px-1.5 text-sm font-medium text-slate-400"
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
                    className={`min-w-[2.5rem] rounded-lg border px-2.5 py-2 text-sm font-semibold tabular-nums shadow-sm transition ${
                      item === page
                        ? "border-brand-red bg-brand-red text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
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
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>

          <label className="flex items-center justify-center gap-2 text-sm text-slate-600 md:justify-end">
            <span className="whitespace-nowrap font-medium text-slate-500">Rows per page</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none ring-brand-red/20 focus:ring-2"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </footer>
      </div>
    </section>
  );
}
