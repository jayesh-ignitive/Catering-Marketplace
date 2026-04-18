export default function WorkspaceGalleryPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
        Gallery
      </p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
        Photo gallery
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--foreground-muted)]">
        This section will manage images shown on your public caterer page: upload, reorder, captions,
        and publish state. Prefer a dedicated media module and storage (S3, etc.) behind{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-xs text-stone-800">
          /api/caterer/gallery
        </code>
        -style endpoints scoped to the authenticated tenant.
      </p>
      <div className="mt-8 rounded-[var(--radius-xl)] border border-dashed border-stone-300 bg-white/80 p-8 text-center text-sm text-stone-500">
        Uploader and gallery grid placeholder
      </div>
    </div>
  );
}
