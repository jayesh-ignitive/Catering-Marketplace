"use client";

import { useI18n } from "@/context/LocaleContext";
import { dateLocaleFor } from "@/i18n/format";
import type { AppLocale } from "@/i18n/locale";
import { useAuth } from "@/context/AuthContext";
import { workspaceHintTextClass } from "@/components/workspace/caterer-profile/constants";
import {
  fetchWorkspaceInquiryDetail,
  setWorkspaceInquiryStatus,
  type WorkspaceInquiryDetail,
} from "@/lib/catering-api";
import {
  formatInquiryEventDateShort,
  formatInquiryGuests,
  formatInquiryWhenShort,
  inquiryCustomerInitials,
  inquiryDisplayTitle,
  inquiryEventMetaFromMessage,
  inquiryReplySubject,
} from "@/lib/workspace-inquiry-display";
import { parseCatererInquiryMessage } from "@/lib/validation/caterer-forms";
import {
  ArrowLeft,
  CalendarBlank,
  CheckCircle,
  Clock,
  EnvelopeSimple,
  Phone,
  Tag,
  Users,
  XCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

function statusStyles(solved: boolean) {
  return solved
    ? {
        badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
        dot: "bg-emerald-500",
      }
    : {
        badge: "bg-amber-50 text-amber-900 ring-amber-200",
        dot: "bg-amber-500",
      };
}

function EventFactCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarBlank;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-red-light text-brand-red">
        <Icon size={16} weight="duotone" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-text-muted">{label}</p>
        <p className="truncate text-sm font-bold text-brand-text-dark">{value}</p>
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  actionLabel,
}: {
  icon: typeof EnvelopeSimple;
  label: string;
  value: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <a
      href={href}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 transition hover:border-brand-red/30 hover:bg-brand-red-light/30"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-page text-brand-red ring-1 ring-gray-100 transition group-hover:bg-white">
        <Icon size={18} weight="duotone" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-brand-text-muted">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-brand-text-dark group-hover:text-brand-red">
          {value}
        </span>
      </span>
      <span className="hidden shrink-0 text-[11px] font-bold text-brand-red sm:inline">{actionLabel}</span>
    </a>
  );
}

