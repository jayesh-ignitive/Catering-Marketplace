"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminModalField } from "@/components/admin/AdminModal";
import { AdminSearchableSelect } from "@/components/admin/AdminSearchableSelect";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminMenuItem,
  fetchAdminAttributes,
  fetchAdminIngredients,
  fetchAdminLanguages,
  fetchAdminMenuCategories,
  fetchAdminMenuItem,
  updateAdminMenuItem,
  upsertAdminMenuItemTranslation,
  type AdminAttributeItem,
  type AdminAttributeType,
  type AdminIngredientItem,
  type AdminIngredientUnit,
  type AdminMenuCategoryItem,
} from "@/lib/admin-api";
import { uploadCateringImage } from "@/lib/catering-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BowlFood,
  Clock,
  CookingPot,
  Camera,
  SquaresFour,
  Plus,
  Tag,
  Trash,
  UploadSimple,
  VideoCamera,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import {
  MENU_ITEM_RELEVANT_TYPES,
  MENU_ITEM_SINGLE_SELECT_TYPES,
  menuItemAttributeTypeTitle,
} from "./attribute-types";

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

export type MenuItemEditorFormProps = {
  mode: "create" | "edit";
  menuItemId?: string;
};

type RecipeDraftRow = {
  key: string;
  ingredientId: string;
  quantity: string;
  unit: AdminIngredientUnit;
  isOptional: boolean;
  notes: string;
};

type GalleryRow = {
  key: string;
  url: string;
};

function categoryEnName(c: AdminMenuCategoryItem): string {
  const en = c.translations.find((t) => t.languageCode === "en");
  return en?.name ?? c.slug;
}

function ingredientLabel(row: AdminIngredientItem): string {
  const en = row.translations.find((t) => t.languageCode === "en");
  return `${row.ingredientCode} · ${en?.name ?? row.slug}`;
}

function attributeChoiceLabel(a: AdminAttributeItem): string {
  const en = a.translations.find((t) => t.languageCode === "en");
  return en?.name ?? a.type;
}

function EditorSectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-100/90 bg-white p-6 shadow-[0_14px_44px_-22px_rgba(35,45,66,0.14)] ring-1 ring-gray-50/90 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-red-light text-brand-red"
          aria-hidden
        >
          <span className="[&_svg]:block [&_svg]:size-[26px]">{icon}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-6">
          <header className="border-b border-gray-100 pb-4">
            <h2 className="font-heading text-xl font-bold tracking-tight text-brand-text-dark">{title}</h2>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-text-muted">{subtitle}</p>
            ) : null}
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}

