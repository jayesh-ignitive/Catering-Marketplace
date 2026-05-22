"use client";

import { BrandLogoLink } from "@/components/common/BrandLogoLink";
import { Envelope, FacebookLogo, InstagramLogo, MapPin, Phone, TwitterLogo } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchServiceCategories } from "@/lib/catering-api";
import { caterersListingPath } from "@/lib/caterers-url";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useI18n } from "@/context/LocaleContext";
import { publicSiteConfig } from "@/lib/site-config";

export function SiteFooter() {
  const { w, trans, locale } = useI18n();
  const categoriesQ = useQuery({
    queryKey: ["catalog", "service-categories", locale],
    queryFn: () => fetchServiceCategories(locale),
  });
  const categories = categoriesQ.data ?? [];

  return (
    <footer className="zig-zag-border bg-[#111] pb-10 pt-20 text-gray-400">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <BrandLogoLink preset="siteFooter" className="mb-6" />
            <p className="mb-6 text-sm leading-relaxed">{w.footer.blurb}</p>
            <div className="mt-6 flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-brand-red hover:shadow-[0_4px_15px_rgba(229,57,53,0.4)]"
                aria-label={w.footer.facebook}
              >
                <FacebookLogo className="text-lg" weight="regular" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-brand-red hover:shadow-[0_4px_15px_rgba(229,57,53,0.4)]"
                aria-label={w.footer.twitter}
              >
                <TwitterLogo className="text-lg" weight="regular" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-brand-red hover:shadow-[0_4px_15px_rgba(229,57,53,0.4)]"
                aria-label={w.footer.instagram}
              >
                <InstagramLogo className="text-lg" weight="regular" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-heading text-lg font-bold text-white">{w.footer.quickLinks}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="transition hover:text-brand-yellow">
                  {w.common.home}
                </Link>
              </li>
                <li>
                  <a href="#about" className="transition hover:text-brand-yellow">
                    {w.footer.aboutUs}
                  </a>
                </li>
                <li>
                  <Link href="/blog" className="transition hover:text-brand-yellow">
                    {w.footer.blog}
                  </Link>
                </li>
                <li>
                  <Link href="/caterers" className="transition hover:text-brand-yellow">
                    {w.footer.cateringServices}
                  </Link>
                </li>
              <li>
                <Link href="/packages" className="transition hover:text-brand-yellow">
                  {w.footer.packages}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-brand-yellow">
                  {w.footer.contactUs}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-brand-yellow">
                  {w.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-brand-yellow">
                  {w.footer.termsConditions}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-heading text-lg font-bold text-white">{w.footer.services}</h4>
            <ul className="space-y-3 text-sm">
              {categoriesQ.isPending ? (
                <li className="text-gray-500">{w.common.loading}</li>
              ) : categories.length === 0 ? (
                <li>
                  <Link href="/caterers" className="transition hover:text-brand-yellow">
                    {w.common.browseCaterers}
                  </Link>
                </li>
              ) : (
                categories.map((cat) => (
                  <li key={cat.uuid}>
                    <Link
                      href={caterersListingPath({ categorySlug: cat.slug })}
                      className="transition hover:text-brand-yellow"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div id="footer-contact">
            <h4 className="mb-6 font-heading text-lg font-bold text-white">{w.footer.getInTouch}</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 shrink-0 text-xl text-brand-red" aria-hidden />
                <span>
                  {publicSiteConfig.contactAddressLine1}
                  <br />
                  {publicSiteConfig.contactAddressLine2}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-xl text-brand-red" aria-hidden />
                <a
                  href={`tel:${publicSiteConfig.supportPhoneTel}`}
                  className="transition hover:text-brand-yellow"
                >
                  {publicSiteConfig.supportPhoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Envelope className="text-xl text-brand-red" aria-hidden />
                <a
                  href={`mailto:${publicSiteConfig.contactEmail}`}
                  className="transition hover:text-brand-yellow"
                >
                  {publicSiteConfig.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row">
          <p>
            {trans(w.footer.copyright, {
              year: new Date().getFullYear(),
              siteName: publicSiteConfig.siteName,
            })}
          </p>
          <LanguageSwitcher variant="footer" />
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              {w.footer.privacyPolicy}
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              {w.footer.termsConditions}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
