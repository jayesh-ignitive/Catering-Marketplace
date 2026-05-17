"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminModal, AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  createAdminBlogPost,
  deleteAdminBlogPost,
  fetchAdminBlogPosts,
  type AdminBlogPostItem,
  updateAdminBlogPost,
} from "@/lib/admin-api";
import { uploadCateringImage } from "@/lib/catering-api";
import { BLOG_QUERY_KEY, revalidateBlogCache } from "@/lib/blog";
import { seoConfig } from "@/lib/seo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, PencilSimple, Plus, Trash, UploadSimple } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

type FormState = {
  title: string;
  slug: string;
  metaTitle: string;
  excerpt: string;
  metaDescription: string;
  bodyHtml: string;
  categoryLabel: string;
  featuredImageKey: string;
  featuredPreview: string;
  ogImageKey: string;
  ogPreview: string;
  publishedAtLocal: string;
  isPublished: boolean;
};

function slugify(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function nowDatetimeLocal(): string {
  return toDatetimeLocal(new Date().toISOString());
}

const EMPTY: FormState = {
  title: "",
  slug: "",
  metaTitle: "",
  excerpt: "",
  metaDescription: "",
  bodyHtml: "<p></p>",
  categoryLabel: "Insights",
  featuredImageKey: "",
  featuredPreview: "",
  ogImageKey: "",
  ogPreview: "",
  publishedAtLocal: nowDatetimeLocal(),
  isPublished: true,
};

function toForm(row: AdminBlogPostItem): FormState {
  return {
    title: row.title,
    slug: row.slug,
    metaTitle: row.metaTitle ?? "",
    excerpt: row.excerpt,
    metaDescription: row.metaDescription ?? "",
    bodyHtml: row.bodyHtml,
    categoryLabel: row.categoryLabel,
    featuredImageKey: row.featuredImageUrl ?? "",
    featuredPreview: row.featuredImageResolved ?? "",
    ogImageKey: row.ogImageUrl ?? "",
    ogPreview: row.ogImageResolved ?? "",
    publishedAtLocal: toDatetimeLocal(row.publishedAt),
    isPublished: row.isPublished,
  };
}

function SeoPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  const displayTitle = title.trim() || "Post title";
  const displayDesc = description.trim() || "Meta description preview…";
  const url = `${seoConfig.baseUrl.replace(/\/$/, "")}/blog/${slug.trim() || "your-slug"}`;
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Search preview</p>
      <p className="truncate text-sm text-[#1a0dab]">{displayTitle}</p>
      <p className="truncate text-xs text-[#006621]">{url}</p>
      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{displayDesc}</p>
    </div>
  );
}

