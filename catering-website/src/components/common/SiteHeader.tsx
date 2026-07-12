"use client";

import { CaretDown, List, MagnifyingGlass, SignIn, SignOut, UserCircle, X } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BrandLogoLink } from "@/components/common/BrandLogoLink";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { profileHref, UserAccountMenu } from "@/components/common/UserAccountMenu";
import type { ServiceCategory } from "@/lib/catering-api";
import { serviceCategoriesQueryOptions } from "@/lib/catalog-queries";
import { caterersListingPath } from "@/lib/caterers-url";
import { publicSiteConfig } from "@/lib/site-config";
import {
  getCategoryIconHoverClasses,
  getCategoryIconWrapBase,
  getServiceCategoryIcon,
} from "@/lib/service-category-icons";
import { useI18n } from "@/context/LocaleContext";
import { useState } from "react";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase() || "?";
}

/** Circular icon actions (search, log in) — matches hover/focus affordance */
const headerIconActionClass =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-brand-dark shadow-sm transition-all duration-300 hover:scale-110 hover:border-brand-red hover:bg-brand-red hover:text-white focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/35 focus-visible:ring-offset-2";

function headerTitleHoverClass(titleHoverClass: string): string {
  return titleHoverClass.replace(/group-hover:/g, "group-hover/link:");
}

