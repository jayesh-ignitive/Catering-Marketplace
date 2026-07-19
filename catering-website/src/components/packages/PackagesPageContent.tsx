"use client";

import { useI18n } from "@/context/LocaleContext";
import {
  type PublicListingPlan,
  type PublicPackagesPage,
} from "@/lib/listing-packages-api";
import { listingPackagesPageQueryOptions } from "@/lib/catalog-queries";
import { publicSiteConfig } from "@/lib/site-config";
import {
  ArrowRight,
  Check,
  ChatsCircle,
  Crown,
  Medal,
  Phone,
  Sparkle,
  Storefront,
  type Icon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

const PLAN_ICONS: Record<string, Icon> = {
  medal: Medal,
  storefront: Storefront,
  crown: Crown,
};

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="flex justify-center text-brand-green">
        <Check className="text-xl" weight="bold" aria-hidden />
      </span>
    );
  }
  if (value === false) {
    return <span className="block text-center text-gray-300">—</span>;
  }
  return <span className="block text-center text-sm font-medium text-brand-dark">{value}</span>;
}

function PlanCard({ plan, recommendedBadge }: { plan: PublicListingPlan; recommendedBadge: string }) {
  const Icon = PLAN_ICONS[plan.icon] ?? Medal;
  return (
    <article
      className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        plan.isDarkTheme
          ? "border-gray-700 bg-brand-dark text-white"
          : plan.isRecommended
            ? "border-2 border-brand-red/90 bg-white ring-4 ring-brand-red/10"
            : "border-gray-200 bg-white"
      }`}
    >
      {plan.isRecommended ? (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-red px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
          {recommendedBadge}
        </div>
      ) : null}
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
            plan.isDarkTheme ? "bg-white/10 text-brand-yellow" : "bg-brand-red/10 text-brand-red"
          }`}
        >
          <Icon className="text-2xl" weight="duotone" aria-hidden />
        </div>
        <div>
          <h3
            className={`font-heading text-xl font-extrabold ${plan.isDarkTheme ? "text-white" : "text-brand-dark"}`}
          >
            {plan.name}
          </h3>
          <p
            className={`mt-1 text-xs font-semibold uppercase tracking-wider ${plan.isDarkTheme ? "text-white/55" : "text-gray-500"}`}
          >
            {plan.subtitle}
          </p>
        </div>
      </div>
      <div
        className={`mt-8 border-t border-dashed pt-8 ${plan.isDarkTheme ? "border-white/15" : "border-gray-200"}`}
      >
        <p
          className={`font-heading text-4xl font-extrabold tabular-nums ${plan.isDarkTheme ? "text-white" : "text-brand-dark"}`}
        >
          {plan.priceDisplay}
        </p>
        <p className={`text-sm font-medium ${plan.isDarkTheme ? "text-white/60" : "text-gray-500"}`}>
          {plan.periodLabel}
        </p>
      </div>
      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3 text-sm leading-snug">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                plan.isDarkTheme ? "bg-brand-red text-white" : "bg-brand-green/15 text-brand-green"
              }`}
            >
              <Check className="text-xs" weight="bold" aria-hidden />
            </span>
            <span className={plan.isDarkTheme ? "text-white/85" : "text-gray-600"}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/contact?topic=${encodeURIComponent(plan.contactTopic)}`}
        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
          plan.isDarkTheme
            ? "bg-brand-yellow text-brand-dark hover:bg-amber-300"
            : plan.isRecommended
              ? "bg-brand-red text-white shadow-lg shadow-brand-red/25 hover:bg-red-700"
              : "border border-gray-200 bg-white text-brand-dark hover:border-brand-red/35 hover:text-brand-red"
        }`}
      >
        {plan.ctaLabel}
        <ArrowRight className="text-lg" aria-hidden />
      </Link>
    </article>
  );
}

function PackagesLoaded({ data }: { data: PublicPackagesPage }) {
  const { w } = useI18n();
  const p = data.page;

  return (
    <div className="min-h-screen bg-[#faf7f4] text-gray-800">
      <section className="relative overflow-hidden bg-brand-dark py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:20px_20px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-brand-red/40 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-yellow">
            {p.heroEyebrow}
          </p>
          <h1 className="font-heading mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            {p.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            {p.heroSubtitle}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow/25 text-2xl text-amber-900">
              <Sparkle weight="fill" aria-hidden />
            </div>
            <div>
              <h2 className="font-heading text-lg font-extrabold text-brand-dark sm:text-xl">
                {p.valueTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-[15px]">{p.valueBody}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-extrabold text-brand-dark sm:text-4xl">
            {p.discoverTitle}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">{p.discoverSubtitle}</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {data.plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} recommendedBadge={p.recommendedBadge} />
          ))}
        </div>

        <div className="mt-16 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
            <h2 className="font-heading text-lg font-extrabold text-brand-dark sm:text-xl">
              {p.comparisonTitle}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{p.comparisonHint}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  <th className="px-4 py-4 font-heading text-xs font-bold uppercase tracking-wider text-gray-500 sm:px-6">
                    {p.featureColumnLabel}
                  </th>
                  <th className="px-3 py-4 text-center font-heading text-xs font-bold uppercase tracking-wider text-brand-dark sm:px-4">
                    {p.tierEssentialLabel}
                  </th>
                  <th className="px-3 py-4 text-center font-heading text-xs font-bold uppercase tracking-wider text-brand-red sm:px-4">
                    {p.tierGrowthLabel}
                  </th>
                  <th className="px-3 py-4 text-center font-heading text-xs font-bold uppercase tracking-wider text-brand-dark sm:px-4">
                    {p.tierPremierLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.comparisonRows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 odd:bg-gray-50/40">
                    <td className="px-4 py-3.5 font-medium text-brand-dark sm:px-6">{row.label}</td>
                    <td className="px-3 py-3.5 sm:px-4">
                      <Cell value={row.essential} />
                    </td>
                    <td className="bg-brand-red/[0.03] px-3 py-3.5 sm:px-4">
                      <Cell value={row.growth} />
                    </td>
                    <td className="px-3 py-3.5 sm:px-4">
                      <Cell value={row.premier} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <section className="mt-20 rounded-3xl border border-gray-200 bg-white px-6 py-12 shadow-sm sm:px-10">
          <h2 className="font-heading text-center text-2xl font-extrabold text-brand-dark sm:text-3xl">
            {p.audienceTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">{p.audienceSubtitle}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {p.audienceTags.map((label) => (
              <span
                key={label}
                className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-700"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/caterers"
              className="inline-flex items-center gap-2 font-bold text-brand-red underline-offset-4 hover:underline"
            >
              {p.browseDirectoryLabel}
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-10 rounded-3xl border border-brand-red/15 bg-gradient-to-br from-brand-red/[0.06] to-white px-6 py-12 sm:grid-cols-2 sm:px-10">
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-brand-dark">{p.helpTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{p.helpBody}</p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end sm:justify-center">
            <a
              href={`tel:${publicSiteConfig.supportPhoneTel}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-brand-dark shadow-sm transition hover:border-brand-red/30 sm:w-auto"
            >
              <Phone className="text-brand-red" weight="duotone" aria-hidden />
              {w.packages.callSales} {publicSiteConfig.supportPhoneDisplay}
            </a>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-red px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/25 transition hover:bg-red-700 sm:w-auto"
            >
              <ChatsCircle weight="duotone" aria-hidden />
              {w.contact.submit}
            </Link>
          </div>
        </section>

        <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-gray-500">
          {p.disclaimerText}
        </p>
      </div>
    </div>
  );
}

export function PackagesPageContent({
  prefetchedPage,
}: {
  prefetchedPage?: PublicPackagesPage;
}) {
  const { locale } = useI18n();

  const pageQ = useQuery(listingPackagesPageQueryOptions(locale, prefetchedPage));

  if (pageQ.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#faf7f4] text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (pageQ.isError || !pageQ.data) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center text-gray-600">
        <p className="font-semibold text-brand-dark">Could not load packages</p>
        <p className="mt-2 text-sm">
          Ensure the API is running and listing package migrations are applied.
        </p>
      </div>
    );
  }

  return <PackagesLoaded data={pageQ.data} />;
}
