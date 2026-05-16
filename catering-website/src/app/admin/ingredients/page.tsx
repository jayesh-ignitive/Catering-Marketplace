"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminSearchableSelect } from "@/components/admin/AdminSearchableSelect";
import { AdminTableSortArrows } from "@/components/admin/AdminTableSortArrows";
import { AdminModal, AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminIngredient,
  deleteAdminIngredient,
  deleteAdminIngredientTranslation,
  fetchAdminIngredientCategories,
  fetchAdminIngredients,
  fetchAdminLanguages,
  type AdminIngredientItem,
  type AdminIngredientUnit,
  type AdminLanguageItem,
  upsertAdminIngredientTranslation,
  updateAdminIngredient,
} from "@/lib/admin-api";
import { uploadCateringImage } from "@/lib/catering-api";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/hooks/useDebouncedValue";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

const UNIT_OPTIONS: { value: AdminIngredientUnit; label: string }[] = [
  { value: "KG", label: "KG" },
  { value: "GM", label: "GM" },
  { value: "LTR", label: "LTR" },
  { value: "ML", label: "ML" },
  { value: "PCS", label: "PCS" },
  { value: "BOX", label: "BOX" },
  { value: "PACKET", label: "PACKET" },
  { value: "BOTTLE", label: "BOTTLE" },
  { value: "TRAY", label: "TRAY" },
];

type IngForm = {
  ingredientCategoryId: string;
  ingredientCode: string;
  sku: string;
  slugManual: string;
  englishName: string;
  englishShortName: string;
  englishDescription: string;
  imageUrl: string;
  purchaseUnit: AdminIngredientUnit;
  consumptionUnit: AdminIngredientUnit;
  conversionFactor: number;
  shelfLifeDays: string;
  isActive: boolean;
};

const EMPTY_FORM: IngForm = {
  ingredientCategoryId: "",
  ingredientCode: "",
  sku: "",
  slugManual: "",
  englishName: "",
  englishShortName: "",
  englishDescription: "",
  imageUrl: "",
  purchaseUnit: "KG",
  consumptionUnit: "GM",
  conversionFactor: 1,
  shelfLifeDays: "",
  isActive: true,
};

function slugify(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}

type SortField = "code" | "name";
type SortDir = "asc" | "desc";

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

