"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminModal, AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminServiceCategory,
  deleteAdminServiceCategory,
  deleteAdminServiceCategoryTranslation,
  fetchAdminLanguages,
  fetchAdminServiceCategories,
  type AdminLanguageItem,
  type AdminServiceCategoryItem,
  updateAdminServiceCategory,
  upsertAdminServiceCategoryTranslation,
} from "@/lib/admin-api";
import {
  getCategoryIconHoverClasses,
  getCategoryIconWrapBase,
  getServiceCategoryIcon,
  SERVICE_CATEGORY_ICON_OPTIONS,
} from "@/lib/service-category-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilSimple, Plus, Trash, Translate } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

type FormState = {
  code: string;
  name: string;
  slug: string;
  shortDescription: string;
  iconKey: string;
  borderClass: string;
  iconWrapClass: string;
  titleHoverClass: string;
  displayOrder: number;
  isActive: boolean;
};

const EMPTY: FormState = {
  code: "",
  name: "",
  slug: "",
  shortDescription: "",
  iconKey: "bowl-food",
  borderClass: "border-brand-red",
  iconWrapClass:
    "bg-red-50 text-brand-red group-hover:bg-brand-red group-hover:text-white",
  titleHoverClass: "group-hover:text-brand-red",
  displayOrder: 0,
  isActive: true,
};

