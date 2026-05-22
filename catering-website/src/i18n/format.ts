export type TransVars = Record<string, string | number | null | undefined>;

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
