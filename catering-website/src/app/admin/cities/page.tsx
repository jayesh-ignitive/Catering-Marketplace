"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminModal, AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminCity,
  deleteAdminCity,
  deleteAdminCityTranslation,
  fetchAdminCities,
  fetchAdminCityStates,
  fetchAdminLanguages,
  type AdminCityItem,
  type AdminLanguageItem,
  updateAdminCity,
  upsertAdminCityTranslation,
} from "@/lib/admin-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, PencilSimple, Plus, Trash, Translate } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type FormState = {
  stateId: string;
  name: string;
  slug: string;
  legacyCatalogId: string;
  displayOrder: number;
  isActive: boolean;
};

const EMPTY: FormState = {
  stateId: "",
  name: "",
  slug: "",
  legacyCatalogId: "",
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

function toForm(row: AdminCityItem): FormState {
  return {
    stateId: row.stateId,
    name: row.name,
    slug: row.slug,
    legacyCatalogId: row.legacyCatalogId ?? "",
    displayOrder: row.displayOrder,
    isActive: row.isActive,
  };
}

export default function AdminCitiesPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translatingRow, setTranslatingRow] = useState<AdminCityItem | null>(null);
  const [activeLanguageId, setActiveLanguageId] = useState("");
  const [translationName, setTranslationName] = useState("");

  const listQ = useQuery({
    queryKey: ["admin", "cities", token],
    queryFn: () => fetchAdminCities(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const statesQ = useQuery({
    queryKey: ["admin", "cities", "states", token],
    queryFn: () => fetchAdminCityStates(token!),
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
      qc.invalidateQueries({ queryKey: ["admin", "cities"] }),
      qc.invalidateQueries({ queryKey: ["catalog", "cities"] }),
      qc.invalidateQueries({ queryKey: ["marketplace", "cities"] }),
      qc.invalidateQueries({ queryKey: ["marketplace", "workspace-cities"] }),
    ]);
  };

  const createM = useMutation({
    mutationFn: () =>
      createAdminCity(token!, {
        stateId: form.stateId,
        englishName: form.name.trim(),
        slug: form.slug.trim() || undefined,
        legacyCatalogId: form.legacyCatalogId.trim() || null,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      }),
    onSuccess: async () => {
      toast.success("City created");
      setOpen(false);
      setForm(EMPTY);
      await invalidate();
    },
    onError: () => toast.error("Could not create city"),
  });

  const updateM = useMutation({
    mutationFn: () =>
      updateAdminCity(token!, editingId!, {
        stateId: form.stateId,
        slug: form.slug.trim(),
        legacyCatalogId: form.legacyCatalogId.trim() || null,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      }),
    onSuccess: async () => {
      toast.success("City updated");
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY);
      await invalidate();
    },
    onError: () => toast.error("Could not update city"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteAdminCity(token!, id),
    onSuccess: async () => {
      toast.success("Deleted");
      await invalidate();
    },
    onError: () => toast.error("Cannot delete — city may be linked to caterer profiles"),
  });

  const saveTranslationM = useMutation({
    mutationFn: () => {
      if (!translatingRow || !activeLanguageId) throw new Error("missing");
      return upsertAdminCityTranslation(token!, translatingRow.id, {
        languageId: Number(activeLanguageId),
        name: translationName.trim(),
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
    mutationFn: (payload: { cityId: string; languageId: string }) =>
      deleteAdminCityTranslation(token!, payload.cityId, payload.languageId),
    onSuccess: async () => {
      toast.success("Translation removed");
      setTranslationName("");
      await invalidate();
      if (translatingRow) {
        const fresh = (await fetchAdminCities(token!)).find((r) => r.id === translatingRow.id);
        if (fresh) setTranslatingRow(fresh);
      }
    },
    onError: () => toast.error("Could not remove translation"),
  });

  const rows = useMemo(() => listQ.data ?? [], [listQ.data]);
  const states = statesQ.data ?? [];

  useEffect(() => {
    if (!form.stateId && states.length > 0) {
      setForm((f) => ({ ...f, stateId: states[0]!.id }));
    }
  }, [states, form.stateId]);

  function onTranslationTab(language: AdminLanguageItem) {
    setActiveLanguageId(language.id);
    if (!translatingRow) return;
    const hit = translatingRow.translations.find((t) => t.languageId === language.id);
    setTranslationName(hit?.name ?? translatingRow.name);
  }

  function openTranslate(row: AdminCityItem) {
    setTranslatingRow(row);
    setTranslateOpen(true);
    const enLang =
      translationLanguages.find((l) => l.code === "en") ?? translationLanguages[0];
    if (enLang) onTranslationTab(enLang);
  }

  function submit() {
    if (editingId) {
      if (!form.stateId || !form.slug.trim()) {
        toast.warn("State and slug are required");
        return;
      }
      updateM.mutate();
      return;
    }
    if (!form.stateId || !form.name.trim()) {
      toast.warn("State and English name are required");
      return;
    }
    createM.mutate();
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Cities" }]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-dark">Cities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage catalog and marketplace city names in English, Hindi, and Gujarati.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm({ ...EMPTY, stateId: states[0]?.id ?? "" });
            setOpen(true);
          }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          <Plus aria-hidden />
          Add city
        </button>
      </div>

      {listQ.isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Name (EN)</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Legacy ID</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Profiles</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                  <td className="px-4 py-3 tabular-nums">{row.displayOrder}</td>
                  <td className="px-4 py-3 font-semibold">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.slug}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.stateName}, {row.countryName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.legacyCatalogId ?? "—"}</td>
                  <td className="px-4 py-3">{row.isActive ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 tabular-nums">{row.profileLinkCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        title="Translate"
                        onClick={() => openTranslate(row)}
                        className="cursor-pointer rounded-lg border border-gray-200 p-2 hover:border-brand-dark hover:text-brand-dark"
                      >
                        <Translate size={18} aria-hidden />
                      </button>
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => {
                          setEditingId(row.id);
                          setForm(toForm(row));
                          setOpen(true);
                        }}
                        className="cursor-pointer rounded-lg border border-gray-200 p-2 hover:border-brand-red hover:text-brand-red"
                      >
                        <PencilSimple aria-hidden />
                      </button>
                      <button
                        type="button"
                        title="Delete"
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
        title={editingId ? "Edit city" : "New city"}
        description={
          editingId
            ? "Update slug, state, and visibility. Use Translate for localized names."
            : "English name is stored as the default translation."
        }
        onClose={() => {
          setOpen(false);
          setEditingId(null);
          setForm(EMPTY);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
              }}
              className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={createM.isPending || updateM.isPending}
              onClick={submit}
              className="cursor-pointer rounded-lg bg-brand-red px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {createM.isPending || updateM.isPending ? "Saving…" : editingId ? "Save" : "Create"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminModalField label="State *">
            <select
              value={form.stateId}
              onChange={(e) => setForm((f) => ({ ...f, stateId: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.countryName})
                </option>
              ))}
            </select>
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
        ) : null}
        <AdminModalField label="Slug *">
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm"
          />
        </AdminModalField>
        <AdminModalField label="Legacy catalog ID (optional)">
          <input
            value={form.legacyCatalogId}
            onChange={(e) => setForm((f) => ({ ...f, legacyCatalogId: e.target.value }))}
            placeholder="1–10 for home hero filters"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm"
          />
        </AdminModalField>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
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
        title="Translate city"
        description={translatingRow ? `${translatingRow.slug} · ${translatingRow.name}` : undefined}
        onClose={() => {
          if (saveTranslationM.isPending || deleteTranslationM.isPending) return;
          setTranslateOpen(false);
        }}
        footer={
          translatingRow ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {translationLanguages.find((l) => l.id === activeLanguageId)?.code !== "en" ? (
                  <button
                    type="button"
                    disabled={deleteTranslationM.isPending || saveTranslationM.isPending}
                    onClick={() => {
                      if (!confirm("Remove this translation?")) return;
                      deleteTranslationM.mutate({
                        cityId: translatingRow.id,
                        languageId: activeLanguageId,
                      });
                    }}
                    className="cursor-pointer rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700"
                  >
                    Remove translation
                  </button>
                ) : (
                  <p className="text-xs text-gray-500">English is required.</p>
                )}
              </div>
              <button
                type="button"
                disabled={saveTranslationM.isPending}
                onClick={() => {
                  if (!translationName.trim()) {
                    toast.error("Name is required");
                    return;
                  }
                  saveTranslationM.mutate();
                }}
                className="cursor-pointer rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white"
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
                  const has = translatingRow.translations.some(
                    (t) => t.languageId === language.id,
                  );
                  return (
                    <button
                      key={language.id}
                      type="button"
                      onClick={() => onTranslationTab(language)}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold ${
                        activeLanguageId === language.id
                          ? "border-brand-red bg-brand-red text-white"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {language.name} ({language.code}){has ? " · ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </AdminModalField>
            <AdminModalField label="City name">
              <input
                value={translationName}
                onChange={(e) => setTranslationName(e.target.value)}
                className="admin-field-quiet w-full px-3 py-3"
              />
            </AdminModalField>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
