"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminLanguage,
  deleteAdminLanguage,
  fetchAdminLanguages,
  type AdminLanguageItem,
  updateAdminLanguage,
} from "@/lib/admin-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

type LanguageForm = {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: LanguageForm = {
  code: "",
  name: "",
  nativeName: "",
  direction: "ltr",
  isDefault: false,
  isActive: true,
  sortOrder: 0,
};

function mapToForm(row: AdminLanguageItem): LanguageForm {
  return {
    code: row.code,
    name: row.name,
    nativeName: row.nativeName ?? "",
    direction: row.direction === "rtl" ? "rtl" : "ltr",
    isDefault: row.isDefault,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export default function AdminLanguagesPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<LanguageForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["admin", "languages", token],
    queryFn: () => fetchAdminLanguages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const createM = useMutation({
    mutationFn: (payload: LanguageForm) =>
      createAdminLanguage(token!, {
        ...payload,
        code: payload.code.trim().toLowerCase(),
        name: payload.name.trim(),
        nativeName: payload.nativeName.trim() || undefined,
      }),
    onSuccess: async () => {
      setForm(EMPTY_FORM);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "languages"] });
    },
    onError: () => setError("Could not create language. Check code uniqueness and required fields."),
  });

  const updateM = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LanguageForm }) =>
      updateAdminLanguage(token!, id, {
        ...payload,
        code: payload.code.trim().toLowerCase(),
        name: payload.name.trim(),
        nativeName: payload.nativeName.trim(),
      }),
    onSuccess: async () => {
      setSelectedId(null);
      setForm(EMPTY_FORM);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "languages"] });
    },
    onError: () => setError("Could not update language."),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteAdminLanguage(token!, id),
    onSuccess: async () => {
      if (selectedId) {
        setSelectedId(null);
        setForm(EMPTY_FORM);
      }
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "languages"] });
    },
    onError: () => setError("Could not delete language. Default language cannot be deleted."),
  });

  const editing = useMemo(() => listQ.data?.find((x) => x.id === selectedId) ?? null, [listQ.data, selectedId]);

  function submitForm() {
    if (!form.code.trim() || !form.name.trim()) {
      setError("Code and name are required.");
      return;
    }
    if (selectedId) {
      updateM.mutate({ id: selectedId, payload: form });
    } else {
      createM.mutate(form);
    }
  }

  if (listQ.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-brand-text-muted">
        <p className="text-sm font-semibold">Loading languages…</p>
      </div>
    );
  }

  if (listQ.isError || !listQ.data) {
    return (
      <div className="admin-panel-card mx-auto max-w-3xl border border-rose-100 bg-rose-50/90 p-6 text-rose-800">
        <h1 className="text-lg font-bold">Could not load languages</h1>
        <p className="mt-2 text-sm">Check your connection and admin permissions, then try again.</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1200px]">
      <AdminBreadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Languages" }]} />

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="admin-datatable-shell overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="admin-datatable-thead">
              <tr>
                <th className="admin-datatable-th">Code</th>
                <th className="admin-datatable-th">Name</th>
                <th className="admin-datatable-th">Native</th>
                <th className="admin-datatable-th">Direction</th>
                <th className="admin-datatable-th">Default</th>
                <th className="admin-datatable-th">Active</th>
                <th className="admin-datatable-th">Sort</th>
                <th className="admin-datatable-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {listQ.data.map((row) => (
                <tr key={row.id}>
                  <td className="admin-datatable-cell font-mono text-xs font-semibold">{row.code}</td>
                  <td className="admin-datatable-cell font-bold">{row.name}</td>
                  <td className="admin-datatable-cell text-brand-text-muted">{row.nativeName || "—"}</td>
                  <td className="admin-datatable-cell text-brand-text-muted">{row.direction}</td>
                  <td className="admin-datatable-cell">{row.isDefault ? "Yes" : "No"}</td>
                  <td className="admin-datatable-cell">{row.isActive ? "Yes" : "No"}</td>
                  <td className="admin-datatable-cell tabular-nums">{row.sortOrder}</td>
                  <td className="admin-datatable-cell text-right">
                    <div className="inline-flex justify-end gap-2">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => {
                          setSelectedId(row.id);
                          setForm(mapToForm(row));
                          setError(null);
                        }}
                        className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white"
                      >
                        <PencilSimple size={18} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={deleteM.isPending}
                        onClick={() => {
                          if (confirm(`Delete "${row.name}" language?`)) deleteM.mutate(row.id);
                        }}
                        className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-brand-red shadow-sm transition hover:bg-brand-red hover:text-white disabled:opacity-50"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="admin-panel-card h-fit p-6">
          <h2 className="font-heading text-lg font-bold text-brand-text-dark">
            {editing ? "Edit language" : "Add language"}
          </h2>
          <p className="mt-1 text-xs text-brand-text-muted">Only admins can access and modify these records.</p>

          <div className="mt-4 space-y-3">
            <input
              placeholder="Code (e.g. en)"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
              className="admin-field-quiet w-full px-3 py-2.5"
            />
            <input
              placeholder="Name (e.g. English)"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="admin-field-quiet w-full px-3 py-2.5"
            />
            <input
              placeholder="Native name"
              value={form.nativeName}
              onChange={(e) => setForm((s) => ({ ...s, nativeName: e.target.value }))}
              className="admin-field-quiet w-full px-3 py-2.5"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.direction}
                onChange={(e) => setForm((s) => ({ ...s, direction: e.target.value as "ltr" | "rtl" }))}
                className="admin-field-quiet px-3 py-2.5"
              >
                <option value="ltr">LTR</option>
                <option value="rtl">RTL</option>
              </select>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((s) => ({ ...s, sortOrder: Number(e.target.value || 0) }))}
                className="admin-field-quiet px-3 py-2.5"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-brand-text-dark">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((s) => ({ ...s, isDefault: e.target.checked }))}
              />
              Default language
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-text-dark">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
              />
              Active
            </label>
            {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={createM.isPending || updateM.isPending}
                onClick={submitForm}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.28)] transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Plus size={14} weight="bold" />
                {editing ? "Save changes" : "Add language"}
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setForm(EMPTY_FORM);
                    setError(null);
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-brand-text-dark transition hover:bg-brand-page"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
