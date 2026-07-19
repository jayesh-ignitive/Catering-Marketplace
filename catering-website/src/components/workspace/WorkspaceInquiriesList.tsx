"use client";

import { useI18n } from "@/context/LocaleContext";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  fetchWorkspaceInquiries,
  type WorkspaceInquiryStatusFilter,
} from "@/lib/catering-api";
import {
  formatInquiryWhen,
  formatInquiryEventDateShort,
  formatInquiryGuests,
  inquiryCustomerInitials,
  inquiryDisplayTitle,
  inquiryEventMetaFromMessage,
} from "@/lib/workspace-inquiry-display";
import { dateLocaleFor } from "@/i18n/format";
import {
  ArrowRight,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  EnvelopeSimple,
  MagnifyingGlass,
  Phone,
  Tag,
  Users,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { workspaceHintTextClass } from "./caterer-profile/constants";

function statusBadgeClass(solved: boolean): string {
  return solved
    ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
    : "bg-amber-50 text-amber-900 ring-amber-100";
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

function InquiryMetaChip({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarBlank;
  label: string;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-brand-page px-2.5 py-1 text-xs font-semibold text-brand-text-dark">
      <Icon size={14} className="shrink-0 text-brand-text-muted" aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function WorkspaceInquiriesList() {
  const { ws, trans, locale } = useI18n();
  const inv = ws.inquiries;
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [limit] = useState(12);
  const [statusFilter, setStatusFilter] = useState<WorkspaceInquiryStatusFilter>("all");

  const debouncedQ = useDebouncedValue(draftQ, ADMIN_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const next = debouncedQ.trim();
    setAppliedQ((prev) => (prev === next ? prev : next));
  }, [debouncedQ]);

  useEffect(() => {
    setPage(1);
  }, [appliedQ, statusFilter]);

  const listQ = useQuery({
    queryKey: ["workspace", "inquiries", token, page, appliedQ, limit, statusFilter],
    queryFn: () =>
      fetchWorkspaceInquiries(token!, {
        page,
        limit,
        q: appliedQ || undefined,
        sortBy: "createdAt",
        sortDir: "desc",
        status: statusFilter,
      }),
    enabled: Boolean(token),
    retry: 1,
  });

  const totalPages = useMemo(() => {
    const t = listQ.data?.total ?? 0;
    return Math.max(1, Math.ceil(t / limit));
  }, [listQ.data?.total, limit]);

  const pageButtons = useMemo(() => visiblePageNumbers(page, totalPages), [page, totalPages]);

  if (listQ.isPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-brand-text-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-red" />
        <p className="text-sm font-semibold">{inv.loading}</p>
      </div>
    );
  }

  if (listQ.isError) {
    return (
      <div className="admin-panel-card mx-auto max-w-3xl border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <p className="text-sm font-semibold">{inv.loadError}</p>
      </div>
    );
  }

  const data = listQ.data!;
  const filters: { id: WorkspaceInquiryStatusFilter; label: string }[] = [
    { id: "all", label: inv.filterAll },
    { id: "open", label: inv.filterOpen },
    { id: "solved", label: inv.filterResolved },
  ];

  return (
    <div className="w-full min-w-0 max-w-5xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">{inv.title}</p>
        <h1 className="font-heading mt-1 text-2xl font-bold tracking-tight text-brand-text-dark md:text-3xl">
          {ws.header.titles.inquiries}
        </h1>
        <p className={`mt-2 ${workspaceHintTextClass}`}>{inv.subtitle}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="admin-panel-card flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
            <EnvelopeSimple size={24} weight="duotone" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">{inv.statOpen}</p>
            <p className="font-heading mt-1 text-2xl font-bold text-brand-text-dark">{data.openCount}</p>
          </div>
        </div>
        <div className="admin-panel-card flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-red-light text-brand-red ring-1 ring-red-100">
            <Users size={24} weight="duotone" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">{inv.statTotal}</p>
            <p className="font-heading mt-1 text-2xl font-bold text-brand-text-dark">{data.total}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <MagnifyingGlass
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted"
            size={18}
            aria-hidden
          />
          <input
            type="search"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={inv.searchPlaceholder}
            className="w-full rounded-xl border border-gray-100 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-brand-red"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                statusFilter === f.id
                  ? "bg-brand-red text-white shadow-sm shadow-brand-red/20"
                  : "bg-white text-brand-text-muted ring-1 ring-gray-100 hover:text-brand-text-dark"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {data.items.length === 0 ? (
        <div className="admin-panel-card px-6 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red-light text-brand-red">
            <EnvelopeSimple size={28} weight="duotone" aria-hidden />
          </span>
          <p className="font-heading mt-5 text-lg font-bold text-brand-text-dark">{inv.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-brand-text-muted">
            {appliedQ || statusFilter !== "all" ? inv.emptyFiltered : inv.emptyHint}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.items.map((row) => {
            const meta = inquiryEventMetaFromMessage(row.messagePreview);
            const title = inquiryDisplayTitle(row.name, row.subject, inv.customerEnquiryFallback);
            const guestsLabel = (count: number) =>
              trans(inv.guestsCount, { count: count.toLocaleString(dateLocaleFor(locale)) });
            return (
              <li key={row.id}>
                <Link
                  href={`/workspace/inquiries/${row.id}`}
                  className="group flex h-full cursor-pointer flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.04)] transition hover:border-brand-red/25 hover:shadow-[0_12px_32px_-8px_rgba(229,57,53,0.12)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-red-light text-sm font-bold text-brand-red ring-1 ring-red-100"
                        aria-hidden
                      >
                        {inquiryCustomerInitials(row.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-brand-text-dark group-hover:text-brand-red">
                          {title}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-brand-text-muted">{row.email}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusBadgeClass(row.solved)}`}
                    >
                      {row.solved ? inv.statusResolved : inv.statusOpen}
                    </span>
                  </div>

                  {(meta.eventDate || meta.category || meta.guests) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {meta.eventDate ? (
                        <InquiryMetaChip
                          icon={CalendarBlank}
                          label={formatInquiryEventDateShort(meta.eventDate, locale)}
                        />
                      ) : null}
                      {meta.guests ? (
                        <InquiryMetaChip icon={Users} label={formatInquiryGuests(meta.guests, guestsLabel)} />
                      ) : null}
                      {meta.category ? <InquiryMetaChip icon={Tag} label={meta.category} /> : null}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-text-muted">
                    {row.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={14} aria-hidden />
                        {row.phone}
                      </span>
                    ) : null}
                    <span>{formatInquiryWhen(row.createdAt, locale)}</span>
                  </div>

                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-red">
                    {inv.viewDetails}
                    <ArrowRight
                      size={16}
                      weight="bold"
                      className="transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {data.total > limit ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 sm:px-6">
          <p className="text-xs font-semibold text-brand-text-muted">
            {trans(inv.pageOf, { page, total: totalPages })}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-brand-text-muted transition hover:bg-brand-page disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={inv.prevPage}
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            {pageButtons.map((p, i) =>
              p === "gap" ? (
                <span key={`gap-${i}`} className="px-1 text-brand-text-muted">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`min-w-[2rem] cursor-pointer rounded-lg px-2 py-1.5 text-xs font-bold transition ${
                    p === page ? "bg-brand-red text-white" : "text-brand-text-muted hover:bg-brand-page"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-brand-text-muted transition hover:bg-brand-page disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={inv.nextPage}
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
