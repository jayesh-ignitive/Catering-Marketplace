"use client";

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
      <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
        <p className="text-sm font-semibold">Loading languages…</p>
      </div>
    );
  }

  if (listQ.isError || !listQ.data) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <h1 className="text-lg font-bold">Could not load languages</h1>
        <p className="mt-2 text-sm">Check your connection and admin permissions, then try again.</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1200px] space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Localization</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Languages</h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Code</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Native</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Direction</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Default</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Active</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">Sort</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listQ.data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{row.code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.nativeName || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.direction}</td>
                  <td className="px-4 py-3">{row.isDefault ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{row.isActive ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 tabular-nums">{row.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(row.id);
                          setForm(mapToForm(row));
                          setError(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <PencilSimple size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deleteM.isPending}
                        onClick={() => {
                          if (confirm(`Delete "${row.name}" language?`)) deleteM.mutate(row.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">{editing ? "Edit language" : "Add language"}</h2>
          <p className="mt-1 text-xs text-slate-500">Only admins can access and modify these records.</p>

          <div className="mt-4 space-y-3">
            <input
              placeholder="Code (e.g. en)"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Name (e.g. English)"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Native name"
              value={form.nativeName}
              onChange={(e) => setForm((s) => ({ ...s, nativeName: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.direction}
                onChange={(e) => setForm((s) => ({ ...s, direction: e.target.value as "ltr" | "rtl" }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="ltr">LTR</option>
                <option value="rtl">RTL</option>
              </select>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((s) => ({ ...s, sortOrder: Number(e.target.value || 0) }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((s) => ({ ...s, isDefault: e.target.checked }))}
              />
              Default language
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
              />
              Active
            </label>
            {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={createM.isPending || updateM.isPending}
                onClick={submitForm}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-red px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                <Plus size={14} />
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
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
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
