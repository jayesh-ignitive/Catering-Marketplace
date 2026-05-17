"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAdminContactInquiryDetail,
  setAdminContactInquiryStatus,
} from "@/lib/admin-api";
import {
  ArrowLeft,
  CheckCircle,
  EnvelopeSimple,
  Phone,
  XCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";

function statusBadgeClass(solved: boolean): string {
  return solved ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900";
}

export default function AdminContactInquiryDetailPage() {
  const { token, user } = useAuth();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["admin", "contact-inquiries", id, token],
    queryFn: () => fetchAdminContactInquiryDetail(token!, id),
    enabled: Boolean(token && user?.role === "admin" && id),
    retry: 1,
  });

  const statusM = useMutation({
    mutationFn: (solved: boolean) => setAdminContactInquiryStatus(token!, id, solved),
    onSuccess: (data) => {
      toast.success(data.solved ? "Marked as solved." : "Marked as open.");
      void qc.invalidateQueries({ queryKey: ["admin", "contact-inquiries"] });
      void qc.setQueryData(["admin", "contact-inquiries", id, token], data);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (detailQ.isPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-brand-text-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-red" />
        <p className="text-sm font-semibold">Loading inquiry…</p>
      </div>
    );
  }

  if (detailQ.isError || !detailQ.data) {
    return (
      <div className="admin-panel-card mx-auto max-w-3xl border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <h1 className="text-lg font-bold">Inquiry not found</h1>
        <p className="mt-2 text-sm">It may have been removed or the link is invalid.</p>
        <Link
          href="/admin/contact-inquiries"
          className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-brand-red hover:underline"
        >
          <ArrowLeft size={16} weight="bold" aria-hidden />
          Back to inquiries
        </Link>
      </div>
    );
  }

  const row = detailQ.data;
  const received = new Date(row.createdAt).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
  const solvedAtLabel = row.solvedAt
    ? new Date(row.solvedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;
  const mailtoSubject = encodeURIComponent(`Re: ${row.subject}`);
  const mailtoHref = `mailto:${encodeURIComponent(row.email)}?subject=${mailtoSubject}`;

  return (
    <section className="mx-auto max-w-3xl">
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Contact inquiries", href: "/admin/contact-inquiries" },
          { label: row.subject },
        ]}
      />

      <Link
        href="/admin/contact-inquiries"
        className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-brand-text-muted transition hover:text-brand-red"
      >
        <ArrowLeft size={16} weight="bold" aria-hidden />
        All inquiries
      </Link>

      <article className="admin-panel-card overflow-hidden">
        <header className="border-b border-gray-100 bg-gray-50/60 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Subject</p>
              <h1 className="font-heading mt-1 text-xl font-bold text-brand-text-dark">{row.subject}</h1>
              <p className="mt-2 text-sm text-brand-text-muted">Received {received}</p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${statusBadgeClass(row.solved)}`}
            >
              {row.solved ? (
                <CheckCircle size={16} weight="fill" aria-hidden />
              ) : (
                <XCircle size={16} weight="fill" aria-hidden />
              )}
              {row.solved ? "Solved" : "Open"}
            </span>
          </div>
          {solvedAtLabel ? (
            <p className="mt-3 text-xs text-brand-text-muted">Marked solved {solvedAtLabel}</p>
          ) : null}
        </header>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Name</p>
              <p className="mt-1 font-semibold text-brand-text-dark">{row.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Email</p>
              <p className="mt-1">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-red hover:underline"
                >
                  <EnvelopeSimple size={16} weight="fill" aria-hidden />
                  {row.email}
                </a>
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Phone</p>
              <p className="mt-1 flex items-center gap-1.5 text-brand-text-dark">
                {row.phone ? (
                  <>
                    <Phone size={16} className="text-brand-text-muted" aria-hidden />
                    <a
                      href={`tel:${row.phone.replace(/\s/g, "")}`}
                      className="font-semibold hover:text-brand-red"
                    >
                      {row.phone}
                    </a>
                  </>
                ) : (
                  <span className="text-brand-text-muted">—</span>
                )}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Message</p>
            <div className="mt-2 whitespace-pre-wrap rounded-xl border border-gray-100 bg-brand-page/80 px-4 py-4 text-sm leading-relaxed text-brand-text-dark">
              {row.message}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-6">
            <a
              href={mailtoHref}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-red/20 transition hover:bg-red-700"
            >
              <EnvelopeSimple size={18} weight="fill" aria-hidden />
              Reply by email
            </a>
            {row.solved ? (
              <button
                type="button"
                disabled={statusM.isPending}
                onClick={() => statusM.mutate(false)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-brand-text-dark transition hover:bg-brand-page disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={18} weight="bold" aria-hidden />
                Mark as open
              </button>
            ) : (
              <button
                type="button"
                disabled={statusM.isPending}
                onClick={() => statusM.mutate(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle size={18} weight="bold" aria-hidden />
                Mark as solved
              </button>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
