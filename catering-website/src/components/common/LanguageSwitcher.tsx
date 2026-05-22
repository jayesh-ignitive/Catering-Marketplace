"use client";

import { LOCALE_OPTIONS, type AppLocale } from "@/i18n/locale";
import { useI18n } from "@/context/LocaleContext";

type LanguageSwitcherProps = {
  className?: string;
  /** Compact row for footer bar */
  variant?: "footer" | "inline";
};

export function LanguageSwitcher({ className = "", variant = "footer" }: LanguageSwitcherProps) {
  const { locale, setLocale, w } = useI18n();

  return (
    <div
      className={
        variant === "footer"
          ? `flex flex-col items-center gap-2 sm:flex-row sm:items-center ${className}`
          : `flex flex-wrap items-center gap-2 ${className}`
      }
    >
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {w.locale.language}
      </span>
      <div
        className="flex flex-wrap justify-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1"
        role="group"
        aria-label={w.locale.selectLanguage}
      >
        {LOCALE_OPTIONS.map((opt) => {
          const active = locale === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLocale(opt.code as AppLocale)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-yellow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111] ${
                active
                  ? "bg-brand-red text-white shadow-sm"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
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
