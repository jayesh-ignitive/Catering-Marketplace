export const APP_LOCALES = ["en", "hi", "gu"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_STORAGE_KEY = "bharat-catering-locale";

export type LocaleOption = {
  code: AppLocale;
  /** Shown in the footer language control */
  label: string;
  nativeLabel: string;
};

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
] as const;

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}

export function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isAppLocale(raw) ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function persistLocale(locale: AppLocale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === "en" ? "en" : locale;
  } catch {
    /* ignore quota / private mode */
  }
}

/** BCP 47 lang for `<html lang>` */
export function htmlLangForLocale(locale: AppLocale): string {
  if (locale === "hi") return "hi";
  if (locale === "gu") return "gu";
  return "en";
}