function InquiryDetailView({
  row,
  inv,
  trans,
  locale,
  onToggleStatus,
  statusPending,
}: {
  row: WorkspaceInquiryDetail;
  inv: ReturnType<typeof useI18n>["ws"]["inquiries"];
  trans: ReturnType<typeof useI18n>["trans"];
  locale: AppLocale;
  onToggleStatus: () => void;
  statusPending: boolean;
}) {
  const parsed = parseCatererInquiryMessage(row.message);
  const meta = inquiryEventMetaFromMessage(row.message);
  const title = inquiryDisplayTitle(row.name, row.subject, inv.customerEnquiryFallback);
  const received = formatInquiryWhenShort(row.createdAt, locale);
  const resolvedAt = row.solvedAt ? formatInquiryWhenShort(row.solvedAt, locale) : null;
  const status = statusStyles(row.solved);

  const guestsLabel = (count: number) =>
    trans(inv.guestsCount, { count: count.toLocaleString(dateLocaleFor(locale)) });
  const eventDate = meta.eventDate ? formatInquiryEventDateShort(meta.eventDate, locale) : null;
  const guests = meta.guests ? formatInquiryGuests(meta.guests, guestsLabel) : null;
  const category = meta.category;

  const mailtoSubject = encodeURIComponent(
    inquiryReplySubject(row.name, row.subject, {
      from: inv.replySubjectFrom,
      generic: inv.replySubjectGeneric,
    }),
  );
  const mailtoHref = `mailto:${encodeURIComponent(row.email)}?subject=${mailtoSubject}`;
  const telHref = row.phone ? `tel:${row.phone.replace(/\s/g, "")}` : null;

  const hasEvent = Boolean(eventDate || guests || category);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.06)]">
      <div className="border-b border-gray-100 bg-gradient-to-br from-[#fff9f8] via-white to-brand-page/40 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red text-sm font-bold text-white shadow-sm shadow-brand-red/20"
              aria-hidden
            >
              {inquiryCustomerInitials(row.name)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-lg font-bold tracking-tight text-brand-text-dark sm:text-xl">
                  {title}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${status.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden />
                  {row.solved ? inv.statusResolved : inv.statusOpen}
                </span>
              </div>
              <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs ${workspaceHintTextClass}`}>
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} aria-hidden />
                  {trans(inv.detailReceived, { date: received })}
                </span>
                {resolvedAt ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle size={13} weight="fill" aria-hidden />
                    {trans(inv.detailResolvedAt, { date: resolvedAt })}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasEvent ? (
        <div className="border-b border-gray-100 bg-brand-page/30 px-4 py-3 sm:px-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {eventDate ? (
              <EventFactCard icon={CalendarBlank} label={inv.detailEventDate} value={eventDate} />
            ) : null}
            {guests ? <EventFactCard icon={Users} label={inv.detailGuests} value={guests} /> : null}
            {category ? <EventFactCard icon={Tag} label={inv.detailCategory} value={category} /> : null}
          </div>
        </div>
      ) : null}

      <div className="px-4 py-3 sm:px-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <ContactRow
            icon={EnvelopeSimple}
            label={inv.contactEmail}
            value={row.email}
            href={mailtoHref}
            actionLabel={inv.replyEmail}
          />
          {row.phone && telHref ? (
            <ContactRow
              icon={Phone}
              label={inv.contactPhone}
              value={row.phone}
              href={telHref}
              actionLabel={inv.callCustomer}
            />
          ) : null}
        </div>
      </div>

      {parsed.notes ? (
        <div className="border-t border-gray-100 bg-brand-page/20 px-4 py-3 sm:px-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-text-muted">
            {inv.detailNotes}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-brand-text-dark">
            {parsed.notes}
          </p>
        </div>
      ) : null}

      <footer className="flex flex-wrap gap-2 border-t border-gray-100 bg-white px-4 py-3 sm:px-5">
        <a
          href={mailtoHref}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-red px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand-red/20 transition hover:bg-red-700 sm:text-sm"
        >
          <EnvelopeSimple size={16} weight="bold" aria-hidden />
          {inv.replyEmail}
        </a>
        {telHref ? (
          <a
            href={telHref}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-brand-text-dark transition hover:border-brand-red/30 hover:bg-brand-page sm:text-sm"
          >
            <Phone size={16} weight="bold" aria-hidden />
            {inv.callCustomer}
          </a>
        ) : null}
        <button
          type="button"
          disabled={statusPending}
          onClick={onToggleStatus}
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-brand-text-dark transition hover:bg-brand-page disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:text-sm"
        >
          {row.solved ? (
            <>
              <XCircle size={16} weight="bold" aria-hidden />
              {inv.markOpen}
            </>
          ) : (
            <>
              <CheckCircle size={16} weight="bold" aria-hidden />
              {inv.markResolved}
            </>
          )}
        </button>
      </footer>
    </article>
  );
}

export default function WorkspaceInquiryDetailPage() {
  const { ws, trans, locale } = useI18n();
  const inv = ws.inquiries;
  const { token } = useAuth();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["workspace", "inquiries", id, token],
    queryFn: () => fetchWorkspaceInquiryDetail(token!, id),
    enabled: Boolean(token && id),
    retry: 1,
  });

  const statusM = useMutation({
    mutationFn: (solved: boolean) => setWorkspaceInquiryStatus(token!, id, solved),
    onSuccess: (data) => {
      toast.success(data.solved ? inv.markResolvedSuccess : inv.markOpenSuccess);
      void qc.invalidateQueries({ queryKey: ["workspace", "inquiries"] });
      void qc.setQueryData(["workspace", "inquiries", id, token], data);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (detailQ.isPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-brand-text-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-red" />
        <p className="text-sm font-semibold">{inv.loading}</p>
      </div>
    );
  }

  if (detailQ.isError || !detailQ.data) {
    return (
      <div className="admin-panel-card mx-auto max-w-3xl border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <h1 className="text-lg font-bold">{inv.notFoundTitle}</h1>
        <p className="mt-2 text-sm">{inv.notFoundHint}</p>
        <Link
          href="/workspace/inquiries"
          className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-brand-red hover:underline"
        >
          <ArrowLeft size={16} weight="bold" aria-hidden />
          {inv.backToList}
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-4xl">
      <Link
        href="/workspace/inquiries"
        className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-brand-text-muted transition hover:text-brand-red"
      >
        <ArrowLeft size={16} weight="bold" aria-hidden />
        {inv.backToList}
      </Link>

      <InquiryDetailView
        row={detailQ.data}
        inv={inv}
        trans={trans}
        locale={locale}
        statusPending={statusM.isPending}
        onToggleStatus={() => statusM.mutate(!detailQ.data!.solved)}
      />
    </section>
  );
}
