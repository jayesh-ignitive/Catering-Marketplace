"use client";

import { CaretDown, Globe } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { LOCALE_OPTIONS, type AppLocale } from "@/i18n/locale";
import { useI18n } from "@/context/LocaleContext";

type LanguageSwitcherProps = {
  className?: string;
  /** Compact row for footer bar */
  variant?: "footer" | "inline" | "header";
  onSelect?: () => void;
};

export function LanguageSwitcher({
  className = "",
  variant = "footer",
  onSelect,
}: LanguageSwitcherProps) {
  const { locale, setLocale, w } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = LOCALE_OPTIONS.find((opt) => opt.code === locale) ?? LOCALE_OPTIONS[0]!;

  useEffect(() => {
    if (!open || variant !== "header") return;
    function onDocMouseDown(e: MouseEvent) {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, variant]);

  const pickLocale = (code: AppLocale) => {
    setLocale(code);
    setOpen(false);
    onSelect?.();
  };

  if (variant === "header") {
    const others = LOCALE_OPTIONS.filter((opt) => opt.code !== locale);

    return (
      <div ref={wrapRef} className={`relative shrink-0 ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`${w.locale.selectLanguage}: ${current.label}`}
          className={`group inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white pl-2 pr-2.5 shadow-sm transition-all duration-300 hover:border-brand-red hover:shadow-md focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/35 focus-visible:ring-offset-2 ${
            open ? "border-brand-red shadow-md ring-2 ring-brand-red/10" : ""
          }`}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-50 text-brand-red transition group-hover:bg-brand-red/10">
            <Globe className="size-4" weight="duotone" aria-hidden />
          </span>
          <span
            lang={current.code}
            className="min-w-[1.25rem] text-xs font-bold uppercase tracking-wider text-brand-dark"
          >
            {current.code}
          </span>
          <CaretDown
            className={`size-3.5 shrink-0 text-gray-400 transition-transform duration-200 group-hover:text-brand-red ${open ? "rotate-180 text-brand-red" : ""}`}
            aria-hidden
          />
        </button>
        {open ? (
          <ul
            role="listbox"
            aria-label={w.locale.selectLanguage}
            className="absolute right-0 top-full z-[60] mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white p-1 shadow-xl shadow-gray-200/60"
          >
            {others.map((opt) => (
              <li key={opt.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => pickLocale(opt.code)}
                  lang={opt.code}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-[10px] font-bold uppercase tracking-wide text-brand-red">
                    {opt.code}
                  </span>
                  <span className="text-sm font-semibold text-brand-dark">{opt.nativeLabel}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  const isDarkShell = variant === "footer";

  return (
    <div
      className={
        variant === "footer"
          ? `flex flex-col items-center gap-2 sm:flex-row sm:items-center ${className}`
          : `flex flex-wrap items-center gap-2 ${className}`
      }
    >
      <span
        className={
          isDarkShell
            ? "text-xs font-bold uppercase tracking-wider text-gray-400"
            : "text-xs font-bold uppercase tracking-wider text-[#6B7280]"
        }
      >
        {w.locale.language}
      </span>
      <div
        className={
          isDarkShell
            ? "flex flex-wrap justify-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1"
            : "flex flex-wrap justify-center gap-1 rounded-sm border border-[#E5E7EB] bg-[#F9FAFB] p-1"
        }
        role="group"
        aria-label={w.locale.selectLanguage}
      >
        {LOCALE_OPTIONS.map((opt) => {
          const active = locale === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => pickLocale(opt.code)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/35 focus-visible:ring-offset-2 ${
                active
                  ? "bg-brand-red text-white shadow-sm"
                  : isDarkShell
                    ? "text-gray-300 hover:bg-white/10 hover:text-white focus-visible:ring-offset-[#111]"
                    : "text-[#374151] hover:bg-white hover:text-brand-red focus-visible:ring-offset-white"
              }`}
              aria-pressed={active}
              lang={opt.code}
            >
              {opt.nativeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
