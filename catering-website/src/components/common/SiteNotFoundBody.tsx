import Link from "next/link";
import { FaArrowRight, FaCompass, FaHome } from "react-icons/fa";

/** Shared 404 content — use under `PublicLayout` or root `not-found` with header/footer. */
export function SiteNotFoundBody() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex-1 overflow-hidden bg-[#f8f7f5]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 120% 80% at 10% -10%, rgba(229, 57, 53, 0.18), transparent 50%),
            radial-gradient(ellipse 90% 60% at 100% 0%, rgba(255, 193, 7, 0.12), transparent 45%),
            radial-gradient(ellipse 70% 50% at 50% 100%, rgba(28, 28, 28, 0.06), transparent 55%)
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045] bg-[radial-gradient(circle_at_1px_1px,#1c1c1c_1px,transparent_0)] bg-[length:20px_20px]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">Error 404</p>
        <h1 className="font-heading mt-4 text-4xl font-extrabold leading-tight tracking-tight text-brand-dark sm:text-5xl">
          This page is{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-brand-red">off the menu</span>
            <span
              className="absolute -bottom-1 left-0 h-2.5 w-full -skew-y-1 bg-brand-yellow/90"
              aria-hidden
            />
          </span>
        </h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
          The link may be outdated, or the page may have moved. Head back to the homepage or browse our
          catering directory to continue.
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-brand-dark shadow-sm transition hover:border-brand-red/25 hover:shadow-md"
          >
            <FaHome className="text-lg text-brand-red" aria-hidden />
            Home
          </Link>
          <Link
            href="/caterers"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/30 transition hover:bg-red-700 hover:shadow-xl"
          >
            <FaCompass className="text-lg" aria-hidden />
            Find caterers
            <FaArrowRight className="text-lg" aria-hidden />
          </Link>
        </div>

        <p className="mt-14 text-xs font-medium text-gray-400">
          Need help?{" "}
          <Link href="/contact" className="font-bold text-brand-red underline-offset-2 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
