import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-stone-800/50 bg-gradient-to-b from-stone-900 to-stone-950 text-white">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--primary)]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--secondary)]/10 blur-3xl"
        aria-hidden
      />
      <div className="container-max relative py-12 sm:py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--orange-deep)] text-sm font-black text-white">
                C
              </span>
              <span className="text-white">
                <span className="text-[var(--orange-mid)]">Catering</span> Website
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-stone-400">
              Next.js storefront with a NestJS catalog API — find caterers by city and service.
            </p>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--orange-mid)]/90">
                Explore
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-stone-300">
                <li>
                  <Link href="/" className="transition hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <a href="#service-categories" className="transition hover:text-white">
                    Categories
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="transition hover:text-white">
                    How it works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--orange-mid)]/90">
                Contact
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-stone-300">
                <li>
                  <a href="mailto:info@example.com" className="transition hover:text-white">
                    info@example.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-center text-xs text-stone-500 sm:text-left">
            © {new Date().getFullYear()} Catering Website. All rights reserved.
          </p>
          <p className="text-xs text-stone-600">Built with Next.js · NestJS</p>
        </div>
      </div>
    </footer>
  );
}
