"use client";

import type { AuthUser } from "@/lib/auth-api";
import {
  type CatererWorkspaceProfile,
  publishWorkspaceCatererProfile,
} from "@/lib/catering-api";
import {
  ArrowRight,
  ChartLineUp,
  CheckCircle,
  Clock,
  Eye,
  ForkKnife,
  Images,
  ListDashes,
  PaperPlaneRight,
  ShoppingCart,
  Storefront,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  fieldRadius,
  workspaceCardTitleClass,
  workspaceHintTextClass,
} from "./caterer-profile/constants";
import { useI18n } from "@/context/LocaleContext";
import type { WorkspaceMessages } from "@/i18n/workspace.messages";
import { WorkspaceListingPreview } from "./WorkspaceListingPreview";

function listingStatusCopy(
  profile: CatererWorkspaceProfile,
  ws: WorkspaceMessages,
): {
  title: string;
  message: string;
  tone: "live" | "pending" | "rejected" | "draft";
} {
  const s = ws.dashboard.status;
  if (profile.published && profile.approvalStatus === "approved") {
    return { title: s.liveTitle, message: s.liveMessage, tone: "live" };
  }
  if (profile.approvalStatus === "pending_review") {
    return { title: s.pendingTitle, message: s.pendingMessage, tone: "pending" };
  }
  if (profile.approvalStatus === "rejected") {
    return { title: s.rejectedTitle, message: s.rejectedMessage, tone: "rejected" };
  }
  if (profile.completion.isComplete) {
    return { title: s.readyTitle, message: s.readyMessage, tone: "draft" };
  }
  return { title: s.inProgressTitle, message: s.inProgressMessage, tone: "draft" };
}

function StatusIcon({ tone }: { tone: ReturnType<typeof listingStatusCopy>["tone"] }) {
  if (tone === "live") {
    return <CheckCircle className="h-7 w-7 text-[#4CAF50]" weight="fill" aria-hidden />;
  }
  if (tone === "pending") {
    return <Clock className="h-7 w-7 text-amber-600" weight="fill" aria-hidden />;
  }
  if (tone === "rejected") {
    return <XCircle className="h-7 w-7 text-rose-600" weight="fill" aria-hidden />;
  }
  return <WarningCircle className="h-7 w-7 text-brand-red" weight="fill" aria-hidden />;
}

function statusCardClass(tone: ReturnType<typeof listingStatusCopy>["tone"]): string {
  if (tone === "live") return "border-[#4CAF50]/30 bg-[#4CAF50]/8";
  if (tone === "pending") return "border-amber-200 bg-amber-50/80";
  if (tone === "rejected") return "border-rose-200 bg-rose-50/80";
  return "border-stone-200 bg-white";
}

