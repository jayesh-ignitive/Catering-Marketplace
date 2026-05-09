"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminSearchableSelect } from "@/components/admin/AdminSearchableSelect";
import { AdminTableSortArrows } from "@/components/admin/AdminTableSortArrows";
import { AdminModal, AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminAttribute,
  deleteAdminAttribute,
  deleteAdminAttributeTranslation,
  fetchAdminAttributes,
  fetchAdminLanguages,
  type AdminAttributeItem,
  type AdminAttributeType,
  type AdminLanguageItem,
  upsertAdminAttributeTranslation,
  updateAdminAttribute,
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

const ATTRIBUTE_TYPE_OPTIONS: { value: AdminAttributeType; label: string }[] = [
  { value: "audience", label: "Audience" },
  { value: "beverage_type", label: "Beverage type" },
  { value: "counter_type", label: "Counter type" },
  { value: "course", label: "Course" },
  { value: "cuisine", label: "Cuisine" },
  { value: "dietary", label: "Dietary" },
  { value: "event", label: "Event" },
  { value: "food_category", label: "Food category" },
  { value: "meal_time", label: "Meal time" },
  { value: "package_type", label: "Package type" },
  { value: "portion", label: "Portion" },
  { value: "preparation", label: "Preparation" },
  { value: "recommendation", label: "Recommendation" },
  { value: "season", label: "Season" },
  { value: "service", label: "Service" },
  { value: "spice", label: "Spice" },
  { value: "temperature", label: "Temperature" },
];

const ATTRIBUTE_TYPE_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  ...ATTRIBUTE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
];

const ATTRIBUTE_TYPE_FORM_OPTIONS = ATTRIBUTE_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

function typeLabel(t: AdminAttributeType): string {
  return ATTRIBUTE_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
}

type AttrForm = {
  type: AdminAttributeType;
  englishName: string;
  imageUrl: string;
  isSearchable: boolean;
  isActive: boolean;
};

const EMPTY_FORM: AttrForm = {
  type: "cuisine",
  englishName: "",
  imageUrl: "",
  isSearchable: true,
  isActive: true,
};

type SortField = "type" | "name";
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

