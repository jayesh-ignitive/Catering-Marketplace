"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminModal, AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminHomeBanner,
  deleteAdminHomeBanner,
  fetchAdminHomeBanners,
  type AdminHomeBannerItem,
  updateAdminHomeBanner,
} from "@/lib/admin-api";
import { uploadCateringImage } from "@/lib/catering-api";
import {
  HOME_BANNERS_QUERY_KEY,
  revalidateHomeBannersCache,
} from "@/lib/home-banners";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilSimple, Plus, Trash, UploadSimple } from "@phosphor-icons/react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

type FormState = {
  title: string;
  subtitle: string;
  imageKey: string;
  imagePreviewUrl: string;
  linkHref: string;
  linkLabel: string;
  displayOrder: number;
  isActive: boolean;
};

const EMPTY: FormState = {
  title: "",
  subtitle: "",
  imageKey: "",
  imagePreviewUrl: "",
  linkHref: "",
  linkLabel: "",
  displayOrder: 0,
  isActive: true,
};

function toForm(row: AdminHomeBannerItem): FormState {
  return {
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    imageKey: row.imageKey,
    imagePreviewUrl: row.imageUrl,
    linkHref: row.linkHref ?? "",
    linkLabel: row.linkLabel ?? "",
    displayOrder: row.displayOrder,
    isActive: row.isActive,
  };
}

export default function AdminHomeBannersPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const listQ = useQuery({
    queryKey: ["admin", "home-banners", token],
    queryFn: () => fetchAdminHomeBanners(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const slides = useMemo(
    () => [...(listQ.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
    [listQ.data],
  );

  const nextDisplayOrder = useMemo(() => {
    if (slides.length === 0) return 0;
    return Math.max(...slides.map((s) => s.displayOrder)) + 1;
  }, [slides]);

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "home-banners"] }),
      qc.invalidateQueries({ queryKey: HOME_BANNERS_QUERY_KEY }),
    ]);
    await revalidateHomeBannersCache();
  };

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY, displayOrder: nextDisplayOrder });
    setOpen(true);
  };

  const openEdit = (row: AdminHomeBannerItem) => {
    setEditingId(row.id);
    setForm(toForm(row));
    setOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!token) return;
    setUploading(true);
    try {
      const { url, key } = await uploadCateringImage(token, file, "home");
      setForm((f) => ({ ...f, imageKey: key, imagePreviewUrl: url }));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not signed in");
      if (!form.imageKey.trim()) throw new Error("Upload a slide image");
      const payload = {
        title: form.title.trim() || null,
        subtitle: form.subtitle.trim() || null,
        imageKey: form.imageKey.trim(),
        linkHref: form.linkHref.trim() || null,
        linkLabel: form.linkLabel.trim() || null,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      };
      if (editingId) {
        return updateAdminHomeBanner(token, editingId, payload);
      }
      return createAdminHomeBanner(token, payload);
    },
    onSuccess: async () => {
      toast.success(editingId ? "Slide updated" : "Slide added");
      await invalidate();
      closeModal();
    },
    onError: (e: Error) => toast.error(e.message || "Could not save slide"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteAdminHomeBanner(token!, id),
    onSuccess: async () => {
      toast.success("Slide removed");
      await invalidate();
    },
    onError: () => toast.error("Could not delete slide"),
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Home hero" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark">Home hero slides</h1>
          <p className="mt-1 text-sm text-gray-500">
            Images for the home page hero carousel (first section). Add multiple slides; they rotate every 8
            seconds. Use display order to control sequence.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          <Plus weight="bold" aria-hidden />
          Add slide
        </button>
      </div>

      {listQ.isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : listQ.isError ? (
        <p className="text-sm text-red-600">Could not load slides.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slides.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-gray-100">
                      <Image src={row.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-gray-600">
                    {row.title || "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.displayOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        row.isActive ? "bg-brand-green/15 text-brand-green" : "bg-gray-100 text-gray-500",
                      ].join(" ")}
                    >
                      {row.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-brand-red hover:text-brand-red"
                        aria-label="Edit"
                      >
                        <PencilSimple aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Delete this slide?")) deleteM.mutate(row.id);
                        }}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {slides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    <p>No hero slides yet.</p>
                    <p className="mt-2 text-xs">
                      Click <strong className="text-brand-dark">Add slide</strong>, upload an image, and save with{" "}
                      <strong className="text-brand-dark">Active</strong> checked. The home page loads slides from here;
                      if none are active, it uses a default stock photo instead.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={open}
        title={editingId ? "Edit slide" : "Add slide"}
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saveM.isPending || uploading}
              onClick={() => saveM.mutate()}
              className="cursor-pointer rounded-lg bg-brand-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saveM.isPending ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <AdminModalField label="Slide image *">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
              }}
              className="relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center hover:border-brand-red/40"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                  e.target.value = "";
                }}
              />
              {form.imagePreviewUrl ? (
                <Image
                  src={form.imagePreviewUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              ) : (
                <>
                  <UploadSimple className="mb-2 text-2xl text-brand-red" aria-hidden />
                  <p className="text-sm font-semibold text-brand-dark">Click to upload</p>
                  <p className="mt-1 text-xs text-gray-500">JPEG, PNG, WebP or GIF · max 5 MB</p>
                </>
              )}
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-semibold">
                  Uploading…
                </div>
              ) : null}
            </div>
          </AdminModalField>

          <AdminModalField label="Title (optional, alt text)">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              maxLength={160}
            />
          </AdminModalField>

          <AdminModalField label="Subtitle (optional)">
            <input
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              maxLength={255}
            />
          </AdminModalField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminModalField label="Display order">
              <input
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              />
            </AdminModalField>
            <AdminModalField label="Active">
              <label className="mt-2 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="text-sm text-gray-600">Show in hero carousel</span>
              </label>
            </AdminModalField>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