export default function AdminBlogPostsPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const featuredRef = useRef<HTMLInputElement>(null);
  const ogRef = useRef<HTMLInputElement>(null);

  const listQ = useQuery({
    queryKey: ["admin", "blog-posts", token],
    queryFn: () => fetchAdminBlogPosts(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const seoPreview = useMemo(() => {
    const title = form.metaTitle.trim() || form.title.trim();
    const description = form.metaDescription.trim() || form.excerpt.trim();
    return { title, description };
  }, [form.metaTitle, form.title, form.metaDescription, form.excerpt]);

  const invalidate = async (slug?: string) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["admin", "blog-posts"] }),
      qc.invalidateQueries({ queryKey: BLOG_QUERY_KEY }),
    ]);
    await revalidateBlogCache(slug);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY, publishedAtLocal: nowDatetimeLocal() });
    setOpen(true);
  };

  const openEdit = (row: AdminBlogPostItem) => {
    setEditingId(row.id);
    setForm(toForm(row));
    setOpen(true);
  };

  const uploadImage = async (file: File, target: "featured" | "og") => {
    if (!token) return;
    const setBusy = target === "featured" ? setUploadingFeatured : setUploadingOg;
    setBusy(true);
    try {
      const { url, key } = await uploadCateringImage(token, file, "gallery");
      if (target === "featured") {
        setForm((f) => ({ ...f, featuredImageKey: key, featuredPreview: url }));
      } else {
        setForm((f) => ({ ...f, ogImageKey: key, ogPreview: url }));
      }
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not signed in");
      const slug = form.slug.trim() || slugify(form.title);
      if (!slug) throw new Error("Title or slug required");
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.excerpt.trim()) throw new Error("Excerpt is required");
      if (!form.bodyHtml.trim()) throw new Error("Body is required");

      const publishedAt = new Date(form.publishedAtLocal).toISOString();
      const payload = {
        title: form.title.trim(),
        slug,
        metaTitle: form.metaTitle.trim() || null,
        excerpt: form.excerpt.trim(),
        metaDescription: form.metaDescription.trim() || null,
        bodyHtml: form.bodyHtml,
        categoryLabel: form.categoryLabel.trim() || "Insights",
        featuredImageUrl: form.featuredImageKey.trim() || null,
        ogImageUrl: form.ogImageKey.trim() || null,
        publishedAt,
        isPublished: form.isPublished,
      };

      if (editingId) {
        return updateAdminBlogPost(token, editingId, payload);
      }
      return createAdminBlogPost(token, payload);
    },
    onSuccess: async (row) => {
      toast.success(editingId ? "Post updated" : "Post created");
      await invalidate(row.slug);
      closeModal();
    },
    onError: (e: Error) => toast.error(e.message || "Could not save post"),
  });

  const deleteM = useMutation({
    mutationFn: (row: AdminBlogPostItem) => deleteAdminBlogPost(token!, row.id),
    onSuccess: async (_, row) => {
      toast.success("Post deleted");
      await invalidate(row.slug);
    },
    onError: () => toast.error("Could not delete post"),
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[{ label: "Admin", href: "/admin" }, { label: "Blog posts" }]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark">Blog posts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage insights articles with per-post SEO (title, description, Open Graph image). Drafts stay hidden
            until published.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          <Plus weight="bold" aria-hidden />
          New post
        </button>
      </div>

      {listQ.isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : listQ.isError ? (
        <p className="text-sm text-red-600">Could not load posts.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(listQ.data ?? []).map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80">
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate font-semibold text-brand-dark">{row.title}</p>
                    <p className="truncate text-xs text-gray-400">{row.seoTitle}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.slug}</td>
                  <td className="px-4 py-3">{row.categoryLabel}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(row.publishedAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        row.isPublished
                          ? "bg-brand-green/15 text-brand-green"
                          : "bg-gray-100 text-gray-500",
                      ].join(" ")}
                    >
                      {row.isPublished ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {row.isPublished ? (
                        <Link
                          href={`/blog/${row.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-brand-red hover:text-brand-red"
                          aria-label="View live"
                        >
                          <Eye aria-hidden />
                        </Link>
                      ) : null}
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
                          if (window.confirm(`Delete "${row.title}"?`)) deleteM.mutate(row);
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
              {(listQ.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No posts yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={open}
        size="lg"
        title={editingId ? "Edit blog post" : "New blog post"}
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
              disabled={saveM.isPending || uploadingFeatured || uploadingOg}
              onClick={() => saveM.mutate()}
              className="cursor-pointer rounded-lg bg-brand-red px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saveM.isPending ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="grid max-h-[70vh] gap-5 overflow-y-auto pr-1 lg:grid-cols-2">
          <div className="space-y-4">
            <AdminModalField label="Title *">
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    slug: editingId ? f.slug : slugify(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              />
            </AdminModalField>
            <AdminModalField label="URL slug *">
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm outline-none focus:border-brand-red"
              />
            </AdminModalField>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminModalField label="Category label">
                <input
                  value={form.categoryLabel}
                  onChange={(e) => setForm((f) => ({ ...f, categoryLabel: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
                />
              </AdminModalField>
              <AdminModalField label="Publish date *">
                <input
                  type="datetime-local"
                  value={form.publishedAtLocal}
                  onChange={(e) => setForm((f) => ({ ...f, publishedAtLocal: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
                />
              </AdminModalField>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
              />
              <span className="text-sm text-gray-600">Published (visible on site &amp; sitemap)</span>
            </label>
            <AdminModalField label="Excerpt *">
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={3}
                maxLength={500}
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              />
              <p className="mt-1 text-right text-[10px] text-gray-400">{form.excerpt.length}/500</p>
            </AdminModalField>
            <AdminModalField label="Body HTML *">
              <textarea
                value={form.bodyHtml}
                onChange={(e) => setForm((f) => ({ ...f, bodyHtml: e.target.value }))}
                rows={10}
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs outline-none focus:border-brand-red"
              />
            </AdminModalField>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading text-sm font-bold text-brand-dark">SEO</h3>
            <AdminModalField label={`Meta title (${seoPreview.title.length}/70)`}>
              <input
                value={form.metaTitle}
                onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                placeholder={form.title || "Defaults to post title"}
                maxLength={70}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              />
            </AdminModalField>
            <AdminModalField label={`Meta description (${seoPreview.description.length}/320)`}>
              <textarea
                value={form.metaDescription}
                onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                placeholder="Defaults to excerpt"
                rows={3}
                maxLength={320}
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red"
              />
            </AdminModalField>
            <SeoPreview
              title={seoPreview.title}
              description={seoPreview.description}
              slug={form.slug}
            />

            <AdminModalField label="Featured image">
              <ImageUploadBox
                preview={form.featuredPreview}
                uploading={uploadingFeatured}
                inputRef={featuredRef}
                onPick={(f) => void uploadImage(f, "featured")}
              />
            </AdminModalField>
            <AdminModalField label="OG image (optional)">
              <p className="mb-2 text-xs text-gray-500">Social share image. Falls back to featured image.</p>
              <ImageUploadBox
                preview={form.ogPreview}
                uploading={uploadingOg}
                inputRef={ogRef}
                onPick={(f) => void uploadImage(f, "og")}
              />
            </AdminModalField>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

function ImageUploadBox({
  preview,
  uploading,
  inputRef,
  onPick,
}: {
  preview: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (file: File) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className="relative flex min-h-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-3 hover:border-brand-red/30"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      {preview ? (
        <Image src={preview} alt="" fill className="object-cover" sizes="200px" />
      ) : (
        <span className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <UploadSimple className="text-brand-red" aria-hidden />
          Upload image
        </span>
      )}
      {uploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs font-semibold">
          Uploading…
        </div>
      ) : null}
    </div>
  );
}
