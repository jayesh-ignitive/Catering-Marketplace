export default function WorkspaceBusinessPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
        Business
      </p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
        Business profile
      </h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--foreground-muted)]">
        This section will hold your public-facing business details: description, service areas, contact
        preferences, and offerings. Wire it to tenant-scoped API routes (e.g.{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-xs text-stone-800">
          PATCH /api/caterer/profile
        </code>
        ) when the backend exposes them.
      </p>
      <div className="mt-8 rounded-[var(--radius-xl)] border border-dashed border-stone-300 bg-white/80 p-8 text-center text-sm text-stone-500">
        Form and API integration placeholder
      </div>
    </div>
  );
}