export function WorkspaceDashboard({
  user,
  profile,
  token,
}: {
  user: AuthUser;
  profile: CatererWorkspaceProfile;
  token: string;
}) {
  const { ws, trans } = useI18n();
  const qc = useQueryClient();
  const status = listingStatusCopy(profile, ws);
  const tenantSlug = user.tenant?.slug?.trim().toLowerCase();
  const publicProfileHref = tenantSlug ? `/caterers/${encodeURIComponent(tenantSlug)}` : null;
  const canViewPublic = Boolean(publicProfileHref && profile.published && profile.approvalStatus === "approved");
  const canSubmit =
    profile.completion.isComplete &&
    profile.approvalStatus !== "pending_review" &&
    !(profile.published && profile.approvalStatus === "approved");

  const firstName = user.fullName.split(/\s+/)[0] || user.fullName;
  const businessName =
    user.tenant?.name ?? user.businessName ?? ws.dashboard.yourBusiness;

  /** Top flash banner in layout already covers pending / rejected messaging. */
  const showListingStatusCard =
    profile.approvalStatus !== "pending_review" && profile.approvalStatus !== "rejected";

  const submitM = useMutation({
    mutationFn: () => publishWorkspaceCatererProfile(token),
    onSuccess: async () => {
      toast.success(ws.toast.submitSuccess);
      await qc.invalidateQueries({ queryKey: ["workspace", "profile", token] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="w-full min-w-0 max-w-5xl">
      <div className="mb-8 md:mb-10">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-text-muted">
          {ws.dashboard.welcome}
        </p>
        <h2 className="font-heading mt-2 text-2xl font-bold tracking-tight text-brand-text-dark md:text-3xl">
          {trans(ws.dashboard.welcomeBack, { name: firstName })}
        </h2>
        <p className="mt-2 text-sm text-brand-text-muted">
          {trans(ws.dashboard.subtitle, { business: businessName })}
        </p>
      </div>

      {showListingStatusCard ? (
        <div
          className={`mb-6 overflow-hidden ${fieldRadius} border p-6 shadow-sm sm:p-8 ${statusCardClass(status.tone)}`}
        >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="shrink-0 rounded-full bg-white p-2 shadow-sm ring-1 ring-stone-200/80">
              <StatusIcon tone={status.tone} />
            </div>
            <div>
              <p className={workspaceCardTitleClass}>{status.title}</p>
              <p className={`mt-1 max-w-xl ${workspaceHintTextClass}`}>{status.message}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {canSubmit ? (
              <button
                type="button"
                disabled={submitM.isPending}
                onClick={() => submitM.mutate()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-brand-red px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-red/25 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PaperPlaneRight weight="bold" size={18} aria-hidden />
                {submitM.isPending ? ws.dashboard.submitting : ws.dashboard.submitForReview}
              </button>
            ) : null}
            {canViewPublic && publicProfileHref ? (
              <Link
                href={publicProfileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-stone-200 bg-white px-5 py-2.5 text-sm font-bold text-[#374151] shadow-sm transition hover:border-brand-red/30 hover:text-brand-red"
              >
                <Eye weight="bold" size={18} aria-hidden />
                {ws.dashboard.viewPublicProfile}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      ) : null}

      <div className="admin-panel-card p-6 sm:p-8">
          <h2 className={workspaceCardTitleClass}>{ws.dashboard.quickActions}</h2>
          <p className={`mt-1 ${workspaceHintTextClass}`}>{ws.dashboard.quickActionsHint}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              {
                href: "/workspace/profile",
                label: ws.dashboard.actionProfile,
                hint: ws.dashboard.actionProfileHint,
                icon: Storefront,
              },
              {
                href: "/workspace/menu",
                label: ws.dashboard.actionMenu,
                hint: ws.dashboard.actionMenuHint,
                icon: ForkKnife,
              },
              {
                href: "/workspace/orders",
                label: ws.dashboard.actionOrders,
                hint: ws.dashboard.actionOrdersHint,
                icon: ShoppingCart,
              },
              {
                href: "/workspace/analytics",
                label: ws.dashboard.actionAnalytics,
                hint: ws.dashboard.actionAnalyticsHint,
                icon: ChartLineUp,
              },
              {
                href: "/workspace/profile?tab=business",
                label: ws.dashboard.actionBusinessDetails,
                hint: ws.dashboard.actionBusinessDetailsHint,
                icon: ListDashes,
              },
              {
                href: "/workspace/profile?tab=gallery",
                label: ws.dashboard.actionGallery,
                hint: ws.dashboard.actionGalleryHint,
                icon: Images,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className="group flex h-full cursor-pointer items-center gap-4 rounded-xl border border-gray-100 bg-brand-page/80 px-4 py-4 transition hover:border-brand-red/20 hover:bg-brand-red-light/50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-white text-brand-red shadow-sm ring-1 ring-stone-200/80 group-hover:ring-brand-red/20">
                      <Icon size={22} weight="duotone" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[#232D42] group-hover:text-brand-red">
                        {action.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-brand-text-muted">{action.hint}</span>
                    </span>
                    <ArrowRight
                      className="shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-brand-red"
                      size={18}
                      weight="bold"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/workspace/profile"
            className="mt-6 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-brand-red transition hover:text-red-700"
          >
            {ws.dashboard.openProfileEditor}
            <ArrowRight size={16} weight="bold" aria-hidden />
          </Link>
      </div>

      <WorkspaceListingPreview user={user} profile={profile} />
    </div>
  );
}
