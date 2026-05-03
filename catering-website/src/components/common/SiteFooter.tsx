"use client";

import { BrandLogoLink } from "@/components/common/BrandLogoLink";
import { Envelope, FacebookLogo, InstagramLogo, MapPin, Phone, TwitterLogo } from "@phosphor-icons/react";
import { publicSiteConfig } from "@/lib/site-config";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="zig-zag-border bg-[#111] pb-10 pt-20 text-gray-400">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <BrandLogoLink preset="siteFooter" className="mb-6" />
            <p className="mb-6 text-sm leading-relaxed">
              India&apos;s trusted directory for finding top-rated catering services. We bring the best flavors to
              your special occasions.
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-brand-red hover:shadow-[0_4px_15px_rgba(229,57,53,0.4)]"
                aria-label="Facebook"
              >
                <FacebookLogo className="text-lg" weight="regular" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-brand-red hover:shadow-[0_4px_15px_rgba(229,57,53,0.4)]"
                aria-label="Twitter"
              >
                <TwitterLogo className="text-lg" weight="regular" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-brand-red hover:shadow-[0_4px_15px_rgba(229,57,53,0.4)]"
                aria-label="Instagram"
              >
                <InstagramLogo className="text-lg" weight="regular" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-heading text-lg font-bold text-white">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="transition hover:text-brand-yellow">
                  Home
                </Link>
              </li>
                <li>
                  <a href="#about" className="transition hover:text-brand-yellow">
                    About Us
                  </a>
                </li>
                <li>
                  <Link href="/blog" className="transition hover:text-brand-yellow">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/caterers" className="transition hover:text-brand-yellow">
                    Catering Services
                  </Link>
                </li>
              <li>
                <Link href="/packages" className="transition hover:text-brand-yellow">
                  Packages
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-brand-yellow">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-brand-yellow">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-brand-yellow">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-heading text-lg font-bold text-white">Services</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/caterers" className="transition hover:text-brand-yellow">
                  Wedding Catering
                </Link>
              </li>
              <li>
                <Link href="/caterers" className="transition hover:text-brand-yellow">
                  Corporate Events
                </Link>
              </li>
              <li>
                <Link href="/caterers" className="transition hover:text-brand-yellow">
                  Birthday Parties
                </Link>
              </li>
              <li>
                <Link href="/caterers" className="transition hover:text-brand-yellow">
                  House Warming
                </Link>
              </li>
              <li>
                <Link href="/caterers" className="transition hover:text-brand-yellow">
                  Festival Catering
                </Link>
              </li>
            </ul>
          </div>

          <div id="footer-contact">
            <h4 className="mb-6 font-heading text-lg font-bold text-white">Get In Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 shrink-0 text-xl text-brand-red" aria-hidden />
                <span>
                  123 Catering Hub, Food Street,
                  <br />
                  Mumbai, Maharashtra 400001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-xl text-brand-red" aria-hidden />
                <span>{publicSiteConfig.supportPhoneDisplay}</span>
              </li>
              <li className="flex items-center gap-3">
                <Envelope className="text-xl text-brand-red" aria-hidden />
                <span>{publicSiteConfig.contactEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {publicSiteConfig.siteName}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