function slugify(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function toForm(row: AdminServiceCategoryItem): FormState {
  return {
    code: row.code,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    iconKey: row.iconKey,
    borderClass: row.borderClass,
    iconWrapClass: row.iconWrapClass,
    titleHoverClass: row.titleHoverClass,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
  };
}

function CategoryIconPreview({
  iconKey,
  className = "h-6 w-6",
  wrapClassName,
}: {
  iconKey: string;
  className?: string;
  wrapClassName?: string;
}) {
  const Icon = getServiceCategoryIcon(iconKey);
  return (
    <div
      className={`flex items-center justify-center rounded-full ${wrapClassName ?? "bg-gray-50"}`}
    >
      <Icon className={className} aria-hidden />
    </div>
  );
}

export default function AdminServiceCategoriesPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translatingRow, setTranslatingRow] = useState<AdminServiceCategoryItem | null>(null);
  const [activeLanguageId, setActiveLanguageId] = useState("");
  const [translationName, setTranslationName] = useState("");
  const [translationDescription, setTranslationDescription] = useState("");

  const listQ = useQuery({
    queryKey: ["admin", "service-categories", token],
    queryFn: () => fetchAdminServiceCategories(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const languagesQ = useQuery({
    queryKey: ["admin", "languages", token],
    queryFn: () => fetchAdminLanguages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const translationLanguages = useMemo(
    () => (languagesQ.data ?? []).filter((l) => l.isActive),
    [languagesQ.data],
  );

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "service-categories"] }),
      qc.invalidateQueries({ queryKey: ["catalog", "service-categories"] }),
    ]);
  };

  const createM = useMutation({
    mutationFn: () =>
      createAdminServiceCategory(token!, {
        code: form.code.trim().toLowerCase(),
        englishName: form.name.trim(),
        slug: form.slug.trim() || undefined,
        shortDescription: form.shortDescription.trim(),
        iconKey: form.iconKey,
        iconUrl: null,
        borderClass: form.borderClass.trim(),
        iconWrapClass: form.iconWrapClass.trim(),
        titleHoverClass: form.titleHoverClass.trim(),
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      }),
    onSuccess: async () => {
      toast.success("Service category created");
      setOpen(false);
      setForm(EMPTY);
      await invalidate();
    },
    onError: () => toast.error("Could not create category"),
  });

  const updateM = useMutation({
    mutationFn: () =>
      updateAdminServiceCategory(token!, editingId!, {
        code: form.code.trim().toLowerCase(),
        slug: form.slug.trim(),
        iconKey: form.iconKey,
        iconUrl: null,
        borderClass: form.borderClass.trim(),
        iconWrapClass: form.iconWrapClass.trim(),
        titleHoverClass: form.titleHoverClass.trim(),
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      }),
    onSuccess: async () => {
      toast.success("Service category updated");
      setEditingId(null);
      setOpen(false);
      setForm(EMPTY);
      await invalidate();
    },
    onError: () => toast.error("Could not update category"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteAdminServiceCategory(token!, id),
    onSuccess: async () => {
      toast.success("Deleted");
      setEditingId(null);
      setForm(EMPTY);
      await invalidate();
    },
    onError: () => toast.error("Cannot delete — category may be linked to caterer profiles"),
  });

  const rows = useMemo(() => listQ.data ?? [], [listQ.data]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(row: AdminServiceCategoryItem) {
    setEditingId(row.id);
    setForm(toForm(row));
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  }

  const saveTranslationM = useMutation({
    mutationFn: () => {
      if (!translatingRow || !activeLanguageId) throw new Error("missing");
      return upsertAdminServiceCategoryTranslation(token!, translatingRow.id, {
        languageId: Number(activeLanguageId),
        name: translationName.trim(),
        shortDescription: translationDescription.trim(),
      });
    },
    onSuccess: async (updated) => {
      toast.success("Translation saved");
      setTranslatingRow(updated);
      await invalidate();
    },
    onError: () => toast.error("Could not save translation"),
  });

  const deleteTranslationM = useMutation({
    mutationFn: (payload: { categoryId: string; languageId: string }) =>
      deleteAdminServiceCategoryTranslation(token!, payload.categoryId, payload.languageId),
    onSuccess: async () => {
      toast.success("Translation removed");
      setTranslationName("");
      setTranslationDescription("");
      await invalidate();
      if (translatingRow) {
        const fresh = (await fetchAdminServiceCategories(token!)).find(
          (r) => r.id === translatingRow.id,
        );
        if (fresh) setTranslatingRow(fresh);
      }
    },
    onError: () => toast.error("Could not remove translation"),
  });

  function onTranslationTab(language: AdminLanguageItem) {
    setActiveLanguageId(language.id);
    if (!translatingRow) return;
    const hit = translatingRow.translations.find((t) => t.languageId === language.id);
    if (hit) {
      setTranslationName(hit.name);
      setTranslationDescription(hit.shortDescription);
      return;
    }
    const en = translatingRow.translations.find((t) => t.languageCode === "en");
    setTranslationName(en?.name ?? translatingRow.name);
    setTranslationDescription(en?.shortDescription ?? translatingRow.shortDescription);
  }

  function openTranslate(row: AdminServiceCategoryItem) {
    setTranslatingRow(row);
    setTranslateOpen(true);
    const enLang =
      translationLanguages.find((l) => l.code === "en") ?? translationLanguages[0];
    if (enLang) onTranslationTab(enLang);
  }

  function submit() {
    if (editingId) {
      if (!form.code.trim()) {
        toast.warn("Code is required");
        return;
      }
      updateM.mutate();
      return;
    }
    if (!form.code.trim() || !form.name.trim() || !form.shortDescription.trim()) {
      toast.warn("Code, English name, and description are required");
      return;
    }
    createM.mutate();
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Service categories" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-dark">Service categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Marketplace categories on the home page. Pick a Phosphor icon for each card — the same
            style as the original site design.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          <Plus aria-hidden />
          Add category
        </button>
      </div>

      {listQ.isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : listQ.isError ? (
        <p className="text-sm text-red-600">Could not load categories.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Profiles</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                  <td className="px-4 py-3 tabular-nums">{row.displayOrder}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.code}</td>
                  <td className="px-4 py-3 font-semibold text-brand-text-dark">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.slug}</td>
                  <td className="px-4 py-3">
                    <CategoryIconPreview
                      iconKey={row.iconKey}
                      className="h-6 w-6 text-brand-text-muted"
                      wrapClassName="h-10 w-10 bg-gray-50"
                    />
                  </td>
                  <td className="px-4 py-3">{row.isActive ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 tabular-nums">{row.profileLinkCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        title="Translate"
                        aria-label={`Translate ${row.name}`}
                        onClick={() => openTranslate(row)}
                        className="cursor-pointer rounded-lg border border-gray-200 p-2 hover:border-brand-dark hover:text-brand-dark"
                      >
                        <Translate size={18} aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${row.name}`}
                        onClick={() => openEdit(row)}
                        className="cursor-pointer rounded-lg border border-gray-200 p-2 hover:border-brand-red hover:text-brand-red"
                      >
                        <PencilSimple aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${row.name}`}
                        disabled={row.profileLinkCount > 0}
                        onClick={() => {
                          if (confirm(`Delete "${row.name}"?`)) deleteM.mutate(row.id);
                        }}
                        className="cursor-pointer rounded-lg border border-gray-200 p-2 hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={open}
        size="lg"
        title={editingId ? "Edit service category" : "New service category"}
        description={
          editingId
            ? "Update code, slug, icon, and display settings. Use Translate for names and descriptions."
            : "English name and description are stored as the default translation."
        }
        onClose={closeModal}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={createM.isPending || updateM.isPending}
              onClick={submit}
              className="cursor-pointer rounded-lg bg-brand-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {createM.isPending || updateM.isPending
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Create"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminModalField label="Code *">
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="c9"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </AdminModalField>
          <AdminModalField label="Display order">
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </AdminModalField>
        </div>
        {!editingId ? (
          <>
            <AdminModalField label="English name *">
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.slug || slugify(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </AdminModalField>
            <AdminModalField label="Short description (English) *">
              <textarea
                value={form.shortDescription}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                rows={3}
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </AdminModalField>
          </>
        ) : null}
        <AdminModalField label="Slug">
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </AdminModalField>
        <AdminModalField label="Icon">
          <p className="mb-3 text-xs text-gray-500">
            Phosphor icon shown in the colored circle on the home page (e.g. bowl-food, cake).
          </p>
          <div
            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${getCategoryIconWrapBase(form.iconWrapClass)} ${getCategoryIconHoverClasses(form.iconWrapClass)}`}
          >
            {(() => {
              const PreviewIcon = getServiceCategoryIcon(form.iconKey);
              return <PreviewIcon className="text-3xl" aria-hidden />;
            })()}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {SERVICE_CATEGORY_ICON_OPTIONS.map((key) => {
              const OptionIcon = getServiceCategoryIcon(key);
              const selected = form.iconKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  title={key}
                  aria-label={key}
                  aria-pressed={selected}
                  onClick={() => setForm((f) => ({ ...f, iconKey: key }))}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-2 text-xs transition ${
                    selected
                      ? "border-brand-red bg-brand-red-light text-brand-red"
                      : "border-gray-200 hover:border-brand-red/50"
                  }`}
                >
                  <OptionIcon className="text-xl" aria-hidden />
                  <span className="max-w-full truncate font-mono text-[10px]">{key}</span>
                </button>
              );
            })}
          </div>
        </AdminModalField>
        <AdminModalField label="Border class (Tailwind)">
          <input
            value={form.borderClass}
            onChange={(e) => setForm((f) => ({ ...f, borderClass: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
          />
        </AdminModalField>
        <AdminModalField label="Icon wrap classes">
          <input
            value={form.iconWrapClass}
            onChange={(e) => setForm((f) => ({ ...f, iconWrapClass: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
          />
        </AdminModalField>
        <AdminModalField label="Title hover class">
          <input
            value={form.titleHoverClass}
            onChange={(e) => setForm((f) => ({ ...f, titleHoverClass: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
          />
        </AdminModalField>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-text-dark">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          Active on public site
        </label>
      </AdminModal>

      <AdminModal
        open={translateOpen && Boolean(translatingRow)}
        title="Translate service category"
        description={
          translatingRow
            ? `${translatingRow.code} · ${translatingRow.translations.find((t) => t.languageCode === "en")?.name ?? translatingRow.name}`
            : undefined
        }
        size="lg"
        onClose={() => {
          if (saveTranslationM.isPending || deleteTranslationM.isPending) return;
          setTranslateOpen(false);
        }}
        footer={
          translatingRow ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-[40px]">
                {translationLanguages.find((l) => l.id === activeLanguageId)?.code !== "en" ? (
                  <button
                    type="button"
                    disabled={deleteTranslationM.isPending || saveTranslationM.isPending}
                    onClick={() => {
                      const exists = translatingRow.translations.find(
                        (t) => t.languageId === activeLanguageId,
                      );
                      if (!exists) {
                        toast.error("No translation to remove for this language.");
                        return;
                      }
                      deleteTranslationM.mutate({
                        categoryId: translatingRow.id,
                        languageId: activeLanguageId,
                      });
                    }}
                    className="cursor-pointer rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteTranslationM.isPending ? "Removing…" : "Remove translation"}
                  </button>
                ) : (
                  <p className="max-w-xs text-xs leading-snug text-brand-text-muted">
                    English is required. Edit it here or when creating a category.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={saveTranslationM.isPending || deleteTranslationM.isPending}
                onClick={() => {
                  if (!translationName.trim() || !translationDescription.trim()) {
                    toast.error("Name and description are required.");
                    return;
                  }
                  saveTranslationM.mutate();
                }}
                className="cursor-pointer rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveTranslationM.isPending ? "Saving…" : "Save translation"}
              </button>
            </div>
          ) : null
        }
      >
        {translatingRow ? (
          <div className="space-y-5">
            <AdminModalField label="Language">
              <div className="flex flex-wrap gap-2">
                {translationLanguages.map((language) => {
                  const has = translatingRow.translations.some((t) => t.languageId === language.id);
                  const active = activeLanguageId === language.id;
                  return (
                    <button
                      key={language.id}
                      type="button"
                      onClick={() => onTranslationTab(language)}
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
            <AdminModalField label="Name">
              <input
                value={translationName}
                onChange={(e) => setTranslationName(e.target.value)}
                className="admin-field-quiet w-full px-3 py-3"
              />
            </AdminModalField>
            <AdminModalField label="Short description">
              <textarea
                value={translationDescription}
                onChange={(e) => setTranslationDescription(e.target.value)}
                rows={4}
                className="admin-field-quiet w-full resize-y px-3 py-3"
              />
            </AdminModalField>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
