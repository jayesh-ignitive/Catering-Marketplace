"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminSearchableSelect } from "@/components/admin/AdminSearchableSelect";
import { AdminTableSortArrows } from "@/components/admin/AdminTableSortArrows";
import { AdminModal, AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  deleteAdminMenuItem,
  deleteAdminMenuItemTranslation,
  fetchAdminAttributes,
  fetchAdminLanguages,
  fetchAdminMenuCategories,
  fetchAdminMenuItems,
  type AdminAttributeItem,
  type AdminLanguageItem,
  type AdminMenuCategoryItem,
  type AdminMenuItemItem,
  upsertAdminMenuItemTranslation,
} from "@/lib/admin-api";
import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CaretLeft,
  CaretRight,
  Faders,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Translate,
  Trash,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  MENU_ITEM_RELEVANT_TYPES,
  menuItemAttributeTypeTitle,
} from "./attribute-types";

function categoryEnName(c: AdminMenuCategoryItem): string {
  const en = c.translations.find((t) => t.languageCode === "en");
  return en?.name ?? c.slug;
}

function attributeChoiceLabel(a: AdminAttributeItem): string {
  const en = a.translations.find((t) => t.languageCode === "en");
  return en?.name ?? a.type;
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

/** One choice per type (dropdown); across types all chosen filters must match. */
function rowMatchesAttributeFilters(
  row: AdminMenuItemItem,
  filterByType: Record<string, string>,
): boolean {
  for (const [type, id] of Object.entries(filterByType)) {
    if (!id) continue;
    const rowHas = row.attributes.some(
      (a) => a.attributeId === id && a.attributeType === type,
    );
    if (!rowHas) return false;
  }
  return true;
}

export default function AdminMenuItemsPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translateMenuItemId, setTranslateMenuItemId] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "yes" | "no">("");
  const [attributeFilterByType, setAttributeFilterByType] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<SortField>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeTranslationLanguageId, setActiveTranslationLanguageId] = useState("");
  const [translationName, setTranslationName] = useState("");
  const [translationDescription, setTranslationDescription] = useState("");

  const debouncedQ = useDebouncedValue(draftQ, ADMIN_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const next = debouncedQ.trim();
    setAppliedQ((prev) => (prev === next ? prev : next));
  }, [debouncedQ]);

  const menuItemsQ = useQuery({
    queryKey: ["admin", "menu-items", token],
    queryFn: () => fetchAdminMenuItems(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });
  const menuCategoriesQ = useQuery({
    queryKey: ["admin", "menu-categories", token],
    queryFn: () => fetchAdminMenuCategories(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });
  const languagesQ = useQuery({
    queryKey: ["admin", "languages", token],
    queryFn: () => fetchAdminLanguages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });
  const attributesQ = useQuery({
    queryKey: ["admin", "attributes", token],
    queryFn: () => fetchAdminAttributes(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const attrsByType = useMemo(() => {
    const g = new Map<string, AdminAttributeItem[]>();
    for (const a of attributesQ.data ?? []) {
      if (!a.isActive) continue;
      const arr = g.get(a.type) ?? [];
      arr.push(a);
      g.set(a.type, arr);
    }
    for (const [, arr] of g) {
      arr.sort((x, y) => attributeChoiceLabel(x).localeCompare(attributeChoiceLabel(y)));
    }
    return g;
  }, [attributesQ.data]);

  const filterSectionTypes = useMemo(() => {
    return MENU_ITEM_RELEVANT_TYPES.filter((t) => (attrsByType.get(t)?.length ?? 0) > 0);
  }, [attrsByType]);

  const categoryFilterOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "", label: "All categories" }];
    for (const c of menuCategoriesQ.data ?? []) {
      opts.push({
        value: c.id,
        label: c.parentId ? `↳ ${categoryEnName(c)}` : categoryEnName(c),
      });
    }
    return opts;
  }, [menuCategoriesQ.data]);

  const flushSearchNow = useCallback(() => {
    setAppliedQ(draftQ.trim());
    setPage(1);
  }, [draftQ]);

  const setAttributeFilterForType = useCallback((type: string, attributeId: string) => {
    setAttributeFilterByType((prev) => {
      const next = { ...prev };
      if (!attributeId) delete next[type];
      else next[type] = attributeId;
      return next;
    });
    setPage(1);
  }, []);

  const clearAttributeFilters = useCallback(() => {
    setAttributeFilterByType({});
    setPage(1);
  }, []);

  const filterAttrCount = useMemo(
    () => Object.values(attributeFilterByType).filter(Boolean).length,
    [attributeFilterByType],
  );

  const filteredRows = useMemo(() => {
    const q = appliedQ.trim().toLowerCase();
    const rows = menuItemsQ.data ?? [];
    let base = rows;
    if (categoryFilter) {
      base = base.filter(
        (row) => row.categoryId === categoryFilter || row.subcategoryId === categoryFilter,
      );
    }
    if (activeFilter === "yes") base = base.filter((row) => row.isActive);
    if (activeFilter === "no") base = base.filter((row) => !row.isActive);
    base = base.filter((row) => rowMatchesAttributeFilters(row, attributeFilterByType));
    if (q) {
      base = base.filter((row) => {
        const names = row.translations.map((t) => t.name).join(" ");
        const attrHay = row.attributes.map((a) => a.attributeType).join(" ");
        const hay = [row.itemCode, row.slug, row.categorySlug, row.subcategorySlug ?? "", names, attrHay]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return [...base].sort((a, b) => {
      const cmp =
        sortBy === "code"
          ? a.itemCode.localeCompare(b.itemCode)
          : (a.translations.find((t) => t.languageCode === "en")?.name ?? "").localeCompare(
              b.translations.find((t) => t.languageCode === "en")?.name ?? "",
            );
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [appliedQ, attributeFilterByType, activeFilter, categoryFilter, menuItemsQ.data, sortBy, sortDir]);

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
  }, [appliedQ, categoryFilter, activeFilter, attributeFilterByType, sortBy, sortDir]);

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

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteAdminMenuItem(token!, id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      toast.success("Menu item removed (soft-deleted).");
    },
    onError: () => toast.error("Could not delete."),
  });

  const saveTranslationM = useMutation({
    mutationFn: async () => {
      const langNum = Number(activeTranslationLanguageId);
      if (Number.isNaN(langNum)) throw new Error("Invalid language");
      return upsertAdminMenuItemTranslation(token!, translateMenuItemId!, {
        languageId: langNum,
        name: translationName.trim(),
        description: translationDescription.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      toast.success("Translation saved.");
    },
    onError: () => toast.error("Could not save translation."),
  });

  const deleteTranslationM = useMutation({
    mutationFn: ({
      menuItemId,
      languageId,
    }: {
      menuItemId: string;
      languageId: string;
    }) => deleteAdminMenuItemTranslation(token!, menuItemId, languageId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      toast.success("Translation removed.");
    },
    onError: () => toast.error("Could not remove translation."),
  });

  const translatingRow = useMemo(
    () => menuItemsQ.data?.find((x) => x.id === translateMenuItemId) ?? null,
    [menuItemsQ.data, translateMenuItemId],
  );

  const translationLanguages = useMemo(
    () => (languagesQ.data ?? []).filter((l) => l.isActive),
    [languagesQ.data],
  );

  function openTranslateModal(row: AdminMenuItemItem) {
    const languages = (languagesQ.data ?? []).filter((l) => l.isActive);
    const first = languages.find((l) => l.code === "en") ?? languages[0];
    const existing = row.translations.find((t) => t.languageId === first?.id);
    setTranslateMenuItemId(row.id);
    setActiveTranslationLanguageId(first?.id ?? "");
    setTranslationName(existing?.name ?? "");
    setTranslationDescription(existing?.description ?? "");
    setTranslateOpen(true);
  }

  function onTranslationTabChange(language: AdminLanguageItem) {
    const existing = translatingRow?.translations.find((t) => t.languageId === language.id);
    setActiveTranslationLanguageId(language.id);
    setTranslationName(existing?.name ?? "");
    setTranslationDescription(existing?.description ?? "");
  }

  const loadingDeps =
    menuItemsQ.isPending || languagesQ.isPending || menuCategoriesQ.isPending || attributesQ.isPending;

  if (loadingDeps) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-brand-text-muted">
        Loading menu items…
      </div>
    );
  }

  if (
    menuItemsQ.isError ||
    languagesQ.isError ||
    menuCategoriesQ.isError ||
    attributesQ.isError ||
    !menuItemsQ.data ||
    !languagesQ.data ||
    !menuCategoriesQ.data ||
    !attributesQ.data
  ) {
    return (
      <div className="admin-panel-card border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        Could not load menu items.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1400px]">
      <AdminBreadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Menu items" }]} />

      <details className="admin-panel-card mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm open:shadow-md">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-4 font-bold text-brand-text-dark outline-none ring-brand-red/20 focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
          <Faders size={22} className="text-brand-red" aria-hidden />
          Filters
          <span className="text-xs font-semibold text-brand-text-muted">
            {filterAttrCount > 0 ? `${filterAttrCount} tag filter(s)` : "Category · active · tags"}
          </span>
        </summary>
        <div className="space-y-6 border-t border-gray-100 px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <label className="text-xs font-bold uppercase tracking-wide text-brand-text-muted">
              Category
              <div className="mt-2">
                <AdminSearchableSelect
                  instanceId="admin-menu-items-filter-category"
                  ariaLabel="Category filter"
                  placeholder="All categories"
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
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-brand-text-muted">
              Active
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value as "" | "yes" | "no");
                  setPage(1);
                }}
                className="admin-field-quiet mt-2 w-full rounded-xl px-3 py-3 text-sm font-semibold"
              >
                <option value="">All</option>
                <option value="yes">Active only</option>
                <option value="no">Inactive only</option>
              </select>
            </label>
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => {
                  setDraftQ("");
                  setAppliedQ("");
                  setCategoryFilter("");
                  setActiveFilter("");
                  clearAttributeFilters();
                  setPage(1);
                }}
                className="rounded-xl border border-gray-200 bg-brand-page px-4 py-3 text-xs font-bold text-brand-text-dark transition hover:bg-white"
              >
                Reset all filters
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-brand-text-muted">
              Use one dropdown per group. Items must match every group you set (leave as Any to skip).
            </p>
            {filterSectionTypes.length === 0 ? (
              <p className="text-sm text-brand-text-muted">
                No catalog attributes yet — add some under Attributes to unlock tag filters.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filterSectionTypes.map((type) => {
                  const opts = [
                    { value: "", label: "Any" },
                    ...(attrsByType.get(type) ?? []).map((a) => ({
                      value: a.id,
                      label: attributeChoiceLabel(a),
                    })),
                  ];
                  return (
                    <label
                      key={type}
                      className="text-xs font-bold uppercase tracking-wide text-brand-text-muted"
                    >
                      {menuItemAttributeTypeTitle(type)}
                      <div className="mt-2">
                        <AdminSearchableSelect
                          instanceId={`admin-menu-items-filter-attr-${type}`}
                          ariaLabel={`Filter ${type}`}
                          placeholder="Any"
                          options={opts}
                          value={attributeFilterByType[type] ?? ""}
                          onChange={(v) => setAttributeFilterForType(type, v)}
                          menuPortal
                          className="w-full"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </details>

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
                placeholder="Search code, slug, categories, names…"
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
                  Clear search
                </button>
              ) : null}
              <Link
                href="/admin/menu-items/new"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5"
              >
                <Plus size={16} weight="bold" />
                Add menu item
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
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
                <th className="admin-datatable-th tabular-nums">Cost</th>
                <th className="admin-datatable-th text-center">Recipe</th>
                <th className="admin-datatable-th text-center">Tags</th>
                <th className="admin-datatable-th">Active</th>
                <th className="admin-datatable-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-datatable-cell py-20 text-center">
                    <p className="text-base font-semibold text-brand-text-dark">No menu items match</p>
                    <p className="mt-1 text-sm text-brand-text-muted">
                      Adjust filters or{" "}
                      <Link href="/admin/menu-items/new" className="font-bold text-brand-red underline">
                        add an item
                      </Link>
                      .
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
                      <td className="admin-datatable-cell font-mono text-xs font-semibold">{row.itemCode}</td>
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
                        <span className="font-medium text-brand-text-dark">{row.categorySlug}</span>
                        {row.subcategorySlug ? (
                          <span className="mt-0.5 block text-xs">↳ {row.subcategorySlug}</span>
                        ) : null}
                      </td>
                      <td className="admin-datatable-cell tabular-nums text-sm">{row.baseCost.toFixed(2)}</td>
                      <td className="admin-datatable-cell text-center text-xs font-semibold tabular-nums text-brand-text-muted">
                        {row.ingredients.length}
                      </td>
                      <td className="admin-datatable-cell text-center text-xs font-semibold tabular-nums text-brand-text-muted">
                        {row.attributes.length}
                      </td>
                      <td className="admin-datatable-cell text-sm">{row.isActive ? "Yes" : "No"}</td>
                      <td className="admin-datatable-cell text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            title="Translate"
                            onClick={() => openTranslateModal(row)}
                            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-gray-100 text-brand-text-dark shadow-sm transition hover:bg-brand-dark hover:text-white"
                          >
                            <Translate size={18} aria-hidden />
                          </button>
                          <Link
                            href={`/admin/menu-items/${encodeURIComponent(row.id)}/edit`}
                            title="Edit item, tags & recipe"
                            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
                          >
                            <PencilSimple size={18} aria-hidden />
                          </Link>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => {
                              if (!confirm(`Remove menu item ${row.itemCode}?`)) return;
                              deleteM.mutate(row.id);
                            }}
                            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-rose-50 text-rose-600 shadow-sm transition hover:bg-rose-600 hover:text-white"
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
        open={translateOpen && Boolean(translatingRow)}
        title="Translate menu item"
        description={
          translatingRow ? `${translatingRow.itemCode} · ${translatingRow.slug}` : undefined
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
                        menuItemId: translatingRow.id,
                        languageId: activeTranslationLanguageId,
                      });
                      setTranslationName("");
                      setTranslationDescription("");
                    }}
                    className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    {deleteTranslationM.isPending ? "Removing…" : "Remove translation"}
                  </button>
                ) : (
                  <p className="max-w-xs text-xs leading-snug text-brand-text-muted">
                    English is edited on the{" "}
                    <Link
                      href={`/admin/menu-items/${encodeURIComponent(translatingRow.id)}/edit`}
                      className="font-semibold text-brand-red underline"
                    >
                      menu item edit page
                    </Link>
                    .
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
