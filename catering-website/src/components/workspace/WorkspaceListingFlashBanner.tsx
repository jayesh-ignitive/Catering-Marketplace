"use client";

import { useI18n } from "@/context/LocaleContext";
import type { WorkspaceMessages } from "@/i18n/workspace.messages";
import type { CatererWorkspaceProfile } from "@/lib/catering-api";
import { Clock, Info, XCircle } from "@phosphor-icons/react";
import Link from "next/link";

type FlashVariant = "pending_review" | "rejected";

function flashContent(
  variant: FlashVariant,
  submittedForReviewAt: string | null,
  ws: WorkspaceMessages,
  trans: (template: string, vars?: Record<string, string | number>) => string,
): { title: string; body: string } {
  if (variant === "rejected") {
    return {
      title: ws.flashBanner.rejectedTitle,
      body: ws.flashBanner.rejectedBody,
    };
  }
  const submittedLine =
    submittedForReviewAt &&
    trans(ws.flashBanner.pendingBodyPrefix, {
      date: new Date(submittedForReviewAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });
  return {
    title: ws.flashBanner.pendingTitle,
    body: `${submittedLine ?? ""}${ws.flashBanner.pendingBody}`,
  };
}

export function WorkspaceListingFlashBanner({
  profile,
  size = "default",
}: {
  profile: CatererWorkspaceProfile | null | undefined;
  size?: "default" | "prominent";
}) {
  const { ws, trans } = useI18n();

  if (!profile) return null;

  const variant: FlashVariant | null =
    profile.approvalStatus === "pending_review"
      ? "pending_review"
      : profile.approvalStatus === "rejected"
        ? "rejected"
        : null;

  if (!variant) return null;

  const copy = flashContent(variant, profile.submittedForReviewAt, ws, trans);
  const isProminent = size === "prominent";
  const isPending = variant === "pending_review";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`border-b ${
        isPending
          ? "border-amber-200/80 bg-gradient-to-r from-amber-50 via-amber-50/95 to-amber-100/60"
          : "border-rose-200/80 bg-gradient-to-r from-rose-50 via-rose-50/95 to-rose-100/60"
      } ${isProminent ? "px-4 py-5 md:px-8 md:py-6" : "px-4 py-3.5 md:px-8"}`}
    >
      <div
        className={`mx-auto flex w-full max-w-5xl gap-4 ${isProminent ? "items-start sm:items-center" : "items-center"}`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-sm shadow-sm ring-1 ${
            isProminent ? "h-12 w-12" : "h-10 w-10"
          } ${
            isPending
              ? "bg-white text-amber-600 ring-amber-200/80"
              : "bg-white text-rose-600 ring-rose-200/80"
          }`}
        >
          {isPending ? (
            <Clock className={isProminent ? "h-6 w-6" : "h-5 w-5"} weight="fill" aria-hidden />
          ) : (
            <XCircle className={isProminent ? "h-6 w-6" : "h-5 w-5"} weight="fill" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-bold text-[#232D42] ${isProminent ? "text-base sm:text-lg" : "text-sm"}`}>
            {copy.title}
          </p>
          <p className={`mt-1 leading-relaxed text-[#6B7280] ${isProminent ? "text-sm sm:text-base" : "text-sm"}`}>
            {copy.body}
          </p>
          {isProminent && variant === "rejected" ? (
            <Link
              href="/workspace/profile"
              className="mt-3 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-brand-red transition hover:text-red-700"
            >
              {ws.flashBanner.updateListing}
              <Info size={16} weight="bold" aria-hidden />
            </Link>
          ) : null}
        </div>
        {isPending ? (
          <span
            className={`hidden shrink-0 rounded-sm border border-amber-300/60 bg-white/90 font-bold uppercase tracking-wider text-amber-800 shadow-sm sm:inline-flex ${
              isProminent ? "px-4 py-2 text-xs" : "px-3 py-1.5 text-[10px]"
            }`}
          >
            {ws.flashBanner.awaitingApproval}
          </span>
        ) : null}
      </div>
    </div>
  );
}
