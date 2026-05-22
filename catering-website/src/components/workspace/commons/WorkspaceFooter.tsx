"use client";

import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useI18n } from "@/context/LocaleContext";
import Link from "next/link";

export function WorkspaceFooter() {
  const { ws } = useI18n();

  return (
    <footer className="shrink-0 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm md:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs text-brand-text-muted">{ws.footer.tagline}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-brand-text-dark">
          <Link href="/privacy" className="transition-colors hover:text-brand-red">
            {ws.footer.privacy}
          </Link>
          <Link href="/terms" className="transition-colors hover:text-brand-red">
            {ws.footer.terms}
          </Link>
          <Link href="/" className="transition-colors hover:text-brand-red">
            {ws.footer.publicSite}
          </Link>
        </nav>
        <LanguageSwitcher variant="inline" className="w-full sm:w-auto" />
      </div>
    </footer>
  );
}
