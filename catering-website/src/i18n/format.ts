import type { AppLocale } from "./locale";

export type TransVars = Record<string, string | number | null | undefined>;

const DATE_LOCALE: Record<AppLocale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  gu: "gu-IN",
};

/** BCP 47 locale for `Date` formatting (India region). */
export function dateLocaleFor(locale: AppLocale): string {
  return DATE_LOCALE[locale];
}

/** Locale-aware date for blog cards, reviews, etc. (dynamic ISO strings only). */
export function formatLocaleDate(
  iso: string,
  locale: AppLocale,
  style: "short" | "long" = "short",
): string {
  try {
    return new Date(iso).toLocaleDateString(DATE_LOCALE[locale], {
      day: "numeric",
      month: style === "long" ? "long" : "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function interpolate(template: string, vars: TransVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value === null || value === undefined ? `{${key}}` : String(value);
  });
}

/**
 * Translate a message template and replace `{key}` placeholders.
 * Pass a string from `websiteMessages` / `workspaceMessages` (or a future locale file).
 *
 * @example
 * import { trans, workspaceMessages as ws } from "@/i18n";
 *
 * trans(ws.dashboard.welcomeBack, { name: "Priya" });
 * // → "Welcome back, Priya"
 *
 * trans(ws.dashboard.welcome);
 * // → "Welcome"
 */
export function trans(template: string): string;
export function trans(template: string, vars: TransVars): string;
export function trans(template: string, vars?: TransVars): string {
  if (!vars) return template;
  return interpolate(template, vars);
}

/** @deprecated Use `trans` instead */
export const formatMessage = trans;
