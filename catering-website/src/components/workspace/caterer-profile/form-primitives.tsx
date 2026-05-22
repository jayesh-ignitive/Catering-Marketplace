"use client";

import { useI18n } from "@/context/LocaleContext";
import { trans } from "@/i18n";
import { workspaceLabelTextClass } from "./constants";

export function InputLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={`mb-1.5 block ${workspaceLabelTextClass}`}>
      {children}
    </label>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-brand-red" role="alert">
      {message}
    </p>
  );
}

/** Spinner + bar overlay for workspace banner/gallery uploads. */
export function ImageUploadProgressOverlay({
  percent,
  label,
}: {
  percent: number;
  label?: string;
}) {
  const { ws, trans: t } = useI18n();
  const clamped = Math.min(100, Math.max(0, percent));
  const defaultLabel = label ?? ws.select.uploading;
  const ariaLabel = t(ws.select.uploadingPercent, { percent: clamped });

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-white/40 border-t-white"
        aria-hidden
      />
      <p className="mt-3 text-center text-sm font-semibold text-white">{defaultLabel}</p>
      <div className="mt-3 h-1.5 w-full max-w-[10rem] overflow-hidden rounded-full bg-white/25">
        <div
          className="h-full rounded-full bg-brand-red transition-[width] duration-150 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs font-bold tabular-nums text-white">{clamped}%</p>
    </div>
  );
}

export function ChoiceChip({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-sm border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1 sm:w-auto sm:min-w-[11rem] ${
        selected
          ? "border-brand-red bg-red-50 text-brand-red"
          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-brand-red/60"
      }`}
    >
      <span className="text-sm font-semibold">{title}</span>
      {subtitle ? <span className="text-xs font-normal text-[#6B7280]">{subtitle}</span> : null}
    </button>
  );
}

export function ToggleChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`cursor-pointer rounded-sm border px-3.5 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1 ${
        selected
          ? "border-brand-red bg-red-50 text-brand-red"
          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-brand-red/60"
      }`}
    >
      {children}
    </button>
  );
}
