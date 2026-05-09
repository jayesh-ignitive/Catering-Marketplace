"use client";

import { useAuth } from "@/context/AuthContext";
import {
  createAdminMenuCategory,
  deleteAdminMenuCategory,
  deleteAdminMenuCategoryTranslation,
  fetchAdminLanguages,
  fetchAdminMenuCategories,
  type AdminLanguageItem,
  type AdminMenuCategoryItem,
  upsertAdminMenuCategoryTranslation,
  updateAdminMenuCategory,
} from "@/lib/admin-api";
import { uploadCateringImage } from "@/lib/catering-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CaretDown,
  CaretUp,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Translate,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

type CategoryForm = {
  englishName: string;
  englishDescription: string;
  parentId: string;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  imageUrl: string;
};

type CategorySortField = "category" | "parent";
type CategorySortDir = "asc" | "desc";

const EMPTY_FORM: CategoryForm = {
  englishName: "",
  englishDescription: "",
  parentId: "",
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

export default function AdminMenuCategoriesPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isTranslateModalOpen, setTranslateModalOpen] = useState(false);
  const [translateCategoryId, setTranslateCategoryId] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [sortBy, setSortBy] = useState<CategorySortField>("category");
  const [sortDir, setSortDir] = useState<CategorySortDir>("asc");
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [activeTranslationLanguageId, setActiveTranslationLanguageId] = useState("");
  const [translationName, setTranslationName] = useState("");
  const [translationDescription, setTranslationDescription] = useState("");
  const [isDragOver, setDragOver] = useState(false);
  const [isUploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const categoriesQ = useQuery({
    queryKey: ["admin", "menu-categories", token],
    queryFn: () => fetchAdminMenuCategories(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });
  const languagesQ = useQuery({
    queryKey: ["admin", "languages", token],
    queryFn: () => fetchAdminLanguages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const saveCategoryM = useMutation({
    mutationFn: async () => {
      const slug = slugify(form.englishName);
      if (!slug) throw new Error("Please provide English name");
      const normalizedName = form.englishName.trim().toLowerCase();
      const sameLevelConflict = categoriesQ.data?.some((c) => {
        if (editingId && c.id === editingId) return false;
        const sameParent = (c.parentId ?? "") === (form.parentId || "");
        if (!sameParent) return false;
        const en = c.translations.find((t) => t.languageCode === "en");
        return (en?.name ?? "").trim().toLowerCase() === normalizedName;
      });
      if (sameLevelConflict) {
        throw new Error("Category name must be unique on the same level");
      }
      const payload = {
        parentId: form.parentId ? Number(form.parentId) : undefined,
        slug,
        imageUrl: form.imageUrl || undefined,
        displayOrder: form.displayOrder,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        englishName: form.englishName.trim(),
        englishDescription: form.englishDescription.trim() || undefined,
      };
      if (editingId) {
        const updated = await updateAdminMenuCategory(token!, editingId, {
          parentId: payload.parentId ?? null,
          slug: payload.slug,
          imageUrl: payload.imageUrl ?? null,
          displayOrder: payload.displayOrder,
          isFeatured: payload.isFeatured,
          isActive: payload.isActive,
        });
        const english = languagesQ.data?.find((l) => l.code === "en");
        if (english) {
          await upsertAdminMenuCategoryTranslation(token!, editingId, {
            languageId: Number(english.id),
            name: form.englishName.trim(),
            description: form.englishDescription.trim() || undefined,
          });
        }
        return updated;
      }
      return createAdminMenuCategory(token!, payload);
    },
    onSuccess: async () => {
      const wasEdit = Boolean(editingId);
      await qc.invalidateQueries({ queryKey: ["admin", "menu-categories"] });
      setCategoryModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      toast.success(wasEdit ? "Category updated successfully." : "Category created successfully.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save category."),
  });

  const deleteCategoryM = useMutation({
    mutationFn: (id: string) => deleteAdminMenuCategory(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "menu-categories"] });
      toast.success("Category deleted successfully.");
    },
    onError: () => toast.error("Could not delete category."),
  });

  const saveTranslationM = useMutation({
    mutationFn: async () =>
      upsertAdminMenuCategoryTranslation(token!, translateCategoryId!, {
        languageId: Number(activeTranslationLanguageId),
        name: translationName.trim(),
        description: translationDescription.trim() || undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "menu-categories"] });
      toast.success("Translation saved successfully.");
    },
    onError: () => toast.error("Could not save translation."),
  });

  const deleteTranslationM = useMutation({
    mutationFn: ({ categoryId, languageId }: { categoryId: string; languageId: string }) =>
      deleteAdminMenuCategoryTranslation(token!, categoryId, languageId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "menu-categories"] });
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
      const parent = allCategories.find((c) => c.id === row.parentId);
      const parentEn = parent?.translations.find((t) => t.languageCode === "en");
      return [row.slug, en?.name ?? "", parentEn?.name ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      );
    });

    return [...base].sort((a, b) => {
      const aCategory = (a.translations.find((t) => t.languageCode === "en")?.name ?? a.slug).toLowerCase();
      const bCategory = (b.translations.find((t) => t.languageCode === "en")?.name ?? b.slug).toLowerCase();
      const aParent = a.parentId
        ? (allCategories
            .find((c) => c.id === a.parentId)
            ?.translations.find((t) => t.languageCode === "en")?.name ?? "")
            .toLowerCase()
        : "";
      const bParent = b.parentId
        ? (allCategories
            .find((c) => c.id === b.parentId)
            ?.translations.find((t) => t.languageCode === "en")?.name ?? "")
            .toLowerCase()
        : "";

      const cmp =
        sortBy === "category"
          ? aCategory.localeCompare(bCategory)
          : aParent.localeCompare(bParent);

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [appliedQ, categoriesQ.data, sortBy, sortDir]);

  function toggleSort(field: CategorySortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortDir("asc");
  }

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
    setCategoryModalOpen(true);
  }

  function openEditModal(row: AdminMenuCategoryItem) {
    const en = row.translations.find((t) => t.languageCode === "en");
    setEditingId(row.id);
    setForm({
      englishName: en?.name ?? "",
      englishDescription: en?.description ?? "",
      parentId: row.parentId ?? "",
      displayOrder: row.displayOrder,
      isFeatured: row.isFeatured,
      isActive: row.isActive,
      imageUrl: row.imageUrl ?? "",
    });
    setCategoryModalOpen(true);
  }

  function openTranslateModal(row: AdminMenuCategoryItem) {
    const languages = (languagesQ.data ?? []).filter((l) => l.isActive);
    const first = languages.find((l) => l.code === "en") ?? languages[0];
    const existing = row.translations.find((t) => t.languageId === first?.id);
    setTranslateCategoryId(row.id);
    setActiveTranslationLanguageId(first?.id ?? "");
    setTranslationName(existing?.name ?? "");
    setTranslationDescription(existing?.description ?? "");
    setTranslateModalOpen(true);
  }

  function onTranslationTabChange(language: AdminLanguageItem) {
    const existing = translatingCategory?.translations.find(
      (t) => t.languageId === language.id,
    );
    setActiveTranslationLanguageId(language.id);
    setTranslationName(existing?.name ?? "");
    setTranslationDescription(existing?.description ?? "");
  }

  function applySearch() {
    setAppliedQ(draftQ.trim());
  }

  if (categoriesQ.isPending || languagesQ.isPending) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-slate-600">Loading menu categories…</div>;
  }
  if (categoriesQ.isError || languagesQ.isError || !categoriesQ.data || !languagesQ.data) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">Could not load menu categories.</div>;
  }

  return (
    <section className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Catalog</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Menu Categories
          </h1>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:max-w-3xl">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search category, slug, or parent..."
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              className="w-full rounded-none border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-brand-red/25 transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={applySearch}
              className="cursor-pointer rounded-none bg-brand-red px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-[0.96]"
            >
              Search
            </button>
            {appliedQ ? (
              <button
                type="button"
                onClick={() => {
                  setDraftQ("");
                  setAppliedQ("");
                }}
                className="cursor-pointer rounded-none border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Clear
              </button>
            ) : null}
            <button
              onClick={openCreateModal}
              className="inline-flex cursor-pointer items-center gap-1 rounded-none bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-[0.96]"
            >
              <Plus size={14} />
              Add Category
            </button>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-none border border-slate-200/90 bg-white shadow-md shadow-slate-200/40">
        <div className="overflow-x-auto border-b border-slate-100">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <button
                    type="button"
                    onClick={() => toggleSort("category")}
                    className="inline-flex cursor-pointer items-center gap-1"
                  >
                    Category
                    {sortBy === "category" ? (
                      sortDir === "asc" ? <CaretUp size={13} /> : <CaretDown size={13} />
                    ) : (
                      <CaretUp size={13} className="opacity-35" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <button
                    type="button"
                    onClick={() => toggleSort("parent")}
                    className="inline-flex cursor-pointer items-center gap-1"
                  >
                    Parent
                    {sortBy === "parent" ? (
                      sortDir === "asc" ? <CaretUp size={13} /> : <CaretDown size={13} />
                    ) : (
                      <CaretUp size={13} className="opacity-35" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">Order</th>
                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">Image</th>
                <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-20 text-center">
                    <p className="text-base font-semibold text-slate-700">No categories match your filters</p>
                    <p className="mt-1 text-sm text-slate-500">Try a different search or clear the query.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((row) => {
                  const en = row.translations.find((t) => t.languageCode === "en");
                  const parent = row.parentId ? categoriesQ.data.find((c) => c.id === row.parentId) : null;
                  const parentEn = parent?.translations.find((t) => t.languageCode === "en");
                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-red-50/50 odd:bg-slate-50/40 hover:odd:bg-red-50/50"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{en?.name ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {parentEn?.name ? <span className="font-medium">{parentEn.name}</span> : <span className="text-slate-400">Root</span>}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-slate-700">{row.displayOrder}</td>
                      <td className="px-4 py-3.5">
                        {row.imageUrl ? (
                          <img src={row.imageUrl} alt={en?.name ?? row.slug} className="h-10 w-10 rounded-md object-cover ring-1 ring-slate-200" />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openTranslateModal(row)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                          >
                            <Translate size={14} />
                            Translate
                          </button>
                          <button
                            onClick={() => openEditModal(row)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                          >
                            <PencilSimple size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${row.slug}"?`)) deleteCategoryM.mutate(row.id);
                            }}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700"
                          >
                            <Trash size={14} />
                            Delete
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
      </div>

      {isCategoryModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit Category" : "Create Category"}</h2>
              <button onClick={() => setCategoryModalOpen(false)} className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.englishName} onChange={(e) => setForm((s) => ({ ...s, englishName: e.target.value }))} placeholder="Category name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">Slug: <span className="font-mono font-semibold text-slate-800">{slugify(form.englishName) || "—"}</span></div>
              <textarea value={form.englishDescription} onChange={(e) => setForm((s) => ({ ...s, englishDescription: e.target.value }))} placeholder="Category description (optional)" className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

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
                className={`rounded-lg border-2 border-dashed p-4 text-center text-sm ${isDragOver ? "border-brand-red bg-red-50" : "border-slate-300 bg-slate-50"}`}
              >
                <UploadSimple size={18} className="mx-auto mb-1 text-slate-500" />
                <p className="font-semibold text-slate-700">Drag & drop image here</p>
                <p className="text-xs text-slate-500">or click anywhere here to choose a file</p>
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
                {isUploadingImage ? <p className="mt-2 text-xs font-semibold text-brand-red">Uploading...</p> : null}
                {form.imageUrl ? <img src={form.imageUrl} alt="Category preview" className="mx-auto mt-2 h-20 w-20 rounded-md object-cover" /> : null}
              </div>

              <select
                value={form.parentId}
                onChange={(e) => setForm((s) => ({ ...s, parentId: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">No parent (optional)</option>
                {categoriesQ.data
                  .filter((c) => c.id !== editingId && c.parentId === null)
                  .map((c) => {
                    const en = c.translations.find((t) => t.languageCode === "en");
                    return (
                      <option key={c.id} value={c.id}>
                        {en?.name ?? c.slug}
                      </option>
                    );
                  })}
              </select>
              <input type="number" min={0} value={form.displayOrder} onChange={(e) => setForm((s) => ({ ...s, displayOrder: Number(e.target.value || 0) }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((s) => ({ ...s, isFeatured: e.target.checked }))} /> Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} /> Active</label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setCategoryModalOpen(false)} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Cancel</button>
              <button onClick={() => saveCategoryM.mutate()} className="cursor-pointer rounded-lg bg-brand-red px-3 py-2 text-xs font-bold text-white">Save</button>
            </div>
          </div>
        </div>
      ) : null}

      {isTranslateModalOpen && translatingCategory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Translate Category</h2>
              <button onClick={() => setTranslateModalOpen(false)} className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
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
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? "border-brand-red bg-brand-red text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {language.name} ({language.code})
                    {hasTranslation ? " *" : ""}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-600">
                Editing:{" "}
                {translationLanguages.find((l) => l.id === activeTranslationLanguageId)?.name ??
                  "Select language"}
              </p>
              <input value={translationName} onChange={(e) => setTranslationName(e.target.value)} placeholder="Translated name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <textarea value={translationDescription} onChange={(e) => setTranslationDescription(e.target.value)} placeholder="Translated description" className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <div className="flex justify-between">
                {translationLanguages.find((l) => l.id === activeTranslationLanguageId)?.code !== "en" ? (
                  <button
                    type="button"
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
                      setTranslationDescription("");
                    }}
                    className="cursor-pointer rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                  >
                    Remove This Translation
                  </button>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => {
                    if (!activeTranslationLanguageId || !translationName.trim()) {
                      toast.error("Select language tab and add translated name.");
                      return;
                    }
                    saveTranslationM.mutate();
                  }}
                  className="cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                >
                  Save / Update Translation
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