export function MenuItemEditorForm({ mode, menuItemId }: MenuItemEditorFormProps) {
  const { token, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [slugManual, setSlugManual] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [englishDescription, setEnglishDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryRows, setGalleryRows] = useState<GalleryRow[]>([]);
  const [galleryUploadKey, setGalleryUploadKey] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [preparationTime, setPreparationTime] = useState("0");
  const [cookingTime, setCookingTime] = useState("0");
  const [shelfLifeHours, setShelfLifeHours] = useState("");
  const [baseCost, setBaseCost] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [selectedAttrIds, setSelectedAttrIds] = useState<Set<string>>(new Set());
  const [recipeRows, setRecipeRows] = useState<RecipeDraftRow[]>([]);

  const [isDragOver, setDragOver] = useState(false);
  const [isUploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const hydratedRef = useRef<string | null>(null);

  const menuItemQ = useQuery({
    queryKey: ["admin", "menu-item", token, menuItemId],
    queryFn: () => fetchAdminMenuItem(token!, menuItemId!),
    enabled: mode === "edit" && Boolean(token && user?.role === "admin" && menuItemId),
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
  const ingredientsQ = useQuery({
    queryKey: ["admin", "ingredients", token],
    queryFn: () => fetchAdminIngredients(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });
  const attributesQ = useQuery({
    queryKey: ["admin", "attributes", token],
    queryFn: () => fetchAdminAttributes(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const menuRoots = useMemo(
    () => (menuCategoriesQ.data ?? []).filter((c) => c.parentId == null),
    [menuCategoriesQ.data],
  );

  const categorySelectOptions = useMemo(() => {
    return menuRoots.map((c) => ({ value: c.id, label: categoryEnName(c) }));
  }, [menuRoots]);

  const subcategorySelectOptions = useMemo(
    () =>
      (menuCategoriesQ.data ?? [])
        .filter((c) => c.parentId === categoryId)
        .map((c) => ({ value: c.id, label: categoryEnName(c) })),
    [menuCategoriesQ.data, categoryId],
  );

  const ingredientSelectOptions = useMemo(() => {
    const rows = ingredientsQ.data ?? [];
    return [...rows]
      .sort((a, b) => a.ingredientCode.localeCompare(b.ingredientCode))
      .map((r) => ({ value: r.id, label: ingredientLabel(r) }));
  }, [ingredientsQ.data]);

  const unitSelectOptions = UNIT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

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

  const visibleAttributeTypes = useMemo(() => {
    return MENU_ITEM_RELEVANT_TYPES.filter((t) => (attrsByType.get(t)?.length ?? 0) > 0);
  }, [attrsByType]);

  useEffect(() => {
    if (!categoryId) return;
    if (subcategoryId && !subcategorySelectOptions.some((o) => o.value === subcategoryId)) {
      setSubcategoryId("");
    }
  }, [categoryId, subcategoryId, subcategorySelectOptions]);

  useEffect(() => {
    if (mode !== "edit" || !menuItemQ.data || !menuItemId) return;
    if (hydratedRef.current === menuItemId) return;
    hydratedRef.current = menuItemId;
    const mi = menuItemQ.data;
    setCategoryId(mi.categoryId);
    setSubcategoryId(mi.subcategoryId ?? "");
    setItemCode(mi.itemCode);
    setSlugManual(mi.slug);
    const en = mi.translations.find((t) => t.languageCode === "en");
    setEnglishName(en?.name ?? "");
    setEnglishDescription(en?.description ?? "");
    setImageUrl(mi.image ?? "");
    setGalleryRows(
      (mi.gallery ?? []).map((url, i) => ({
        key: `gal-${menuItemId}-${i}`,
        url,
      })),
    );
    setVideoUrl(mi.videoUrl ?? "");
    setPreparationTime(String(mi.preparationTime));
    setCookingTime(String(mi.cookingTime));
    setShelfLifeHours(mi.shelfLifeHours != null ? String(mi.shelfLifeHours) : "");
    setBaseCost(String(mi.baseCost));
    setIsActive(mi.isActive);
    setSelectedAttrIds(new Set(mi.attributes.map((a) => a.attributeId)));
    setRecipeRows(
      mi.ingredients.map((r) => ({
        key: `srv-${r.id}`,
        ingredientId: r.ingredientId,
        quantity: String(r.quantity),
        unit: r.unit,
        isOptional: r.isOptional,
        notes: r.notes ?? "",
      })),
    );
  }, [mode, menuItemId, menuItemQ.data]);

  function toggleAttr(id: string) {
    setSelectedAttrIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setSingleSelectAttr(type: AdminAttributeType, attributeId: string) {
    const typeAttrIds = new Set((attrsByType.get(type) ?? []).map((a) => a.id));
    setSelectedAttrIds((prev) => {
      const next = new Set(prev);
      for (const id of typeAttrIds) next.delete(id);
      if (attributeId) next.add(attributeId);
      return next;
    });
  }

  function selectedSingleAttrId(type: AdminAttributeType): string {
    const attrs = attrsByType.get(type) ?? [];
    for (const a of attrs) {
      if (selectedAttrIds.has(a.id)) return a.id;
    }
    return "";
  }

  function addRecipeRow() {
    setRecipeRows((rows) => [
      ...rows,
      {
        key: `new-${crypto.randomUUID()}`,
        ingredientId: "",
        quantity: "1",
        unit: "GM",
        isOptional: false,
        notes: "",
      },
    ]);
  }

  function removeRecipeRow(key: string) {
    setRecipeRows((rows) => rows.filter((r) => r.key !== key));
  }

  function updateRecipeRow(key: string, patch: Partial<RecipeDraftRow>) {
    setRecipeRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function uploadImage(file: File) {
    if (!token) return;
    try {
      setUploadingImage(true);
      const uploaded = await uploadCateringImage(token, file, "gallery");
      setImageUrl(uploaded.url);
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  function addGalleryRow() {
    setGalleryRows((rows) => [
      ...rows,
      { key: `gal-new-${crypto.randomUUID()}`, url: "" },
    ]);
  }

  function removeGalleryRow(key: string) {
    setGalleryRows((rows) => rows.filter((r) => r.key !== key));
  }

  function updateGalleryRow(key: string, patch: Partial<GalleryRow>) {
    setGalleryRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function uploadGalleryImageForRow(rowKey: string, file: File) {
    if (!token) return;
    try {
      setGalleryUploadKey(rowKey);
      const uploaded = await uploadCateringImage(token, file, "gallery");
      updateGalleryRow(rowKey, { url: uploaded.url });
    } catch {
      toast.error("Gallery image upload failed.");
    } finally {
      setGalleryUploadKey(null);
    }
  }

  const saveM = useMutation({
    mutationFn: async () => {
      if (!englishName.trim()) throw new Error("English name is required.");
      if (!categoryId.trim()) throw new Error("Category is required.");
      const enLang = languagesQ.data?.find((l) => l.code === "en");
      if (!enLang) throw new Error("English language missing.");

      const catNum = Number(categoryId);
      if (Number.isNaN(catNum)) throw new Error("Invalid category.");
      const subNum =
        subcategoryId.trim() === "" ? undefined : Number(subcategoryId);
      if (subcategoryId.trim() !== "" && Number.isNaN(subNum)) {
        throw new Error("Invalid subcategory.");
      }

      const prep = Number(preparationTime);
      const cook = Number(cookingTime);
      if (Number.isNaN(prep) || prep < 0) throw new Error("Preparation time must be non-negative.");
      if (Number.isNaN(cook) || cook < 0) throw new Error("Cooking time must be non-negative.");

      const shelf =
        shelfLifeHours.trim() === "" ? null : Number(shelfLifeHours);
      if (
        shelfLifeHours.trim() !== "" &&
        (Number.isNaN(shelf!) || shelf! < 0)
      ) {
        throw new Error("Shelf life (hours) must be non-negative.");
      }

      const cost = Number(baseCost);
      if (Number.isNaN(cost) || cost < 0) throw new Error("Base cost must be non-negative.");

      const gallery = galleryRows.map((r) => r.url.trim()).filter(Boolean);

      const ingredientPayload: Array<{
        ingredientId: number;
        quantity: number;
        unit?: AdminIngredientUnit;
        isOptional?: boolean;
        notes?: string;
      }> = [];

      for (const row of recipeRows) {
        if (!row.ingredientId.trim()) continue;
        const qty = Number(row.quantity);
        if (Number.isNaN(qty) || qty < 0) {
          throw new Error("Each recipe line needs a valid quantity.");
        }
        const ingNum = Number(row.ingredientId);
        if (Number.isNaN(ingNum)) throw new Error("Invalid ingredient on a recipe line.");
        ingredientPayload.push({
          ingredientId: ingNum,
          quantity: qty,
          unit: row.unit,
          isOptional: row.isOptional,
          notes: row.notes.trim() || undefined,
        });
      }

      const attributeIds = [...selectedAttrIds].map((id) => Number(id)).filter((n) => !Number.isNaN(n));

      if (mode === "create") {
        if (!token) throw new Error("Not signed in.");
        await createAdminMenuItem(token, {
          categoryId: catNum,
          subcategoryId: subNum,
          itemCode: itemCode.trim().toUpperCase() || undefined,
          slug: slugManual.trim().toLowerCase() || undefined,
          image: imageUrl.trim() || undefined,
          gallery: gallery.length ? gallery : undefined,
          videoUrl: videoUrl.trim() || undefined,
          preparationTime: prep,
          cookingTime: cook,
          shelfLifeHours: shelf,
          baseCost: cost,
          isActive,
          englishName: englishName.trim(),
          englishDescription: englishDescription.trim() || undefined,
          attributeIds,
          ingredients: ingredientPayload.length ? ingredientPayload : undefined,
        });
        return;
      }

      if (!menuItemId || !token) throw new Error("Missing item or session.");

      await updateAdminMenuItem(token, menuItemId, {
        categoryId: catNum,
        subcategoryId: subNum ?? null,
        itemCode: itemCode.trim().toUpperCase() || undefined,
        slug: slugManual.trim().toLowerCase() || undefined,
        image: imageUrl.trim() || null,
        gallery: gallery.length ? gallery : null,
        videoUrl: videoUrl.trim() || null,
        preparationTime: prep,
        cookingTime: cook,
        shelfLifeHours: shelf,
        baseCost: cost,
        isActive,
        attributeIds,
        ingredients: ingredientPayload,
      });

      const langNum = Number(enLang.id);
      if (Number.isNaN(langNum)) throw new Error("Invalid language id.");
      await upsertAdminMenuItemTranslation(token, menuItemId, {
        languageId: langNum,
        name: englishName.trim(),
        description: englishDescription.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      await qc.invalidateQueries({ queryKey: ["admin", "menu-item"] });
      toast.success(mode === "create" ? "Menu item created." : "Menu item updated.");
      router.push("/admin/menu-items");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save."),
  });

  const loadingDeps =
    menuCategoriesQ.isPending ||
    languagesQ.isPending ||
    ingredientsQ.isPending ||
    attributesQ.isPending ||
    (mode === "edit" && menuItemQ.isPending);

  if (
    !token ||
    user?.role !== "admin" ||
    menuCategoriesQ.isError ||
    languagesQ.isError ||
    ingredientsQ.isError ||
    attributesQ.isError ||
    !menuCategoriesQ.data ||
    !languagesQ.data ||
    !ingredientsQ.data ||
    !attributesQ.data
  ) {
    return (
      <div className="admin-panel-card border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        Could not load editor (check admin session and API).
      </div>
    );
  }

  if (mode === "edit" && menuItemQ.isError) {
    return (
      <div className="admin-panel-card border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        Menu item not found or failed to load.
      </div>
    );
  }

  if (loadingDeps) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-brand-text-muted">
        Loading…
      </div>
    );
  }

  const title = mode === "create" ? "Add menu item" : "Edit menu item";
  const pageIntro =
    mode === "create"
      ? "Start with category and English name (required). You can save once those are set, then come back anytime for photos, filters, or recipe lines."
      : "Update how this dish appears in your catalog. Saving applies everywhere this menu data is used.";

  return (
    <section className="mx-auto max-w-[960px] pb-28">
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Menu items", href: "/admin/menu-items" },
          { label: title },
        ]}
      />

      <div className="mt-6 space-y-8">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_14px_44px_-22px_rgba(35,45,66,0.12)] ring-1 ring-gray-50">
          <div className="border-b border-brand-red/10 bg-gradient-to-br from-[#fffbfb] via-white to-brand-page/40 px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-red">
                  Menu catalog
                </p>
                <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-brand-text-dark sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-text-muted">{pageIntro}</p>
              </div>
              <Link
                href="/admin/menu-items"
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-brand-text-dark shadow-sm transition hover:border-brand-red/25 hover:bg-brand-page"
              >
                <ArrowLeft size={16} weight="bold" aria-hidden />
                Back to list
              </Link>
            </div>
            {mode === "create" ? (
              <ol className="mt-6 grid gap-3 text-xs font-bold text-brand-text-dark sm:grid-cols-3">
                <li className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-red text-[11px] font-extrabold text-white">
                    1
                  </span>
                  <span className="leading-snug">Details &amp; where it lives</span>
                </li>
                <li className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-red text-[11px] font-extrabold text-white">
                    2
                  </span>
                  <span className="leading-snug">Photos &amp; media</span>
                </li>
                <li className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-red text-[11px] font-extrabold text-white">
                    3
                  </span>
                  <span className="leading-snug">Labels &amp; recipe (optional)</span>
                </li>
              </ol>
            ) : null}
          </div>
        </div>

        <EditorSectionCard
          icon={<BowlFood weight="duotone" />}
          title="Dish details"
          subtitle="Category and English name are required. Everything else on this page can wait until you are ready."
        >
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <AdminModalField label="Category (required)">
                <AdminSearchableSelect
                  instanceId="editor-menu-item-category"
                  ariaLabel="Menu category"
                  placeholder="Search category…"
                  options={categorySelectOptions}
                  value={categoryId}
                  onChange={(v) => {
                    setCategoryId(v);
                    setSubcategoryId("");
                  }}
                  menuPortal
                  className="w-full"
                />
              </AdminModalField>
              <AdminModalField label="Subcategory (optional)">
                <AdminSearchableSelect
                  instanceId="editor-menu-item-subcategory"
                  ariaLabel="Menu subcategory"
                  placeholder={categoryId ? "Search subcategory…" : "Pick a category first"}
                  options={subcategorySelectOptions}
                  value={subcategoryId}
                  onChange={(v) => setSubcategoryId(v)}
                  disabled={!categoryId || subcategorySelectOptions.length === 0}
                  menuPortal
                  className="w-full"
                />
              </AdminModalField>
            </div>
            <AdminModalField label="English name (required)">
              <input
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                className="admin-field-quiet w-full px-3 py-3"
                autoComplete="off"
                placeholder="e.g. Paneer tikka masala"
              />
            </AdminModalField>
            <AdminModalField label="English description (optional)">
              <textarea
                value={englishDescription}
                onChange={(e) => setEnglishDescription(e.target.value)}
                rows={4}
                placeholder="Short listing text — ingredients, spice level, or what makes this dish special."
                className="admin-field-quiet w-full resize-y px-3 py-3"
              />
            </AdminModalField>
            <div className="rounded-2xl border border-gray-100 bg-brand-page/50 p-4 sm:p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-1 size-4 shrink-0 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span>
                  <span className="block text-sm font-bold text-brand-text-dark">Published on menus</span>
                  <span className="mt-1 block text-xs leading-relaxed text-brand-text-muted">
                    Turn off to hide this dish from customer-facing menus while you finish details. You can still
                    save your work.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </EditorSectionCard>

        <EditorSectionCard
          icon={<Clock weight="duotone" />}
          title="Kitchen timing & internal codes"
          subtitle="Optional reference fields for prep, shelf life, costing, and URLs used only in admin or integrations."
        >
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <AdminModalField label="Item code (optional)">
                <input
                  value={itemCode}
                  onChange={(e) =>
                    setItemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))
                  }
                  className="admin-field-quiet w-full px-3 py-3 font-mono text-sm"
                  placeholder="Auto from name if empty"
                />
              </AdminModalField>
              <AdminModalField label="Slug override (optional)">
                <input
                  value={slugManual}
                  onChange={(e) =>
                    setSlugManual(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className="admin-field-quiet w-full px-3 py-3 font-mono text-sm"
                  placeholder="Leave blank to auto-generate"
                />
                <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">
                  The slug builds the public URL key. Leave empty unless you need a custom link segment.
                </p>
              </AdminModalField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <AdminModalField label="Prep (minutes)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(e.target.value)}
                  className="admin-field-quiet w-full px-3 py-3 tabular-nums"
                />
              </AdminModalField>
              <AdminModalField label="Cook (minutes)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  className="admin-field-quiet w-full px-3 py-3 tabular-nums"
                />
              </AdminModalField>
              <AdminModalField label="Shelf life (hours)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={shelfLifeHours}
                  onChange={(e) => setShelfLifeHours(e.target.value)}
                  placeholder="Optional"
                  className="admin-field-quiet w-full px-3 py-3 tabular-nums"
                />
              </AdminModalField>
              <AdminModalField label="Base cost">
                <input
                  type="text"
                  inputMode="decimal"
                  value={baseCost}
                  onChange={(e) => setBaseCost(e.target.value)}
                  className="admin-field-quiet w-full px-3 py-3 tabular-nums"
                />
              </AdminModalField>
            </div>
          </div>
        </EditorSectionCard>

        <EditorSectionCard
          icon={<Camera weight="duotone" />}
          title="Cover photo & video"
          subtitle="The cover image is the main thumbnail in listings. Add an optional video link for rich menus."
        >
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <AdminModalField label="Cover image">
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
                className={`rounded-2xl border-2 border-dashed p-8 text-center text-sm outline-none ring-brand-red/25 transition focus-visible:ring-2 ${isDragOver ? "border-brand-red bg-brand-red-light" : "border-gray-200 bg-brand-page/80"}`}
              >
                <UploadSimple size={28} className="mx-auto mb-3 text-brand-text-muted" aria-hidden />
                <p className="font-bold text-brand-text-dark">Drop an image here or click to browse</p>
                <p className="mt-2 text-xs text-brand-text-muted">PNG or JPG recommended · square or landscape works best</p>
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
                  <p className="mt-4 text-xs font-bold text-brand-red">Uploading…</p>
                ) : null}
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt=""
                    className="mx-auto mt-5 h-36 max-w-full rounded-2xl object-cover shadow-md ring-1 ring-gray-100"
                  />
                ) : null}
              </div>
            </AdminModalField>
            <AdminModalField label="Video URL (optional)">
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="admin-field-quiet w-full px-3 py-3"
                maxLength={500}
                placeholder="https://…"
              />
              <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-brand-text-muted">
                <VideoCamera size={16} className="mt-0.5 shrink-0 text-brand-text-muted" aria-hidden />
                Paste a link from YouTube, Vimeo, or your CDN. Leave blank if you only use photos.
              </p>
            </AdminModalField>
          </div>
        </EditorSectionCard>

        <EditorSectionCard
          icon={<SquaresFour weight="duotone" />}
          title="Extra gallery photos"
          subtitle="Optional carousel shots — not required for a minimal listing. The cover image above stays the primary thumbnail."
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-4">
            <p className="text-sm text-brand-text-muted">
              Add more angles or plating shots customers can swipe through on the dish page.
            </p>
            <button
              type="button"
              onClick={addGalleryRow}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5"
            >
              <Plus size={16} weight="bold" aria-hidden />
              Add gallery image
            </button>
          </div>

          {galleryRows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-brand-page/40 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-brand-text-dark">No extra photos yet</p>
              <p className="mt-2 text-sm text-brand-text-muted">
                Optional — skip this if one cover image is enough for now.
              </p>
              <button
                type="button"
                onClick={addGalleryRow}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-brand-text-dark transition hover:border-brand-red/30 hover:bg-brand-red-light"
              >
                <Plus size={16} weight="bold" aria-hidden />
                Add first gallery image
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {galleryRows.map((row, index) => (
                <div
                  key={row.key}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-brand-page/50 p-4 sm:flex-row sm:items-start"
                >
                  <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
                    {row.url.trim() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.url.trim()} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="px-2 text-center text-[10px] font-bold uppercase text-brand-text-muted">
                        No preview
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <AdminModalField label={`Image ${index + 1} — URL`}>
                      <input
                        value={row.url}
                        onChange={(e) => updateGalleryRow(row.key, { url: e.target.value })}
                        placeholder="https://…"
                        className="admin-field-quiet w-full px-3 py-3 font-mono text-xs"
                        maxLength={500}
                      />
                    </AdminModalField>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-brand-text-dark transition hover:bg-brand-page">
                        <UploadSimple size={16} aria-hidden />
                        {galleryUploadKey === row.key ? "Uploading…" : "Upload file"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={galleryUploadKey !== null}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f) void uploadGalleryImageForRow(row.key, f);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeGalleryRow(row.key)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash size={16} aria-hidden />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </EditorSectionCard>

        <EditorSectionCard
          icon={<Tag weight="duotone" />}
          title="Labels & browsing filters"
          subtitle="These tags power filters on your menu. Dietary is a single choice (veg / non-veg / Jain). Other groups allow multiple selections."
        >
          <div className="space-y-8">
            {visibleAttributeTypes.length === 0 ? (
              <p className="text-sm text-brand-text-muted">
                No active attributes in the catalog yet. Add attributes under Admin → Attributes first.
              </p>
            ) : (
              visibleAttributeTypes.map((type) => {
                const single = MENU_ITEM_SINGLE_SELECT_TYPES.has(type);
                if (single) {
                  const opts = [
                    { value: "", label: "Not specified" },
                    ...(attrsByType.get(type) ?? []).map((a) => ({
                      value: a.id,
                      label: attributeChoiceLabel(a),
                    })),
                  ];
                  return (
                    <div
                      key={type}
                      className="rounded-2xl border border-gray-100 bg-brand-page/35 p-4 sm:p-5"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-brand-text-dark">
                        {menuItemAttributeTypeTitle(type)}
                      </h3>
                      <p className="mt-1 text-xs text-brand-text-muted">
                        Choose one option — a dish cannot be both veg and non-veg.
                      </p>
                      <div className="mt-3 max-w-md">
                        <AdminSearchableSelect
                          instanceId={`editor-menu-attr-${type}`}
                          ariaLabel={menuItemAttributeTypeTitle(type)}
                          placeholder="Not specified"
                          options={opts}
                          value={selectedSingleAttrId(type)}
                          onChange={(v) => setSingleSelectAttr(type, v)}
                          menuPortal
                          className="w-full"
                        />
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={type}
                    className="rounded-2xl border border-gray-100 bg-brand-page/35 p-4 sm:p-5"
                  >
                    <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-brand-text-dark">
                      {menuItemAttributeTypeTitle(type)}
                    </h3>
                    <p className="mt-1 text-xs text-brand-text-muted">
                      Select all that apply — guests use these filters when browsing.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(attrsByType.get(type) ?? []).map((a) => (
                        <label
                          key={a.id}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 text-sm shadow-sm transition hover:border-brand-red/25"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAttrIds.has(a.id)}
                            onChange={() => toggleAttr(a.id)}
                            className="mt-1 size-4 shrink-0 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                          />
                          <span className="font-semibold leading-snug text-brand-text-dark">
                            {attributeChoiceLabel(a)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </EditorSectionCard>

        <EditorSectionCard
          icon={<CookingPot weight="duotone" />}
          title="Recipe / bill of materials"
          subtitle="Optional. Link stock ingredients with quantities for costing or kitchen prep — skip entirely for display-only menus."
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 pb-4">
            <p className="text-sm text-brand-text-muted">
              Each row is one ingredient line with quantity and unit (same units as your ingredient catalog).
            </p>
            <button
              type="button"
              onClick={addRecipeRow}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5"
            >
              <Plus size={16} weight="bold" aria-hidden />
              Add ingredient row
            </button>
          </div>

          {recipeRows.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-brand-page/40 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-brand-text-dark">No ingredients linked yet</p>
              <p className="mt-2 text-sm text-brand-text-muted">
                Fine for menu-only listings. Add rows when you want quantities tied to inventory.
              </p>
              <button
                type="button"
                onClick={addRecipeRow}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-brand-text-dark transition hover:border-brand-red/30 hover:bg-brand-red-light"
              >
                <Plus size={16} weight="bold" aria-hidden />
                Add first ingredient
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {recipeRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-xl border border-gray-100 bg-brand-page/50 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <AdminModalField label="Ingredient">
                      <AdminSearchableSelect
                        instanceId={`recipe-ing-${row.key}`}
                        ariaLabel="Ingredient"
                        placeholder="Search…"
                        options={ingredientSelectOptions}
                        value={row.ingredientId}
                        onChange={(v) => updateRecipeRow(row.key, { ingredientId: v })}
                        menuPortal
                        className="w-full"
                      />
                    </AdminModalField>
                    <AdminModalField label="Quantity">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.quantity}
                        onChange={(e) => updateRecipeRow(row.key, { quantity: e.target.value })}
                        className="admin-field-quiet w-full px-3 py-3 tabular-nums"
                      />
                    </AdminModalField>
                    <AdminModalField label="Unit">
                      <AdminSearchableSelect
                        instanceId={`recipe-unit-${row.key}`}
                        ariaLabel="Unit"
                        options={unitSelectOptions}
                        value={row.unit}
                        onChange={(v) =>
                          updateRecipeRow(row.key, { unit: v as AdminIngredientUnit })
                        }
                        menuPortal
                        className="w-full"
                      />
                    </AdminModalField>
                    <label className="flex cursor-pointer items-center gap-2 pt-8 text-sm font-semibold text-brand-text-dark md:pt-10">
                      <input
                        type="checkbox"
                        checked={row.isOptional}
                        onChange={(e) =>
                          updateRecipeRow(row.key, { isOptional: e.target.checked })
                        }
                        className="size-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      Optional in dish
                    </label>
                  </div>
                  <AdminModalField label="Notes">
                    <input
                      value={row.notes}
                      onChange={(e) => updateRecipeRow(row.key, { notes: e.target.value })}
                      className="admin-field-quiet mt-2 w-full px-3 py-3"
                      placeholder="Optional"
                    />
                  </AdminModalField>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeRecipeRow(row.key)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      <Trash size={16} aria-hidden />
                      Remove row
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </EditorSectionCard>

        <div className="sticky bottom-2 z-10 mt-2 rounded-2xl border border-gray-200/90 bg-white/95 px-4 py-4 shadow-[0_-10px_40px_-12px_rgba(35,45,66,0.18)] backdrop-blur-md sm:bottom-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-brand-text-muted sm:max-w-md">
              <span className="font-bold text-brand-text-dark">Required:</span> category and English name.
              You can save with only those filled — refine photos and labels anytime.
            </p>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                href="/admin/menu-items"
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-center text-xs font-bold text-brand-text-dark transition hover:bg-brand-page"
              >
                Cancel
              </Link>
              <button
                type="button"
                disabled={saveM.isPending}
                onClick={() => saveM.mutate()}
                className="min-w-[11rem] rounded-xl bg-brand-red px-8 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
              >
                {saveM.isPending ? "Saving…" : mode === "create" ? "Create menu item" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
