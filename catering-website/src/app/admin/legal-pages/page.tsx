"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  deleteAdminLegalPageTranslation,
  fetchAdminLanguages,
  fetchAdminLegalPages,
  type AdminLegalPageItem,
  type AdminLegalPageSlug,
  updateAdminLegalPage,
  upsertAdminLegalPageTranslation,
} from "@/lib/admin-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Scales } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const ADMIN_LEGAL_KEY = ["admin", "legal-pages"] as const;

type TranslationForm = {
  title: string;
  lastUpdatedLabel: string;
  bodyHtml: string;
};

const EMPTY_FORM: TranslationForm = {
  title: "",
  lastUpdatedLabel: "",
  bodyHtml: "",
};

export default function AdminLegalPagesPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState<AdminLegalPageSlug>("terms");
  const [activeLanguageId, setActiveLanguageId] = useState("");
  const [form, setForm] = useState<TranslationForm>(EMPTY_FORM);

  const pagesQ = useQuery({
    queryKey: ADMIN_LEGAL_KEY,
    queryFn: () => fetchAdminLegalPages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const languagesQ = useQuery({
    queryKey: ["admin", "languages"],
    queryFn: () => fetchAdminLanguages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const pages = pagesQ.data ?? [];
  const languages = useMemo(
    () => (languagesQ.data ?? []).filter((l) => l.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [languagesQ.data],
  );

  const selectedPage = pages.find((p) => p.slug === selectedSlug) ?? pages[0] ?? null;

  useEffect(() => {
    if (!activeLanguageId && languages.length > 0) {
      const en = languages.find((l) => l.code === "en") ?? languages[0];
      setActiveLanguageId(en.id);
    }
  }, [languages, activeLanguageId]);

  useEffect(() => {
    if (!selectedPage || !activeLanguageId) {
      setForm(EMPTY_FORM);
      return;
    }
    const hit = selectedPage.translations.find((t) => t.languageId === activeLanguageId);
    if (hit) {
      setForm({
        title: hit.title,
        lastUpdatedLabel: hit.lastUpdatedLabel,
        bodyHtml: hit.bodyHtml,
      });
    } else {
      const en = selectedPage.translations.find((t) => t.languageCode === "en");
      setForm({
        title: en?.title ?? "",
        lastUpdatedLabel: en?.lastUpdatedLabel ?? "",
        bodyHtml: en?.bodyHtml ?? "<p></p>",
      });
    }
  }, [selectedPage?.id, selectedPage?.updatedAt, activeLanguageId]);

  const publishM = useMutation({
    mutationFn: (payload: { id: string; isPublished: boolean }) =>
      updateAdminLegalPage(token!, payload.id, { isPublished: payload.isPublished }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_LEGAL_KEY });
      toast.success("Publish setting updated.");
    },
    onError: () => toast.error("Could not update publish setting."),
  });

  const saveM = useMutation({
    mutationFn: () => {
      if (!selectedPage || !activeLanguageId) {
        throw new Error("missing");
      }
      if (!form.title.trim() || !form.lastUpdatedLabel.trim() || !form.bodyHtml.trim()) {
        throw new Error("validation");
      }
      return upsertAdminLegalPageTranslation(token!, selectedPage.id, {
        languageId: Number(activeLanguageId),
        title: form.title.trim(),
        lastUpdatedLabel: form.lastUpdatedLabel.trim(),
        bodyHtml: form.bodyHtml.trim(),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_LEGAL_KEY });
      toast.success("Translation saved.");
    },
    onError: (e) => {
      if (e instanceof Error && e.message === "validation") {
        toast.error("Title, last updated label, and body are required.");
        return;
      }
      toast.error("Could not save translation.");
    },
  });

  const deleteM = useMutation({
    mutationFn: (payload: { pageId: string; languageId: string }) =>
      deleteAdminLegalPageTranslation(token!, payload.pageId, payload.languageId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_LEGAL_KEY });
      toast.success("Translation removed.");
    },
    onError: () => toast.error("Could not remove translation."),
  });

  const activeLang = languages.find((l) => l.id === activeLanguageId);
  const hasTranslation =
    selectedPage?.translations.some((t) => t.languageId === activeLanguageId) ?? false;

  function onLanguageTab(languageId: string) {
    setActiveLanguageId(languageId);
  }

  if (user?.role !== "admin") {
    return (
      <section className="admin-page">
        <p className="text-sm font-semibold text-brand-text-muted">Admin access required.</p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <AdminBreadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Legal pages" },
        ]}
      />

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-brand-dark">
            Legal pages
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-text-muted">
            Manage Terms &amp; Conditions and Privacy Policy in English, Hindi, and Gujarati. Use HTML
            for sections. Placeholders:{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">{"{{siteName}}"}</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">{"{{siteUrl}}"}</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">{"{{contactEmail}}"}</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">{"{{supportPhoneInline}}"}</code>.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="admin-card h-fit p-3">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
            Pages
          </p>
          <nav className="flex flex-col gap-1">
            {(pages.length > 0 ? pages : [{ slug: "terms" as const, label: "Terms & Conditions" }, { slug: "privacy" as const, label: "Privacy Policy" }]).map(
              (item: Pick<AdminLegalPageItem, "slug" | "label">) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setSelectedSlug(item.slug)}
                  className={`cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                    selectedSlug === item.slug
                      ? "bg-brand-red text-white shadow-md"
                      : "text-brand-text-dark hover:bg-brand-page"
                  }`}
                >
                  {item.label}
                </button>
              ),
            )}
          </nav>
        </aside>

        <div className="admin-card p-6">
          {pagesQ.isLoading ? (
            <p className="text-sm text-brand-text-muted">Loading…</p>
          ) : !selectedPage ? (
            <p className="text-sm text-brand-text-muted">
              No legal pages found. Run database migrations to seed terms and privacy.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-red-light text-brand-red">
                    <Scales size={22} weight="duotone" aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-brand-dark">{selectedPage.label}</h2>
                    <p className="text-xs text-brand-text-muted">
                      Public: /{selectedPage.slug === "terms" ? "terms" : "privacy"}
                    </p>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-brand-text-dark">
                  <input
                    type="checkbox"
                    checked={selectedPage.isPublished}
                    disabled={publishM.isPending}
                    onChange={(e) =>
                      publishM.mutate({ id: selectedPage.id, isPublished: e.target.checked })
                    }
                    className="size-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                  />
                  Published on site
                </label>
              </div>

              <AdminModalField label="Language">
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => {
                    const has = selectedPage.translations.some((t) => t.languageId === language.id);
                    const active = activeLanguageId === language.id;
                    return (
                      <button
                        key={language.id}
                        type="button"
                        onClick={() => onLanguageTab(language.id)}
                        className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition ${
                          active
                            ? "border-brand-red bg-brand-red text-white shadow-md"
                            : "border-gray-200 bg-white text-brand-text-dark hover:bg-brand-page"
                        }`}
                      >
                        {language.name} ({language.code}){has ? " · ✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </AdminModalField>

              <AdminModalField label="Page title">
                <input
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  className="admin-field-quiet w-full px-3 py-3"
                  placeholder="Terms & Conditions"
                />
              </AdminModalField>

              <AdminModalField label="Last updated label">
                <input
                  value={form.lastUpdatedLabel}
                  onChange={(e) => setForm((s) => ({ ...s, lastUpdatedLabel: e.target.value }))}
                  className="admin-field-quiet w-full px-3 py-3"
                  placeholder="Last updated: 3 May 2026"
                />
              </AdminModalField>

              <AdminModalField label="Body (HTML)">
                <textarea
                  value={form.bodyHtml}
                  onChange={(e) => setForm((s) => ({ ...s, bodyHtml: e.target.value }))}
                  rows={18}
                  className="admin-field-quiet w-full resize-y px-3 py-3 font-mono text-xs leading-relaxed"
                  spellCheck={false}
                />
              </AdminModalField>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-[40px]">
                  {activeLang?.code !== "en" ? (
                    <button
                      type="button"
                      disabled={!hasTranslation || deleteM.isPending || saveM.isPending}
                      onClick={() => {
                        if (!confirm(`Remove ${activeLang?.name ?? "this"} translation?`)) return;
                        deleteM.mutate({
                          pageId: selectedPage.id,
                          languageId: activeLanguageId,
                        });
                      }}
                      className="cursor-pointer rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deleteM.isPending ? "Removing…" : "Remove translation"}
                    </button>
                  ) : (
                    <p className="max-w-md text-xs leading-snug text-brand-text-muted">
                      English is required. Add Hindi and Gujarati using the language tabs above.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={saveM.isPending || !activeLanguageId}
                  onClick={() => saveM.mutate()}
                  className="cursor-pointer rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveM.isPending ? "Saving…" : "Save translation"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
