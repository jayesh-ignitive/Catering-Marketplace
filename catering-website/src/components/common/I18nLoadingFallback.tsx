"use client";

import { useI18n } from "@/context/LocaleContext";

type LoadingVariant =
  | "default"
  | "caterers"
  | "profile"
  | "insights"
  | "workspace"
  | "editor"
  | "dashboard"
  | "wizard"
  | "redirect"
  | "openingSetup";

export function I18nLoadingFallback({ variant = "default" }: { variant?: LoadingVariant }) {
  const { w, ws } = useI18n();

  const label =
    variant === "caterers"
      ? w.common.loadingCaterers
      : variant === "profile"
        ? w.common.loadingProfile
        : variant === "insights"
          ? w.blog.loadingInsights
          : variant === "workspace"
            ? ws.common.loadingWorkspace
            : variant === "editor"
              ? ws.common.loadingEditor
              : variant === "dashboard"
                ? ws.common.loadingDashboard
                : variant === "wizard"
                  ? ws.onboarding.loadingWizard
                  : variant === "redirect"
                    ? ws.common.redirecting
                    : variant === "openingSetup"
                      ? ws.common.openingBusinessSetup
                      : w.common.loading;

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
        aria-hidden
      />
      <p className="mt-4 font-heading text-sm font-semibold text-brand-dark">{label}</p>
    </div>
  );
}
