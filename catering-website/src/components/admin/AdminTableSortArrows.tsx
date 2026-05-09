"use client";

export type AdminTableSortDir = "asc" | "desc";

type Props = {
  active: boolean;
  sortDir: AdminTableSortDir;
  /** Approximate arrow size (maps to text classes). */
  size?: number;
};

/**
 * Sort glyph using Unicode arrows (↑ ↓): neutral shows both muted;
 * active column highlights the current direction.
 */
export function AdminTableSortArrows({ active, sortDir, size = 14 }: Props) {
  const muted = "text-brand-text-muted/55";
  const ascOn = active && sortDir === "asc";
  const descOn = active && sortDir === "desc";
  const fontClass = size <= 13 ? "text-[13px]" : "text-sm";

  return (
    <span
      className={`inline-flex select-none items-baseline gap-px font-medium tabular-nums leading-none ${fontClass}`}
      aria-hidden
    >
      <span className={`${ascOn ? "font-bold text-brand-red" : muted}`}>↑</span>
      <span className={`${descOn ? "font-bold text-brand-red" : muted}`}>↓</span>
    </span>
  );
}