export default function AdminAttributesPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translateAttrId, setTranslateAttrId] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  /** Empty string = all attribute types */
  const [filterType, setFilterType] = useState<"" | AdminAttributeType>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<SortField>("type");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [form, setForm] = useState<AttrForm>(EMPTY_FORM);
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

  const attributesQ = useQuery({
    queryKey: ["admin", "attributes", token],
    queryFn: () => fetchAdminAttributes(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });
  const languagesQ = useQuery({
    queryKey: ["admin", "languages", token],
    queryFn: () => fetchAdminLanguages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const flushSearchNow = useCallback(() => {
    setAppliedQ(draftQ.trim());
    setPage(1);
  }, [draftQ]);

  const filteredRows = useMemo(() => {
    const q = appliedQ.trim().toLowerCase();
    const rows = attributesQ.data ?? [];
    let base = filterType ? rows.filter((row) => row.type === filterType) : rows;
    if (q) {
      base = base.filter((row) => {
        const names = row.translations.map((t) => t.name).join(" ");
        const hay = [row.type, names, row.image ?? ""].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    return [...base].sort((a, b) => {
      const aName = (a.translations.find((t) => t.languageCode === "en")?.name ?? "").toLowerCase();
      const bName = (b.translations.find((t) => t.languageCode === "en")?.name ?? "").toLowerCase();
      const cmp = sortBy === "type" ? a.type.localeCompare(b.type) : aName.localeCompare(bName);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [appliedQ, filterType, attributesQ.data, sortBy, sortDir]);

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
  }, [appliedQ, filterType, sortBy, sortDir]);

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

  function closeAttrModal() {
    setAttrModalOpen(false);
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

  const saveAttrM = useMutation({
    mutationFn: async () => {
      if (!form.englishName.trim()) throw new Error("English name is required.");
      const enLang = languagesQ.data?.find((l) => l.code === "en");
      if (!enLang) throw new Error("English language missing.");

      if (editingId) {
        await updateAdminAttribute(token!, editingId, {
          type: form.type,
          image: form.imageUrl.trim() || null,
          isSearchable: form.isSearchable,
          isActive: form.isActive,
        });
        const langNum = Number(enLang.id);
        if (Number.isNaN(langNum)) throw new Error("Invalid language id.");
        await upsertAdminAttributeTranslation(token!, editingId, {
          languageId: langNum,
          name: form.englishName.trim(),
        });
        return { mode: "edit" as const };
      }
      await createAdminAttribute(token!, {
        type: form.type,
        englishName: form.englishName.trim(),
        image: form.imageUrl.trim() || undefined,
        isSearchable: form.isSearchable,
        isActive: form.isActive,
      });
      return { mode: "create" as const };
    },
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["admin", "attributes"] });
      closeAttrModal();
      toast.success(r.mode === "edit" ? "Attribute updated." : "Attribute created.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save attribute."),
  });

  const deleteAttrM = useMutation({
    mutationFn: (id: string) => deleteAdminAttribute(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "attributes"] });
      toast.success("Attribute removed.");
    },
    onError: () => toast.error("Could not delete attribute."),
  });

  const saveTranslationM = useMutation({
    mutationFn: async () => {
      const langNum = Number(activeTranslationLanguageId);
      if (Number.isNaN(langNum)) throw new Error("Invalid language");
      return upsertAdminAttributeTranslation(token!, translateAttrId!, {
        languageId: langNum,
        name: translationName.trim(),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "attributes"] });
      toast.success("Translation saved.");
    },
    onError: () => toast.error("Could not save translation."),
  });

  const deleteTranslationM = useMutation({
    mutationFn: ({ attributeId, languageId }: { attributeId: string; languageId: string }) =>
      deleteAdminAttributeTranslation(token!, attributeId, languageId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "attributes"] });
      toast.success("Translation removed.");
    },
    onError: () => toast.error("Could not remove translation."),
  });

  const translatingAttr = useMemo(
    () => attributesQ.data?.find((x) => x.id === translateAttrId) ?? null,
    [attributesQ.data, translateAttrId],
  );

  const translationLanguages = useMemo(
    () => (languagesQ.data ?? []).filter((l) => l.isActive),
    [languagesQ.data],
  );

  function openTranslateModal(row: AdminAttributeItem) {
    const languages = (languagesQ.data ?? []).filter((l) => l.isActive);
    const first = languages.find((l) => l.code === "en") ?? languages[0];
    const existing = row.translations.find((t) => t.languageId === first?.id);
    setTranslateAttrId(row.id);
    setActiveTranslationLanguageId(first?.id ?? "");
    setTranslationName(existing?.name ?? "");
    setTranslateOpen(true);
  }

  function onTranslationTabChange(language: AdminLanguageItem) {
    const existing = translatingAttr?.translations.find((t) => t.languageId === language.id);
    setActiveTranslationLanguageId(language.id);
    setTranslationName(existing?.name ?? "");
  }

  if (attributesQ.isPending || languagesQ.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-brand-text-muted">
        Loading attributes…
      </div>
    );
  }
  if (attributesQ.isError || languagesQ.isError || !attributesQ.data || !languagesQ.data) {
    return (
      <div className="admin-panel-card border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        Could not load attributes.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1400px]">
      <AdminBreadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Attributes" }]} />

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

          <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:flex-1 lg:max-w-5xl xl:max-w-6xl">
            <label className="flex shrink-0 flex-wrap items-center gap-2 text-sm text-brand-text-muted">
              <span className="whitespace-nowrap font-semibold">Type</span>
              <AdminSearchableSelect
                instanceId="admin-attributes-type-filter"
                ariaLabel="Filter by attribute type"
                options={ATTRIBUTE_TYPE_FILTER_OPTIONS}
                value={filterType}
                onChange={(v) => {
                  setFilterType(v as "" | AdminAttributeType);
                  setPage(1);
                }}
                className="min-w-[11rem]"
              />
            </label>
            <div className="relative min-w-0 flex-1">
              <MagnifyingGlass
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted"
                size={20}
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search names, type, or image URL…"
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
              {appliedQ || filterType ? (
                <button
                  type="button"
                  onClick={() => {
                    setDraftQ("");
                    setAppliedQ("");
                    setFilterType("");
                    setPage(1);
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-brand-text-dark transition hover:bg-brand-page"
                >
                  Clear filters
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                  setDragOver(false);
                  setAttrModalOpen(true);
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5"
              >
                <Plus size={16} weight="bold" />
                Add attribute
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="admin-datatable-thead sticky top-0 z-[1]">
              <tr>
                <th className="admin-datatable-th w-24">Image</th>
                <th className="admin-datatable-th">
                  <button
                    type="button"
                    onClick={() => toggleSort("type")}
                    className="inline-flex cursor-pointer items-center gap-1 hover:bg-brand-page"
                  >
                    Type
                    <AdminTableSortArrows active={sortBy === "type"} sortDir={sortDir} size={13} />
                  </button>
                </th>
                <th className="admin-datatable-th">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex cursor-pointer items-center gap-1 hover:bg-brand-page"
                  >
                    English name
                    <AdminTableSortArrows active={sortBy === "name"} sortDir={sortDir} size={13} />
                  </button>
                </th>
                <th className="admin-datatable-th">Searchable</th>
                <th className="admin-datatable-th">Active</th>
                <th className="admin-datatable-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-datatable-cell py-20 text-center">
                    <p className="text-base font-semibold text-brand-text-dark">No attributes match</p>
                    <p className="mt-1 text-sm text-brand-text-muted">Try another search or add a new attribute.</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const en = row.translations.find((t) => t.languageCode === "en");
                  return (
                    <tr key={row.id}>
                      <td className="admin-datatable-cell">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-red-light">
                          {row.image ? (
                            // eslint-disable-next-line @next/next/no-img-element -- external / uploaded URLs
                            <img src={row.image} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-brand-red">—</span>
                          )}
                        </div>
                      </td>
                      <td className="admin-datatable-cell">
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
                          {typeLabel(row.type)}
                        </span>
                      </td>
                      <td className="admin-datatable-cell font-semibold text-brand-text-dark">{en?.name ?? "—"}</td>
                      <td className="admin-datatable-cell text-sm">{row.isSearchable ? "Yes" : "No"}</td>
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
                              setEditingId(row.id);
                              setForm({
                                type: row.type,
                                englishName: en?.name ?? "",
                                imageUrl: row.image ?? "",
                                isSearchable: row.isSearchable,
                                isActive: row.isActive,
                              });
                              setDragOver(false);
                              setAttrModalOpen(true);
                            }}
                            className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
                          >
                            <PencilSimple size={18} aria-hidden />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              if (!confirm("Remove this attribute? It will be hidden (soft-deleted).")) return;
                              deleteAttrM.mutate(row.id);
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
        open={attrModalOpen}
        title={editingId ? "Edit attribute" : "Add attribute"}
        description="English name is stored as the default translation. Upload an optional banner image (URL max 500 chars)."
        size="lg"
        onClose={() => {
          if (saveAttrM.isPending) return;
          closeAttrModal();
        }}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (saveAttrM.isPending) return;
                closeAttrModal();
              }}
              disabled={saveAttrM.isPending}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-brand-text-dark transition hover:bg-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveAttrM.mutate()}
              disabled={saveAttrM.isPending}
              className="rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saveAttrM.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <AdminModalField label="Type">
            <AdminSearchableSelect
              instanceId="admin-attributes-type-modal"
              ariaLabel="Attribute type"
              options={ATTRIBUTE_TYPE_FORM_OPTIONS}
              value={form.type}
              onChange={(v) =>
                setForm((s) => ({ ...s, type: v as AdminAttributeType }))
              }
              menuPortal
              className="w-full"
            />
          </AdminModalField>

          <AdminModalField label="English name (required)">
            <input
              value={form.englishName}
              onChange={(e) => setForm((s) => ({ ...s, englishName: e.target.value }))}
              placeholder="e.g. Vegan"
              className="admin-field-quiet w-full px-3 py-3"
              autoComplete="off"
            />
          </AdminModalField>

          <AdminModalField label="Banner image">
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
                  className="mx-auto mt-4 h-28 max-w-full rounded-2xl object-cover shadow-md ring-1 ring-gray-100"
                />
              ) : null}
            </div>
          </AdminModalField>

          <div className="flex flex-wrap gap-6 rounded-xl border border-gray-100 bg-brand-page/80 px-4 py-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-brand-text-dark">
              <input
                type="checkbox"
                checked={form.isSearchable}
                onChange={(e) => setForm((s) => ({ ...s, isSearchable: e.target.checked }))}
                className="size-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
              />
              Searchable filter
            </label>
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
        </div>
      </AdminModal>

      <AdminModal
        open={translateOpen && Boolean(translatingAttr)}
        title="Translate attribute"
        description={
          translatingAttr
            ? `${typeLabel(translatingAttr.type)} · ${translatingAttr.translations.find((t) => t.languageCode === "en")?.name ?? ""}`
            : undefined
        }
        onClose={() => {
          if (saveTranslationM.isPending || deleteTranslationM.isPending) return;
          setTranslateOpen(false);
        }}
        footer={
          translatingAttr ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-[40px]">
                {translationLanguages.find((l) => l.id === activeTranslationLanguageId)?.code !== "en" ? (
                  <button
                    type="button"
                    disabled={deleteTranslationM.isPending || saveTranslationM.isPending}
                    onClick={() => {
                      const exists = translatingAttr.translations.find(
                        (t) => t.languageId === activeTranslationLanguageId,
                      );
                      if (!exists) {
                        toast.error("No translation to remove for this language.");
                        return;
                      }
                      deleteTranslationM.mutate({
                        attributeId: translatingAttr.id,
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
                    English is edited in <span className="font-semibold text-brand-text-dark">Add / Edit attribute</span>.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={saveTranslationM.isPending || deleteTranslationM.isPending}
                onClick={() => {
                  if (!activeTranslationLanguageId) {
                    toast.error("Select a language.");
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
        {translatingAttr ? (
          <div className="space-y-5">
            <AdminModalField label="Language">
              <div className="flex flex-wrap gap-2">
                {translationLanguages.map((language) => {
                  const hasTranslation = translatingAttr.translations.some((t) => t.languageId === language.id);
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
                placeholder="Localized label"
                className="admin-field-quiet w-full px-3 py-3"
              />
            </AdminModalField>
          </div>
        ) : null}
      </AdminModal>
    </section>
  );
}
