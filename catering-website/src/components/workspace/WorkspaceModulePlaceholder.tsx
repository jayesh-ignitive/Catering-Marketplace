"use client";

import { useI18n } from "@/context/LocaleContext";
import type { Icon } from "@phosphor-icons/react";
import { Crown } from "@phosphor-icons/react";
import { trans } from "@/i18n";
import { publicSiteConfig } from "@/lib/site-config";
import Link from "next/link";

type WorkspaceModulePlaceholderProps = {
  title: string;
  description: string;
  icon: Icon;
  variant?: "comingSoon" | "premium";
  primaryHref?: string;
  primaryLabel?: string;
};

export function WorkspaceModulePlaceholder({
  title,
  description,
  icon: Icon,
  variant = "comingSoon",
  primaryHref = "/workspace/profile",
  primaryLabel,
}: WorkspaceModulePlaceholderProps) {
  const { ws, trans } = useI18n();
  const resolvedPrimaryLabel = primaryLabel ?? ws.common.goToProfile;

  if (variant === "premium") {
    const contactSubject = encodeURIComponent(`Premium workspace — ${title}`);
    const mailtoHref = `mailto:${encodeURIComponent(publicSiteConfig.contactEmail)}?subject=${contactSubject}`;

    return (
      <div className="admin-panel-card mx-auto w-full max-w-2xl overflow-hidden p-8 text-center md:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/80">
          <Icon size={28} weight="duotone" aria-hidden />
        </span>
        <span className="mx-auto mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-900 ring-1 ring-amber-200/80">
          <Crown size={14} weight="fill" aria-hidden />
          {ws.common.premium}
        </span>
        <h2 className="font-heading mt-4 text-xl font-bold text-brand-text-dark">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">{description}</p>
        <p className="mt-4 text-sm font-semibold text-brand-text-dark">
          {ws.modules.premiumIncluded}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-brand-red px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-red/20 transition hover:bg-red-700 sm:w-auto"
          >
            {ws.modules.contactForPremium}
          </Link>
          <a
            href={mailtoHref}
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-brand-text-dark transition hover:bg-brand-page sm:w-auto"
          >
            {trans(ws.modules.email, { email: publicSiteConfig.contactEmail })}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-card mx-auto w-full max-w-2xl p-8 text-center md:p-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red-light text-brand-red">
        <Icon size={28} weight="duotone" aria-hidden />
      </span>
      <h2 className="font-heading mt-6 text-xl font-bold text-brand-text-dark">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-brand-text-muted">{description}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
        {ws.common.comingSoon}
      </p>
      <Link
        href={primaryHref}
        className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-xl bg-brand-red px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-red/20 transition hover:bg-red-700"
      >
        {resolvedPrimaryLabel}
      </Link>
    </div>
  );
}
