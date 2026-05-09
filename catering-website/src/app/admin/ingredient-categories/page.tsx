"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminTableSortArrows } from "@/components/admin/AdminTableSortArrows";
import { AdminModal, AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminIngredientCategory,
  deleteAdminIngredientCategory,
  deleteAdminIngredientCategoryTranslation,
  fetchAdminIngredientCategories,
  fetchAdminLanguages,
  type AdminIngredientCategoryItem,
  type AdminLanguageItem,
  upsertAdminIngredientCategoryTranslation,
  updateAdminIngredientCategory,
} from "@/lib/admin-api";
import { uploadCateringImage } from "@/lib/catering-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Translate,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

type CategoryForm = {
  englishName: string;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  imageUrl: string;
};

type CategorySortDir = "asc" | "desc";

const EMPTY_FORM: CategoryForm = {
  englishName: "",
  displayOrder: 0,
  isFeatured: false,
  isActive: true,
  imageUrl: "",
};

function slugify(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}

/** Page indices for numbered pagination buttons (with ellipsis gaps). */
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

export default function AdminIngredientCategoriesPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isTranslateModalOpen, setTranslateModalOpen] = useState(false);
  const [translateCategoryId, setTranslateCategoryId] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortDir, setSortDir] = useState<CategorySortDir>("asc");
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [activeTranslationLanguageId, setActiveTranslationLanguageId] = useState("");
  const [translationName, setTranslationName] = useState("");
  const [isDragOver, setDragOver] = useState(false);
  const [isUploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const debouncedQ = useDebouncedValue(draftQ, ADMIN_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const next = debouncedQ.trim();
    setAppliedQ((prev) => (prev === next ? prev : next));
  }, [debouncedQ]);

  const categoriesQ = useQuery({
    queryKey: ["admin", "ingredient-categories", token],
    queryFn: () => fetchAdminIngredientCategories(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });
  const languagesQ = useQuery({
    queryKey: ["admin", "languages", token],
    queryFn: () => fetchAdminLanguages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  function closeCategoryModal() {
    setCategoryModalOpen(false);
    setDragOver(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  const saveCategoryM = useMutation({
    mutationFn: async (): Promise<{ mode: "create" | "edit" }> => {
      const slug = slugify(form.englishName);
      if (!slug) throw new Error("Please provide English name");
      const normalizedName = form.englishName.trim().toLowerCase();
      const levelParentId =
        editingId != null
          ? (categoriesQ.data?.find((x) => x.id === editingId)?.parentId ?? null)
          : null;
      const duplicateName = categoriesQ.data?.some((c) => {
        if (editingId && c.id === editingId) return false;
        const sameLevel = (c.parentId ?? null) === (levelParentId ?? null);
        if (!sameLevel) return false;
        const en = c.translations.find((t) => t.languageCode === "en");
        return (en?.name ?? "").trim().toLowerCase() === normalizedName;
      });
      if (duplicateName) {
        throw new Error("Category name must be unique");
      }
      const payload = {
        slug,
        imageUrl: form.imageUrl || undefined,
        displayOrder: form.displayOrder,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        englishName: form.englishName.trim(),
      };
      if (editingId) {
        await updateAdminIngredientCategory(token!, editingId, {
          slug: payload.slug,
          imageUrl: payload.imageUrl ?? null,
          displayOrder: payload.displayOrder,
          isFeatured: payload.isFeatured,
          isActive: payload.isActive,
        });
        const english = languagesQ.data?.find((l) => l.code === "en");
        if (english) {
          const langNum = Number(english.id);
          if (Number.isNaN(langNum)) throw new Error("Invalid English language id");
          await upsertAdminIngredientCategoryTranslation(token!, editingId, {
            languageId: langNum,
            name: form.englishName.trim(),
          });
        }
        return { mode: "edit" as const };
      }
      await createAdminIngredientCategory(token!, payload);
      return { mode: "create" as const };
    },
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["admin", "ingredient-categories"] });
      closeCategoryModal();
      toast.success(result.mode === "edit" ? "Category updated successfully." : "Category created successfully.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save category."),
  });

  const deleteCategoryM = useMutation({
    mutationFn: (id: string) => deleteAdminIngredientCategory(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "ingredient-categories"] });
      toast.success("Category deleted successfully.");
    },
    onError: () => toast.error("Could not delete category."),
  });

  const saveTranslationM = useMutation({
    mutationFn: async () => {
      const langNum = Number(activeTranslationLanguageId);
      if (Number.isNaN(langNum)) throw new Error("Invalid language");
      return upsertAdminIngredientCategoryTranslation(token!, translateCategoryId!, {
        languageId: langNum,
        name: translationName.trim(),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "ingredient-categories"] });
      toast.success("Translation saved successfully.");
    },
    onError: () => toast.error("Could not save translation."),
  });

  const deleteTranslationM = useMutation({
    mutationFn: ({ categoryId, languageId }: { categoryId: string; languageId: string }) =>
      deleteAdminIngredientCategoryTranslation(token!, categoryId, languageId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "ingredient-categories"] });
      toast.success("Translation removed successfully.");
    },
    onError: () => toast.error("Could not delete translation. English is required."),
  });

  const translatingCategory = useMemo(
    () => categoriesQ.data?.find((x) => x.id === translateCategoryId) ?? null,
    [categoriesQ.data, translateCategoryId],
  );

  const translationLanguages = useMemo(
    () => (languagesQ.data ?? []).filter((l) => l.isActive),
    [languagesQ.data],
  );
  const filteredCategories = useMemo(() => {
    const q = appliedQ.trim().toLowerCase();
    const allCategories = categoriesQ.data ?? [];
    const base = !q
      ? allCategories
      : allCategories.filter((row) => {
          const en = row.translations.find((t) => t.languageCode === "en");
          return [row.slug, en?.name ?? ""].some((v) => v.toLowerCase().includes(q));
        });

    return [...base].sort((a, b) => {
      const aCategory = (a.translations.find((t) => t.languageCode === "en")?.name ?? a.slug).toLowerCase();
      const bCategory = (b.translations.find((t) => t.languageCode === "en")?.name ?? b.slug).toLowerCase();
      const cmp = aCategory.localeCompare(bCategory);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [appliedQ, categoriesQ.data, sortDir]);

  const filteredTotal = filteredCategories.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredTotal / limit)), [filteredTotal, limit]);
  const pageButtons = useMemo(() => visiblePageNumbers(page, totalPages), [page, totalPages]);

  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredCategories.slice(start, start + limit);
  }, [filteredCategories, page, limit]);

  const showingFrom = filteredTotal === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, filteredTotal);

  useEffect(() => {
    setPage(1);
  }, [appliedQ, sortDir]);

  useEffect(() => {
    setPage((p) => {
      const maxPage = Math.max(1, Math.ceil(filteredTotal / limit) || 1);
      return p > maxPage ? maxPage : p;
    });
  }, [filteredTotal, limit]);

  function toggleCategorySort() {
    setPage(1);
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  const flushSearchNow = useCallback(() => {
    setAppliedQ(draftQ.trim());
    setPage(1);
  }, [draftQ]);

  async function uploadImage(file: File) {
    if (!token) return;
    try {
      setUploadingImage(true);
      const uploaded = await uploadCateringImage(token, file, "gallery");
      setForm((s) => ({ ...s, imageUrl: uploaded.url }));
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDragOver(false);
    setCategoryModalOpen(true);
  }

  function openEditModal(row: AdminIngredientCategoryItem) {
    const en = row.translations.find((t) => t.languageCode === "en");
    setEditingId(row.id);
    setForm({
      englishName: en?.name ?? "",
      displayOrder: row.displayOrder,
      isFeatured: row.isFeatured,
      isActive: row.isActive,
      imageUrl: row.imageUrl ?? "",
    });
    setDragOver(false);
    setCategoryModalOpen(true);
  }

  function openTranslateModal(row: AdminIngredientCategoryItem) {
    const languages = (languagesQ.data ?? []).filter((l) => l.isActive);
    const first = languages.find((l) => l.code === "en") ?? languages[0];
    const existing = row.translations.find((t) => t.languageId === first?.id);
    setTranslateCategoryId(row.id);
    setActiveTranslationLanguageId(first?.id ?? "");
    setTranslationName(existing?.name ?? "");
    setTranslateModalOpen(true);
  }

  function onTranslationTabChange(language: AdminLanguageItem) {
    const existing = translatingCategory?.translations.find(
      (t) => t.languageId === language.id,
    );
    setActiveTranslationLanguageId(language.id);
    setTranslationName(existing?.name ?? "");
  }

  if (categoriesQ.isPending || languagesQ.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-brand-text-muted">
        Loading ingredient categories…
      </div>
    );
  }
  if (categoriesQ.isError || languagesQ.isError || !categoriesQ.data || !languagesQ.data) {
    return (
      <div className="admin-panel-card border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        Could not load ingredient categories.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1400px]">
      <AdminBreadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Ingredient categories" }]} />

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
                placeholder="Search category or slug..."
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
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
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
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5"
              >
                <Plus size={16} weight="bold" />
                Add Category
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="admin-datatable-thead sticky top-0 z-[1]">
              <tr>
                <th className="admin-datatable-th">
                  <button
                    type="button"
                    onClick={() => toggleCategorySort()}
                    className="inline-flex cursor-pointer items-center gap-1 hover:bg-brand-page"
                  >
                    Category
                    <AdminTableSortArrows active sortDir={sortDir} size={13} />
                  </button>
                </th>
                <th className="admin-datatable-th">Order</th>
                <th className="admin-datatable-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="admin-datatable-cell py-20 text-center">
                    <p className="text-base font-semibold text-brand-text-dark">No categories match your filters</p>
                    <p className="mt-1 text-sm text-brand-text-muted">Try a different search or clear the query.</p>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((row) => {
                  const en = row.translations.find((t) => t.languageCode === "en");
                  return (
                    <tr key={row.id}>
                      <td className="admin-datatable-cell">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-red-light">
                            {row.imageUrl ? (
                              <img src={row.imageUrl} alt={en?.name ?? row.slug} className="size-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold uppercase text-brand-red">Ing</span>
                            )}
                          </div>
                          <p className="font-bold text-brand-text-dark">{en?.name ?? "—"}</p>
                        </div>
                      </td>
                      <td className="admin-datatable-cell tabular-nums text-brand-text-muted">{row.displayOrder}</td>
                      <td className="admin-datatable-cell text-right">
                        <div className="inline-flex justify-end gap-2">
                          <button
                            type="button"
                            title="Translate"
                            onClick={() => openTranslateModal(row)}
                            className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-brand-text-dark shadow-sm transition hover:bg-brand-dark hover:text-white"
                          >
                            <Translate size={18} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEditModal(row)}
                            className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
                          >
                            <PencilSimple size={18} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              if (confirm(`Delete "${row.slug}"?`)) deleteCategoryM.mutate(row.id);
                            }}
                            className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-brand-red shadow-sm transition hover:bg-brand-red hover:text-white"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-4 border-t border-gray-100 p-6 md:flex-row md:items-center md:justify-between">
          <p className="text-center text-sm text-brand-text-muted md:text-left">
            Showing {showingFrom} to {showingTo} of {filteredTotal} entries
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

      <AdminModal
        open={isCategoryModalOpen}
        title={editingId ? "Edit ingredient category" : "Add ingredient category"}
        description={
          editingId
            ? "Change English name, image, and listing options. Slug follows the name—avoid duplicates."
            : "English name is required. Categories are managed as a flat list in admin."
        }
        size="lg"
        onClose={() => {
          if (saveCategoryM.isPending) return;
          closeCategoryModal();
        }}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (saveCategoryM.isPending) return;
                closeCategoryModal();
              }}
              disabled={saveCategoryM.isPending}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-brand-text-dark transition hover:bg-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveCategoryM.mutate()}
              disabled={saveCategoryM.isPending}
              className="rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saveCategoryM.isPending ? "Saving…" : "Save category"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <AdminModalField label="English name (required)">
            <input
              value={form.englishName}
              onChange={(e) => setForm((s) => ({ ...s, englishName: e.target.value }))}
              placeholder="e.g. Vegetables"
              className="admin-field-quiet w-full px-3 py-3"
              autoComplete="off"
            />
          </AdminModalField>

          <AdminModalField label="URL slug (preview)">
            <div className="rounded-xl border border-gray-100 bg-brand-page px-3 py-3 font-mono text-sm font-semibold text-brand-text-dark">
              {slugify(form.englishName) || "—"}
            </div>
          </AdminModalField>

          <AdminModalField label="Thumbnail image">
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void uploadImage(f);
              }}
              onClick={() => imageInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  imageInputRef.current?.click();
                }
              }}
              className={`rounded-xl border-2 border-dashed p-6 text-center text-sm transition outline-none ring-brand-red/25 focus-visible:ring-2 ${isDragOver ? "border-brand-red bg-brand-red-light" : "border-gray-200 bg-brand-page"}`}
            >
              <UploadSimple size={22} className="mx-auto mb-2 text-brand-text-muted" aria-hidden />
              <p className="font-semibold text-brand-text-dark">Drag & drop or click to upload</p>
              <p className="mt-1 text-xs text-brand-text-muted">PNG, JPG, WebP · uploads to gallery storage</p>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadImage(f);
                }}
                className="sr-only"
              />
              {isUploadingImage ? (
                <p className="mt-3 text-xs font-bold text-brand-red">Uploading…</p>
              ) : null}
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt=""
                  className="mx-auto mt-4 h-24 w-24 rounded-2xl object-cover shadow-md ring-1 ring-gray-100"
                />
              ) : null}
            </div>
          </AdminModalField>

          <AdminModalField label="Display order">
            <input
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(e) => setForm((s) => ({ ...s, displayOrder: Number(e.target.value || 0) }))}
              className="admin-field-quiet w-full max-w-xs px-3 py-3 tabular-nums"
            />
          </AdminModalField>

          <div className="flex flex-wrap gap-6 rounded-xl border border-gray-100 bg-brand-page/80 px-4 py-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-brand-text-dark">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((s) => ({ ...s, isFeatured: e.target.checked }))}
                className="size-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
              />
              Featured
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-brand-text-dark">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                className="size-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
              />
              Active (visible)
            </label>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={isTranslateModalOpen && Boolean(translatingCategory)}
        title="Translate ingredient category"
        description={
          translatingCategory
            ? `Slug · ${translatingCategory.slug}`
            : undefined
        }
        onClose={() => {
          if (saveTranslationM.isPending || deleteTranslationM.isPending) return;
          setTranslateModalOpen(false);
        }}
        footer={
          translatingCategory ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-[40px]">
                {translationLanguages.find((l) => l.id === activeTranslationLanguageId)?.code !== "en" ? (
                  <button
                    type="button"
                    disabled={deleteTranslationM.isPending || saveTranslationM.isPending}
                    onClick={() => {
                      const exists = translatingCategory.translations.find(
                        (t) => t.languageId === activeTranslationLanguageId,
                      );
                      if (!exists) {
                        toast.error("No translation exists to remove for this language.");
                        return;
                      }
                      deleteTranslationM.mutate({
                        categoryId: translatingCategory.id,
                        languageId: activeTranslationLanguageId,
                      });
                      setTranslationName("");
                    }}
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    {deleteTranslationM.isPending ? "Removing…" : "Remove translation"}
                  </button>
                ) : (
                  <p className="max-w-xs text-xs leading-snug text-brand-text-muted">
                    English is managed from <span className="font-semibold text-brand-text-dark">Add / Edit category</span>.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={saveTranslationM.isPending || deleteTranslationM.isPending}
                onClick={() => {
                  if (!activeTranslationLanguageId) {
                    toast.error("Select a language tab.");
                    return;
                  }
                  const langNum = Number(activeTranslationLanguageId);
                  if (Number.isNaN(langNum)) {
                    toast.error("Invalid language.");
                    return;
                  }
                  if (!translationName.trim()) {
                    toast.error("Enter a translated name.");
                    return;
                  }
                  saveTranslationM.mutate();
                }}
                className="rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {saveTranslationM.isPending ? "Saving…" : "Save translation"}
              </button>
            </div>
          ) : null
        }
      >
        {translatingCategory ? (
          <div className="space-y-5">
            <AdminModalField label="Language">
              <div className="flex flex-wrap gap-2">
                {translationLanguages.map((language) => {
                  const hasTranslation = translatingCategory.translations.some(
                    (t) => t.languageId === language.id,
                  );
                  const active = activeTranslationLanguageId === language.id;
                  return (
                    <button
                      key={language.id}
                      type="button"
                      onClick={() => onTranslationTabChange(language)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        active
                          ? "border-brand-red bg-brand-red text-white shadow-md"
                          : "border-gray-200 bg-white text-brand-text-dark hover:bg-brand-page"
                      }`}
                    >
                      {language.name} ({language.code})
                      {hasTranslation ? " · ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </AdminModalField>

            <AdminModalField label="Translated name">
              <input
                value={translationName}
                onChange={(e) => setTranslationName(e.target.value)}
                placeholder="Name in selected language"
                className="admin-field-quiet w-full px-3 py-3"
              />
            </AdminModalField>
          </div>
        ) : null}
      </AdminModal>
    </section>
  );
}
