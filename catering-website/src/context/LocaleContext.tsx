"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { trans as formatTrans, type TransVars } from "@/i18n/format";
import { getWebsiteMessages, getWorkspaceMessages } from "@/i18n/get-messages";
import {
  DEFAULT_LOCALE,
  htmlLangForLocale,
  persistLocale,
  readStoredLocale,
  type AppLocale,
} from "@/i18n/locale";
import type { WebsiteMessages } from "@/i18n/website.messages";
import type { WorkspaceMessages } from "@/i18n/workspace.messages";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  w: WebsiteMessages;
  ws: WorkspaceMessages;
  trans: (template: string, vars?: TransVars) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Always start with DEFAULT_LOCALE so SSR and the first client render match.
  // Stored locale is applied in useEffect after hydration (avoids mismatch errors).
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = htmlLangForLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const w = getWebsiteMessages(locale);
    const ws = getWorkspaceMessages(locale);
    return {
      locale,
      setLocale,
      w,
      ws,
      trans: formatTrans,
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return ctx;
}