export default function AdminIngredientsPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translateIngredientId, setTranslateIngredientId] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  /** "" = all, "__uncategorized__" = no category */
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<SortField>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [form, setForm] = useState<IngForm>(EMPTY_FORM);
  const [activeTranslationLanguageId, setActiveTranslationLanguageId] = useState("");
  const [translationName, setTranslationName] = useState("");
  const [translationShortName, setTranslationShortName] = useState("");
  const [translationDescription, setTranslationDescription] = useState("");
  const [isDragOver, setDragOver] = useState(false);
  const [isUploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const debouncedQ = useDebouncedValue(draftQ, ADMIN_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const next = debouncedQ.trim();
    setAppliedQ((prev) => (prev === next ? prev : next));
  }, [debouncedQ]);

  const ingredientsQ = useQuery({
    queryKey: ["admin", "ingredients", token],
    queryFn: () => fetchAdminIngredients(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });
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

  const categoryOptions = useMemo(() => {
    const rows = categoriesQ.data ?? [];
    const opts: { value: string; label: string }[] = [{ value: "", label: "No category" }];
    for (const c of rows) {
      const en = c.translations.find((t) => t.languageCode === "en");
      opts.push({ value: c.id, label: en?.name ?? c.slug });
    }
    return opts;
  }, [categoriesQ.data]);

  const categoryFilterOptions = useMemo(() => {
    const rows = categoriesQ.data ?? [];
    const opts: { value: string; label: string }[] = [
      { value: "", label: "All categories" },
      { value: "__uncategorized__", label: "Uncategorized" },
    ];
    for (const c of rows) {
      const en = c.translations.find((t) => t.languageCode === "en");
      opts.push({ value: c.id, label: en?.name ?? c.slug });
    }
    return opts;
  }, [categoriesQ.data]);

  const unitSelectOptions = UNIT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  const flushSearchNow = useCallback(() => {
    setAppliedQ(draftQ.trim());
    setPage(1);
  }, [draftQ]);

  const filteredRows = useMemo(() => {
    const q = appliedQ.trim().toLowerCase();
    const rows = ingredientsQ.data ?? [];
    let base = rows;
    if (categoryFilter === "__uncategorized__") {
      base = base.filter((row) => row.ingredientCategoryId == null);
    } else if (categoryFilter) {
      base = base.filter((row) => row.ingredientCategoryId === categoryFilter);
    }
    if (q) {
      base = base.filter((row) => {
        const names = row.translations.map((t) => t.name).join(" ");
        const hay = [
          row.ingredientCode,
          row.slug,
          row.sku ?? "",
          row.ingredientCategorySlug ?? "",
          names,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return [...base].sort((a, b) => {
      const cmp =
        sortBy === "code"
          ? a.ingredientCode.localeCompare(b.ingredientCode)
          : (a.translations.find((t) => t.languageCode === "en")?.name ?? "").localeCompare(
              b.translations.find((t) => t.languageCode === "en")?.name ?? "",
            );
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [appliedQ, categoryFilter, ingredientsQ.data, sortBy, sortDir]);

  const filteredTotal = filteredRows.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredTotal / limit)), [filteredTotal, limit]);
  const pageButtons = useMemo(() => visiblePageNumbers(page, totalPages), [page, totalPages]);
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRows.slice(start, start + limit);
  }, [filteredRows, page, limit]);

  const showingFrom = filteredTotal === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, filteredTotal);

  useEffect(() => {
    setPage(1);
  }, [appliedQ, categoryFilter, sortBy, sortDir]);

  useEffect(() => {
    setPage((p) => {
      const maxPage = Math.max(1, Math.ceil(filteredTotal / limit) || 1);
      return p > maxPage ? maxPage : p;
    });
  }, [filteredTotal, limit]);

  function toggleSort(field: SortField) {
    setPage(1);
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortDir("asc");
  }

  function closeModal() {
    setModalOpen(false);
    setDragOver(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
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

  const saveM = useMutation({
    mutationFn: async (): Promise<{ mode: "create" | "edit" }> => {
      if (!form.englishName.trim()) throw new Error("English name is required.");
      const enLang = languagesQ.data?.find((l) => l.code === "en");
      if (!enLang) throw new Error("English language missing.");

      const shelfNum =
        form.shelfLifeDays.trim() === "" ? undefined : Number(form.shelfLifeDays);
      if (form.shelfLifeDays.trim() !== "" && Number.isNaN(shelfNum)) {
        throw new Error("Shelf life must be a number.");
      }

      const catId = form.ingredientCategoryId.trim()
        ? Number(form.ingredientCategoryId)
        : undefined;
      if (form.ingredientCategoryId.trim() && Number.isNaN(catId)) {
        throw new Error("Invalid category.");
      }

      if (editingId) {
        await updateAdminIngredient(token!, editingId, {
          ingredientCategoryId: form.ingredientCategoryId.trim() ? catId! : null,
          ingredientCode: form.ingredientCode.trim().toUpperCase() || undefined,
          sku: form.sku.trim() || null,
          slug: form.slugManual.trim().toLowerCase() || undefined,
          image: form.imageUrl.trim() || null,
          purchaseUnit: form.purchaseUnit,
          consumptionUnit: form.consumptionUnit,
          conversionFactor: form.conversionFactor,
          shelfLifeDays: shelfNum ?? null,
          isActive: form.isActive,
        });
        const langNum = Number(enLang.id);
        if (Number.isNaN(langNum)) throw new Error("Invalid language id.");
        await upsertAdminIngredientTranslation(token!, editingId, {
          languageId: langNum,
          name: form.englishName.trim(),
          shortName: form.englishShortName.trim() || undefined,
          description: form.englishDescription.trim() || undefined,
        });
        return { mode: "edit" };
      }

      await createAdminIngredient(token!, {
        ingredientCategoryId: catId,
        ingredientCode: form.ingredientCode.trim().toUpperCase() || undefined,
        sku: form.sku.trim() || undefined,
        slug: form.slugManual.trim().toLowerCase() || undefined,
        image: form.imageUrl.trim() || undefined,
        purchaseUnit: form.purchaseUnit,
        consumptionUnit: form.consumptionUnit,
        conversionFactor: form.conversionFactor,
        shelfLifeDays: shelfNum ?? null,
        isActive: form.isActive,
        englishName: form.englishName.trim(),
        englishShortName: form.englishShortName.trim() || undefined,
        englishDescription: form.englishDescription.trim() || undefined,
      });
      return { mode: "create" };
    },
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["admin", "ingredients"] });
      closeModal();
      toast.success(r.mode === "edit" ? "Ingredient updated." : "Ingredient created.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save."),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteAdminIngredient(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "ingredients"] });
      toast.success("Ingredient removed (soft-deleted).");
    },
    onError: () => toast.error("Could not delete."),
  });

  const saveTranslationM = useMutation({
    mutationFn: async () => {
      const langNum = Number(activeTranslationLanguageId);
      if (Number.isNaN(langNum)) throw new Error("Invalid language");
      return upsertAdminIngredientTranslation(token!, translateIngredientId!, {
        languageId: langNum,
        name: translationName.trim(),
        shortName: translationShortName.trim() || undefined,
        description: translationDescription.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "ingredients"] });
      toast.success("Translation saved.");
    },
    onError: () => toast.error("Could not save translation."),
  });

  const deleteTranslationM = useMutation({
    mutationFn: ({
      ingredientId,
      languageId,
    }: {
      ingredientId: string;
      languageId: string;
    }) => deleteAdminIngredientTranslation(token!, ingredientId, languageId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "ingredients"] });
      toast.success("Translation removed.");
    },
    onError: () => toast.error("Could not remove translation."),
  });

  const translatingRow = useMemo(
    () => ingredientsQ.data?.find((x) => x.id === translateIngredientId) ?? null,
    [ingredientsQ.data, translateIngredientId],
  );

  const translationLanguages = useMemo(
    () => (languagesQ.data ?? []).filter((l) => l.isActive),
    [languagesQ.data],
  );

  function openTranslateModal(row: AdminIngredientItem) {
    const languages = (languagesQ.data ?? []).filter((l) => l.isActive);
    const first = languages.find((l) => l.code === "en") ?? languages[0];
    const existing = row.translations.find((t) => t.languageId === first?.id);
    setTranslateIngredientId(row.id);
    setActiveTranslationLanguageId(first?.id ?? "");
    setTranslationName(existing?.name ?? "");
    setTranslationShortName(existing?.shortName ?? "");
    setTranslationDescription(existing?.description ?? "");
    setTranslateOpen(true);
  }

  function onTranslationTabChange(language: AdminLanguageItem) {
    const existing = translatingRow?.translations.find((t) => t.languageId === language.id);
    setActiveTranslationLanguageId(language.id);
    setTranslationName(existing?.name ?? "");
    setTranslationShortName(existing?.shortName ?? "");
    setTranslationDescription(existing?.description ?? "");
  }

  if (ingredientsQ.isPending || languagesQ.isPending || categoriesQ.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-brand-text-muted">
        Loading ingredients…
      </div>
    );
  }
  if (
    ingredientsQ.isError ||
    languagesQ.isError ||
    categoriesQ.isError ||
    !ingredientsQ.data ||
    !languagesQ.data ||
    !categoriesQ.data
  ) {
    return (
      <div className="admin-panel-card border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        Could not load ingredients.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1400px]">
      <AdminBreadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Ingredients" }]} />

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

          <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:flex-1 lg:max-w-5xl">
            <div className="relative min-w-0 flex-[2]">
              <MagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted"
                size={20}
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search code, slug, SKU, category, names…"
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
            <div className="min-w-[200px] shrink-0 lg:max-w-[280px] lg:flex-1">
              <AdminSearchableSelect
                instanceId="admin-ingredients-category-filter"
                ariaLabel="Filter by category"
                placeholder="Category…"
                options={categoryFilterOptions}
                value={categoryFilter}
                onChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
                menuPortal
                className="w-full"
              />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              {appliedQ || categoryFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraftQ("");
                    setAppliedQ("");
                    setCategoryFilter("");
                    setPage(1);
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-brand-text-dark transition hover:bg-brand-page"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                  setDragOver(false);
                  setModalOpen(true);
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5"
              >
                <Plus size={16} weight="bold" />
                Add ingredient
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className="admin-datatable-thead sticky top-0 z-[1]">
              <tr>
                <th className="admin-datatable-th w-14">Img</th>
                <th className="admin-datatable-th">
                  <button
                    type="button"
                    onClick={() => toggleSort("code")}
                    className="inline-flex cursor-pointer items-center gap-1 hover:bg-brand-page"
                  >
                    Code
                    <AdminTableSortArrows active={sortBy === "code"} sortDir={sortDir} size={13} />
                  </button>
                </th>
                <th className="admin-datatable-th min-w-[200px]">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex cursor-pointer items-center gap-1 hover:bg-brand-page"
                  >
                    Names
                    <AdminTableSortArrows active={sortBy === "name"} sortDir={sortDir} size={13} />
                  </button>
                </th>
                <th className="admin-datatable-th">Category</th>
                <th className="admin-datatable-th">Units</th>
                <th className="admin-datatable-th tabular-nums">Conv.</th>
                <th className="admin-datatable-th">Active</th>
                <th className="admin-datatable-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-datatable-cell py-20 text-center">
                    <p className="text-base font-semibold text-brand-text-dark">No ingredients match</p>
                    <p className="mt-1 text-sm text-brand-text-muted">
                      Try another search, category filter, or add one.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const en = row.translations.find((t) => t.languageCode === "en");
                  const otherTranslations = row.translations.filter((t) => t.languageCode !== "en");
                  return (
                    <tr key={row.id}>
                      <td className="admin-datatable-cell">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-red-light">
                          {row.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.image} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-brand-red">—</span>
                          )}
                        </div>
                      </td>
                      <td className="admin-datatable-cell font-mono text-xs font-semibold">{row.ingredientCode}</td>
                      <td className="admin-datatable-cell max-w-[min(360px,40vw)]">
                        <div className="space-y-1.5">
                          <p className="font-semibold leading-snug text-brand-text-dark">{en?.name ?? "—"}</p>
                          {otherTranslations.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {otherTranslations.map((t) => (
                                <span
                                  key={t.languageId}
                                  title={`${t.languageName}: ${t.name}`}
                                  className="inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/90 px-2 py-0.5 text-[11px] font-medium text-brand-text-muted"
                                >
                                  <span className="shrink-0 font-mono font-bold uppercase tracking-wide text-brand-text-dark">
                                    {t.languageCode}
                                  </span>
                                  <span className="min-w-0 truncate">{t.name}</span>
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="admin-datatable-cell text-sm text-brand-text-muted">
                        {row.ingredientCategorySlug ?? "—"}
                      </td>
                      <td className="admin-datatable-cell text-xs font-medium text-brand-text-muted">
                        {row.purchaseUnit} → {row.consumptionUnit}
                      </td>
                      <td className="admin-datatable-cell tabular-nums text-sm">{row.conversionFactor}</td>
                      <td className="admin-datatable-cell text-sm">{row.isActive ? "Yes" : "No"}</td>
                      <td className="admin-datatable-cell text-right">
                        <div className="inline-flex justify-end gap-2">
                          <button
                            type="button"
                            title="Translate"
                            onClick={() => openTranslateModal(row)}
                            className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-brand-text-dark shadow-sm transition hover:bg-brand-dark hover:text-white"
                          >
                            <Translate size={18} aria-hidden />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => {
                              const enTr = row.translations.find((t) => t.languageCode === "en");
                              setEditingId(row.id);
                              setForm({
                                ingredientCategoryId: row.ingredientCategoryId ?? "",
                                ingredientCode: row.ingredientCode,
                                sku: row.sku ?? "",
                                slugManual: row.slug,
                                englishName: enTr?.name ?? "",
                                englishShortName: enTr?.shortName ?? "",
                                englishDescription: enTr?.description ?? "",
                                imageUrl: row.image ?? "",
                                purchaseUnit: row.purchaseUnit,
                                consumptionUnit: row.consumptionUnit,
                                conversionFactor: row.conversionFactor,
                                shelfLifeDays:
                                  row.shelfLifeDays != null ? String(row.shelfLifeDays) : "",
                                isActive: row.isActive,
                              });
                              setDragOver(false);
                              setModalOpen(true);
                            }}
                            className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
                          >
                            <PencilSimple size={18} aria-hidden />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              if (!confirm(`Remove ingredient ${row.ingredientCode}?`)) return;
                              deleteM.mutate(row.id);
                            }}
                            className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 shadow-sm transition hover:bg-rose-600 hover:text-white"
                          >
                            <Trash size={18} aria-hidden />
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
          <p className="text-sm font-semibold text-brand-text-muted">
            Showing <span className="tabular-nums text-brand-text-dark">{showingFrom}</span>–
            <span className="tabular-nums text-brand-text-dark">{showingTo}</span> of{" "}
            <span className="tabular-nums text-brand-text-dark">{filteredTotal}</span>
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
        open={modalOpen}
        title={editingId ? "Edit ingredient" : "Add ingredient"}
        description={
          editingId
            ? "Update codes, units, category link, and English translation fields."
            : `Slug preview (auto if empty): ${slugify(form.englishName) || "—"}`
        }
        size="lg"
        onClose={() => {
          if (saveM.isPending) return;
          closeModal();
        }}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (saveM.isPending) return;
                closeModal();
              }}
              disabled={saveM.isPending}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-brand-text-dark transition hover:bg-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveM.mutate()}
              disabled={saveM.isPending}
              className="rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saveM.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <AdminModalField label="Ingredient category">
            <AdminSearchableSelect
              instanceId="admin-ingredient-category"
              ariaLabel="Ingredient category"
              placeholder="Search category…"
              options={categoryOptions}
              value={form.ingredientCategoryId}
              onChange={(v) => setForm((s) => ({ ...s, ingredientCategoryId: v }))}
              menuPortal
              className="w-full"
            />
          </AdminModalField>

          <AdminModalField label="English name (required)">
            <input
              value={form.englishName}
              onChange={(e) => setForm((s) => ({ ...s, englishName: e.target.value }))}
              placeholder="e.g. Basmati rice"
              className="admin-field-quiet w-full px-3 py-3"
              autoComplete="off"
            />
          </AdminModalField>

          <div className="grid gap-5 sm:grid-cols-2">
            <AdminModalField label="Ingredient code (optional override)">
              <input
                value={form.ingredientCode}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    ingredientCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
                  }))
                }
                placeholder="Auto from name if empty"
                className="admin-field-quiet w-full px-3 py-3 font-mono text-sm"
              />
            </AdminModalField>
            <AdminModalField label="SKU">
              <input
                value={form.sku}
                onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
                className="admin-field-quiet w-full px-3 py-3"
              />
            </AdminModalField>
          </div>

          <AdminModalField label={editingId ? "Slug" : "Slug override (optional)"}>
            <input
              value={form.slugManual}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  slugManual: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                }))
              }
              placeholder={editingId ? "" : slugify(form.englishName) || "auto"}
              className="admin-field-quiet w-full px-3 py-3 font-mono text-sm"
            />
          </AdminModalField>

          <AdminModalField label="English short name">
            <input
              value={form.englishShortName}
              onChange={(e) => setForm((s) => ({ ...s, englishShortName: e.target.value }))}
              className="admin-field-quiet w-full px-3 py-3"
              maxLength={100}
            />
          </AdminModalField>

          <AdminModalField label="English description">
            <textarea
              value={form.englishDescription}
              onChange={(e) => setForm((s) => ({ ...s, englishDescription: e.target.value }))}
              rows={3}
              className="admin-field-quiet w-full resize-y px-3 py-3"
            />
          </AdminModalField>

          <div className="grid gap-5 sm:grid-cols-2">
            <AdminModalField label="Purchase unit">
              <AdminSearchableSelect
                instanceId="admin-ingredient-purchase-unit"
                ariaLabel="Purchase unit"
                options={unitSelectOptions}
                value={form.purchaseUnit}
                onChange={(v) => setForm((s) => ({ ...s, purchaseUnit: v as AdminIngredientUnit }))}
                menuPortal
                className="w-full"
              />
            </AdminModalField>
            <AdminModalField label="Consumption unit">
              <AdminSearchableSelect
                instanceId="admin-ingredient-consumption-unit"
                ariaLabel="Consumption unit"
                options={unitSelectOptions}
                value={form.consumptionUnit}
                onChange={(v) => setForm((s) => ({ ...s, consumptionUnit: v as AdminIngredientUnit }))}
                menuPortal
                className="w-full"
              />
            </AdminModalField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <AdminModalField label="Conversion factor">
              <input
                type="number"
                step="0.0001"
                min={0.0001}
                value={form.conversionFactor}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    conversionFactor: Number(e.target.value) || 1,
                  }))
                }
                className="admin-field-quiet w-full px-3 py-3 tabular-nums"
              />
            </AdminModalField>
            <AdminModalField label="Shelf life (days)">
              <input
                type="text"
                inputMode="numeric"
                value={form.shelfLifeDays}
                onChange={(e) => setForm((s) => ({ ...s, shelfLifeDays: e.target.value }))}
                placeholder="Optional"
                className="admin-field-quiet w-full px-3 py-3 tabular-nums"
              />
            </AdminModalField>
          </div>

          <AdminModalField label="Image">
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
              <p className="font-semibold text-brand-text-dark">Drag & drop or click</p>
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt=""
                  className="mx-auto mt-4 h-24 max-w-full rounded-2xl object-cover shadow-md ring-1 ring-gray-100"
                />
              ) : null}
            </div>
          </AdminModalField>

          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-brand-text-dark">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
              className="size-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
            />
            Active
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={translateOpen && Boolean(translatingRow)}
        title="Translate ingredient"
        description={
          translatingRow
            ? `${translatingRow.ingredientCode} · ${translatingRow.slug}`
            : undefined
        }
        onClose={() => {
          if (saveTranslationM.isPending || deleteTranslationM.isPending) return;
          setTranslateOpen(false);
        }}
        footer={
          translatingRow ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-[40px]">
                {translationLanguages.find((l) => l.id === activeTranslationLanguageId)?.code !== "en" ? (
                  <button
                    type="button"
                    disabled={deleteTranslationM.isPending || saveTranslationM.isPending}
                    onClick={() => {
                      const exists = translatingRow.translations.find(
                        (t) => t.languageId === activeTranslationLanguageId,
                      );
                      if (!exists) {
                        toast.error("No translation to remove.");
                        return;
                      }
                      deleteTranslationM.mutate({
                        ingredientId: translatingRow.id,
                        languageId: activeTranslationLanguageId,
                      });
                      setTranslationName("");
                      setTranslationShortName("");
                      setTranslationDescription("");
                    }}
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    {deleteTranslationM.isPending ? "Removing…" : "Remove translation"}
                  </button>
                ) : (
                  <p className="max-w-xs text-xs leading-snug text-brand-text-muted">
                    English is edited in <span className="font-semibold text-brand-text-dark">Add / Edit ingredient</span>.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={saveTranslationM.isPending || deleteTranslationM.isPending}
                onClick={() => {
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
        {translatingRow ? (
          <div className="space-y-5">
            <AdminModalField label="Language">
              <div className="flex flex-wrap gap-2">
                {translationLanguages.map((language) => {
                  const hasTranslation = translatingRow.translations.some((t) => t.languageId === language.id);
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
                className="admin-field-quiet w-full px-3 py-3"
              />
            </AdminModalField>
            <AdminModalField label="Short name">
              <input
                value={translationShortName}
                onChange={(e) => setTranslationShortName(e.target.value)}
                maxLength={100}
                className="admin-field-quiet w-full px-3 py-3"
              />
            </AdminModalField>
            <AdminModalField label="Description">
              <textarea
                value={translationDescription}
                onChange={(e) => setTranslationDescription(e.target.value)}
                rows={3}
                className="admin-field-quiet w-full resize-y px-3 py-3"
              />
            </AdminModalField>
          </div>
        ) : null}
      </AdminModal>
    </section>
  );
}