function HeaderCategoryLink({
  cat,
  onNavigate,
}: {
  cat: ServiceCategory;
  onNavigate?: () => void;
}) {
  const Icon = getServiceCategoryIcon(cat.iconKey);
  return (
    <Link
      href={caterersListingPath({ categorySlug: cat.slug })}
      className="group/link flex items-center gap-3 rounded-md px-4 py-3 transition hover:bg-gray-50"
      onClick={onNavigate}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded transition ${getCategoryIconWrapBase(cat.iconWrapClass)} ${getCategoryIconHoverClasses(cat.iconWrapClass)}`}
      >
        <Icon weight="fill" className="text-lg" aria-hidden />
      </div>
      <span
        className={`font-heading font-semibold text-brand-dark transition-colors ${headerTitleHoverClass(cat.titleHoverClass)}`}
      >
        {cat.name}
      </span>
    </Link>
  );
}

export function SiteHeader({
  prefetchedCategories,
}: {
  prefetchedCategories?: ServiceCategory[];
}) {
  const { w, trans, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const { user, ready, logout } = useAuth();
  const categoriesQ = useQuery(
    serviceCategoriesQueryOptions(locale, prefetchedCategories),
  );
  const categories = categoriesQ.data ?? [];

  return (
    <>
      <div className="flex items-center justify-between bg-black px-6 py-2 text-[11px] font-medium tracking-wide text-gray-300">
        <div>
          {trans(w.header.salesSupportLine, { phone: publicSiteConfig.supportPhoneDisplay })}
        </div>
        <div className="hidden sm:block">{w.header.tagline}</div>
      </div>

      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5">
          <BrandLogoLink preset="siteHeader" onClick={() => setOpen(false)} />

          <nav className="hidden items-center md:flex">
            <div className="group relative flex cursor-pointer flex-col border-l border-gray-200 px-6">
              <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                {w.header.cateringServices}
              </span>
              <div className="font-heading flex items-center gap-1 font-medium text-brand-dark transition group-hover:text-brand-red">
                {w.header.serviceCategories}{" "}
                <CaretDown
                  className="text-sm text-gray-400 transition-transform duration-300 group-hover:rotate-180 group-hover:text-brand-red"
                  aria-hidden
                />
              </div>
              <div className="invisible absolute left-0 top-full z-50 mt-4 max-h-[min(24rem,70vh)] w-72 translate-y-2 overflow-hidden overflow-y-auto rounded-lg border border-gray-100 bg-white opacity-0 shadow-2xl transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="p-2">
                  {categoriesQ.isPending && categories.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">{w.common.loadingCategories}</p>
                  ) : categories.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">{w.common.noCategories}</p>
                  ) : (
                    categories.map((cat) => <HeaderCategoryLink key={cat.uuid} cat={cat} />)
                  )}
                </div>
                <div className="border-t border-gray-100 bg-gray-50 p-4 text-center">
                  <Link href="/caterers" className="text-sm font-bold text-brand-red hover:text-red-700">
                    {w.header.viewAllServices}
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href="/packages"
              className="group flex cursor-pointer flex-col border-l border-gray-200 px-6"
            >
              <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                {w.header.forCaterers}
              </span>
              <span className="font-heading font-medium text-brand-dark transition group-hover:text-brand-red">
                {w.header.packages}
              </span>
            </Link>

            <Link
              href="/blog"
              className="group flex cursor-pointer flex-col border-l border-gray-200 px-6"
            >
              <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                {w.header.read}
              </span>
              <span className="font-heading font-medium text-brand-dark transition group-hover:text-brand-red">
                {w.header.insights}
              </span>
            </Link>

            <Link
              href="/contact"
              className="group flex cursor-pointer flex-col border-l border-gray-200 pl-6 pr-12"
            >
              <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-red">
                {w.header.getInTouch}
              </span>
              <span className="font-heading font-medium text-brand-dark transition group-hover:text-brand-red">
                {w.header.contactUs}
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/caterers"
              className={`hidden md:flex ${headerIconActionClass}`}
              aria-label={w.header.searchCaterers}
            >
              <MagnifyingGlass className="text-lg" aria-hidden />
            </Link>
            {ready && user ? (
              <div className="hidden md:block">
                <UserAccountMenu user={user} onLogout={logout} />
              </div>
            ) : ready ? (
              <>
                <Link
                  href="/login"
                  className={`hidden md:flex ${headerIconActionClass}`}
                  aria-label={w.header.logIn}
                  title={w.header.logIn}
                >
                  <SignIn className="text-lg" weight="bold" aria-hidden />
                </Link>
                <Link
                  href="/register"
                  className="cursor-pointer rounded-md bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-xl sm:px-5"
                >
                  {w.header.createAccount}
                </Link>
              </>
            ) : null}

            {ready ? <LanguageSwitcher variant="header" className="shrink-0" /> : null}

            <button
              type="button"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-brand-dark shadow-sm transition-all duration-300 hover:scale-105 hover:border-brand-red hover:bg-brand-red hover:text-white focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand-red/35 focus-visible:ring-offset-2 md:hidden"
              aria-expanded={open}
              aria-label={open ? w.header.closeMenu : w.header.openMenu}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="text-xl" /> : <List className="text-xl" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-gray-100 bg-white px-4 pb-5 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              <Link
                href="/caterers"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {w.header.browseCaterers}
              </Link>
              <p className="px-4 pt-2 text-[10px] font-bold uppercase tracking-widest text-brand-red">
                {w.header.serviceCategoriesMobile}
              </p>
              {categoriesQ.isPending && categories.length === 0 ? (
                <p className="px-4 py-2 text-sm text-gray-500">{w.common.loading}</p>
              ) : (
                categories.map((cat) => (
                  <HeaderCategoryLink
                    key={cat.uuid}
                    cat={cat}
                    onNavigate={() => setOpen(false)}
                  />
                ))
              )}
              <Link
                href="/caterers"
                className="mx-4 mb-2 rounded-lg py-2 text-center text-sm font-bold text-brand-red hover:text-red-700"
                onClick={() => setOpen(false)}
              >
                {w.header.viewAllServicesMobile}
              </Link>
              <Link
                href="/packages"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {w.header.packages}
              </Link>
              <Link
                href="/blog"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {w.header.insights}
              </Link>
              <Link
                href="/contact"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                {w.header.contact}
              </Link>
              {ready && user ? (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-3 rounded-lg px-4 py-2">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-red-800 text-sm font-bold text-white"
                      aria-hidden
                    >
                      {initialsFromName(user.fullName).slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-brand-dark">{user.fullName}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href={profileHref(user)}
                    className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    <UserCircle className="text-brand-red" size={22} weight="duotone" aria-hidden />
                    {w.header.profile}
                  </Link>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-brand-dark hover:bg-gray-50"
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                  >
                    <SignOut className="text-gray-500" size={22} aria-hidden />
                    {w.header.logOut}
                  </button>
                </div>
              ) : ready ? (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    {w.header.logIn}
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-brand-red px-4 py-3 text-center text-sm font-bold text-white"
                    onClick={() => setOpen(false)}
                  >
                    {w.header.createAccount}
                  </Link>
                </>
              ) : null}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
