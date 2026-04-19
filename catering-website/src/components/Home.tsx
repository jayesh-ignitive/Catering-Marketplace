"use client";

import {
  ArrowRight,
  BowlFood,
  Buildings,
  Cake,
  Check,
  Coffee,
  Confetti,
  Hamburger,
  Handshake,
  MagnifyingGlass,
  Martini,
  Plant,
  Quotes,
  Scroll,
  Sparkle,
  Star,
  Storefront,
} from "@phosphor-icons/react";
import { HeroAutocomplete } from "@/components/home/HeroAutocomplete";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  fetchBlogPosts,
  fetchCities,
  fetchServiceCategories,
  fetchTrustStats,
} from "@/lib/catering-api";
import { caterersListingPath } from "@/lib/caterers-url";

const nf = new Intl.NumberFormat("en-IN");

const IMG = {
  hero: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1920&q=80",
  stats: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1920&q=80",
  testimonial:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
  blog: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
};

/** Visual rotation for catalog-driven category cards */
const CATEGORY_CARD_STYLES = [
  {
    border: "border-brand-red",
    hoverTitle: "group-hover:text-brand-red",
    iconWrap:
      "bg-red-50 text-brand-red group-hover:bg-brand-red group-hover:text-white",
    Icon: BowlFood,
  },
  {
    border: "border-brand-green",
    hoverTitle: "group-hover:text-brand-green",
    iconWrap:
      "bg-green-50 text-brand-green group-hover:bg-brand-green group-hover:text-white",
    Icon: Cake,
  },
  {
    border: "border-brand-yellow",
    hoverTitle: "group-hover:text-brand-yellow",
    iconWrap:
      "bg-yellow-50 text-brand-yellow group-hover:bg-brand-yellow group-hover:text-white",
    Icon: Buildings,
  },
  {
    border: "border-blue-500",
    hoverTitle: "group-hover:text-blue-500",
    iconWrap: "bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white",
    Icon: Martini,
  },
  {
    border: "border-purple-500",
    hoverTitle: "group-hover:text-purple-500",
    iconWrap:
      "bg-purple-50 text-purple-500 group-hover:bg-purple-500 group-hover:text-white",
    Icon: Plant,
  },
  {
    border: "border-orange-500",
    hoverTitle: "group-hover:text-orange-500",
    iconWrap:
      "bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white",
    Icon: Hamburger,
  },
  {
    border: "border-teal-500",
    hoverTitle: "group-hover:text-teal-500",
    iconWrap:
      "bg-teal-50 text-teal-500 group-hover:bg-teal-500 group-hover:text-white",
    Icon: Coffee,
  },
] as const;

export default function Home() {
  const router = useRouter();
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const citiesQ = useQuery({ queryKey: ["catalog", "cities"], queryFn: fetchCities });
  const categoriesQ = useQuery({
    queryKey: ["catalog", "service-categories"],
    queryFn: fetchServiceCategories,
  });
  
  const statsQ = useQuery({ queryKey: ["catalog", "stats"], queryFn: fetchTrustStats });
  const blogQ = useQuery({
    queryKey: ["catalog", "blog", "home-preview"],
    queryFn: () => fetchBlogPosts({ page: 1, limit: 2 }),
  });

  const cities = citiesQ.data ?? [];
  const categories = categoriesQ.data ?? [];
  const stats = statsQ.data;

  const heroReady = useMemo(
    () => !citiesQ.isPending && !categoriesQ.isPending,
    [citiesQ.isPending, categoriesQ.isPending],
  );

  const onSearch = () => {
    const cityName = cityId ? cities.find((c) => c.id === cityId)?.name : undefined;
    const cat = categoryId ? categories.find((c) => c.id === categoryId) : undefined;
    router.push(
      caterersListingPath({
        cityName: cityName ?? null,
        categorySlug: cat?.slug ?? null,
      })
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <main id="main-content">
        {/* Hero */}
        <section className="relative flex h-[min(600px,90vh)] items-center justify-center">
          <div className="absolute inset-0 z-0">
            <Image
              src={IMG.hero}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" aria-hidden />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center">
            <h1 className="font-heading mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
              Find Best Catering Service <br /> Providers <span className="text-brand-yellow">Near You</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-200">
              {stats?.customersHelped != null ? (
                <>
                  Join{" "}
                  <span className="font-semibold text-white">
                    {nf.format(stats.customersHelped)}+
                  </span>{" "}
                  hosts who used Bharat Catering to compare menus, cities, and caterer profiles—then book with
                  confidence.
                </>
              ) : (
                <>
                  Bharat Catering connects hosts with verified-style caterer listings, published menus, and quotes
                  across India.
                </>
              )}
            </p>

            <div className="relative z-20 mx-auto mt-8 flex w-full max-w-3xl flex-col gap-4 md:flex-row md:items-stretch">
              <HeroAutocomplete
                label="City (optional)"
                placeholder="City — optional"
                options={cities.map((c) => ({ id: c.id, name: c.name }))}
                value={cityId}
                onChange={setCityId}
                disabled={!heroReady}
              />
              <HeroAutocomplete
                label="Service category (optional)"
                placeholder="Category — optional"
                options={categories.map((c) => ({ id: c.id, name: c.name }))}
                value={categoryId}
                onChange={setCategoryId}
                disabled={!heroReady}
              />
              <button
                type="button"
                onClick={onSearch}
                disabled={!heroReady}
                className="flex shrink-0 items-center justify-center gap-2 rounded bg-brand-red px-8 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-xl hover:shadow-brand-red/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MagnifyingGlass className="text-xl" aria-hidden />
                SEARCH
              </button>
            </div>

            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm font-semibold text-white/80"
              aria-label="Quick links"
            >
              <Link
                href="/caterers"
                className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-brand-yellow"
              >
                Browse caterers
              </Link>
              <span className="px-1 text-white/35" aria-hidden>
                ·
              </span>
              <Link
                href="/packages"
                className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-brand-yellow"
              >
                Packages
              </Link>
              <span className="px-1 text-white/35" aria-hidden>
                ·
              </span>
              <Link
                href="/#service-categories"
                className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-brand-yellow"
              >
                Categories
              </Link>
              <span className="px-1 text-white/35" aria-hidden>
                ·
              </span>
              <Link
                href="/#how-it-works"
                className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-brand-yellow"
              >
                How it works
              </Link>
              <span className="px-1 text-white/35" aria-hidden>
                ·
              </span>
              <Link
                href="/blog"
                className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-brand-yellow"
              >
                Insights
              </Link>
            </nav>

            {(citiesQ.isError || categoriesQ.isError) && (
              <p className="mt-4 text-sm text-amber-200">
                Catalog API unavailable — ensure Nest is running on port 4000.
              </p>
            )}
          </div>
        </section>

        {/* Services */}
        <section className="overflow-hidden bg-gray-50 py-20" id="service-categories">
          <div className="mx-auto max-w-7xl px-6">
            <div className="-ml-[5%] mb-20 w-[110%] rotate-[-1deg] overflow-hidden bg-brand-dark py-4 shadow-xl">
              <div className="inline-flex animate-marquee whitespace-nowrap">
                <span className="font-heading text-4xl font-bold uppercase tracking-widest text-outline">
                  POPULAR DISHES &nbsp;&nbsp;•&nbsp;&nbsp; TOP CATERERS &nbsp;&nbsp;•&nbsp;&nbsp; PREMIUM
                  SERVICE &nbsp;&nbsp;•&nbsp;&nbsp; BEST DEALS &nbsp;&nbsp;•&nbsp;&nbsp;
                </span>
                <span className="font-heading text-4xl font-bold uppercase tracking-widest text-outline" aria-hidden>
                  POPULAR DISHES &nbsp;&nbsp;•&nbsp;&nbsp; TOP CATERERS &nbsp;&nbsp;•&nbsp;&nbsp; PREMIUM
                  SERVICE &nbsp;&nbsp;•&nbsp;&nbsp; BEST DEALS &nbsp;&nbsp;•&nbsp;&nbsp;
                </span>
              </div>
            </div>

            <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row md:items-end">
              <div>
                <div className="mb-4 inline-block rounded bg-brand-green px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Browse All
                </div>
                <h2 className="font-heading text-4xl font-bold text-brand-dark">Catering Service Categories</h2>
              </div>
              <Link
                href="/packages"
                className="group inline-flex items-center gap-2 text-sm font-bold text-brand-red transition hover:text-red-800"
              >
                View caterer packages
                <ArrowRight
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {categoriesQ.isPending &&
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[220px] animate-pulse rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/80"
                    aria-hidden
                  />
                ))}
              {!categoriesQ.isPending &&
                categories.slice(0, 7).map((cat, i) => {
                  const style = CATEGORY_CARD_STYLES[i % CATEGORY_CARD_STYLES.length]!;
                  const Icon = style.Icon;
                  return (
                    <Link
                      key={cat.id}
                      href={caterersListingPath({ categorySlug: cat.slug })}
                      className={`group flex flex-col items-center rounded-xl border-b-4 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${style.border}`}
                    >
                      <div
                        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl transition-all duration-300 group-hover:scale-110 ${style.iconWrap}`}
                      >
                        <Icon className="text-3xl" />
                      </div>
                      <h3
                        className={`font-heading mb-2 text-xl font-bold text-brand-dark transition-colors ${style.hoverTitle}`}
                      >
                        {cat.name}
                      </h3>
                      <p className="line-clamp-3 text-sm text-gray-500">{cat.shortDescription}</p>
                    </Link>
                  );
                })}

              <Link
                href="/caterers"
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl bg-brand-dark p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:bg-black hover:shadow-2xl"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-brand-red text-3xl text-white transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">
                  <ArrowRight className="text-3xl" aria-hidden />
                </div>
                <h3 className="font-heading text-xl font-bold text-white">Browse All Services</h3>
              </Link>
            </div>

            {!categoriesQ.isPending && categories.length === 0 && (
              <p className="mt-10 text-center text-sm text-amber-700">
                Categories could not be loaded. Check that the catalog API is running on port 4000.
              </p>
            )}
          </div>
        </section>

        {/* How it works */}
        <section className="relative bg-white py-24" id="how-it-works">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <div className="mb-4 inline-block">
              <span className="paint-stroke-bg font-heading text-sm font-bold uppercase tracking-widest text-white">
                How It Works
              </span>
            </div>
            <h2 className="font-heading mx-auto mb-20 max-w-2xl text-4xl font-bold leading-tight text-brand-dark md:text-5xl">
              So How Does Bharat Catering Process Work?
            </h2>

            <div className="relative grid grid-cols-1 gap-12 md:grid-cols-4">
              <div
                className="absolute left-[12%] right-[12%] top-12 -z-10 hidden h-0.5 border-t-2 border-dashed border-gray-300 md:block"
                aria-hidden
              />

              {[
                {
                  step: "01",
                  icon: MagnifyingGlass,
                  color: "text-brand-red",
                  title: "Search Caterer",
                  body: "Find the best caterers in your city based on your specific event requirements.",
                },
                {
                  step: "02",
                  icon: Scroll,
                  color: "text-brand-green",
                  title: "Get Quotes",
                  body: "Receive detailed pricing and menu options from multiple top-rated providers.",
                },
                {
                  step: "03",
                  icon: Handshake,
                  color: "text-brand-yellow",
                  title: "Hire Best Match",
                  body: "Compare reviews, taste their food, and finalize the one that fits your needs.",
                },
                {
                  step: "04",
                  icon: Confetti,
                  color: "text-purple-500",
                  title: "Enjoy Event",
                  body: "Relax and enjoy your event while the caterers handle the delicious food.",
                },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center">
                  <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-gray-200 bg-white shadow-xl">
                    <s.icon className={`text-4xl ${s.color}`} />
                    <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
                      {s.step}
                    </div>
                  </div>
                  <h3 className="font-heading mb-3 text-xl font-bold text-brand-dark">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages — listing tiers for catering businesses */}
        <section
          className="relative overflow-hidden bg-gradient-to-b from-[#faf7f4] via-white to-[#faf7f4] py-24"
          id="packages"
        >
          <div
            className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-brand-red/[0.07] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-brand-yellow/[0.12] blur-3xl"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,rgba(28,28,28,0.04)_1px,transparent_0)] bg-[length:22px_22px]" aria-hidden />

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-red/15 bg-brand-red/[0.06] px-3 py-1.5">
                <Storefront className="text-lg text-brand-red" weight="duotone" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-red">For caterers</span>
              </div>
              <h2 className="font-heading text-4xl font-extrabold tracking-tight text-brand-dark md:text-5xl">
                Listing <span className="text-brand-red">packages</span> for your kitchen
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Grow on Bharat Catering with a profile guests can trust — from your first published listing to
                hands-on partner support for larger teams.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
              {[
                {
                  name: "Listing starter",
                  tag: "Get discovered",
                  price: "Free",
                  period: "to begin",
                  blurb: "Create your account, verify your email, and publish a professional profile on the directory.",
                  icon: MagnifyingGlass,
                  accent: "border-gray-200 bg-white shadow-sm",
                  cta: "Create account",
                  href: "/register",
                  featured: false,
                  darkCard: false,
                  perks: [
                    "Appear in marketplace search by city & service type",
                    "Business name, story, and contact-ready profile",
                    "Email verification before you go live",
                  ],
                },
                {
                  name: "Workspace",
                  tag: "Most popular",
                  price: "Free",
                  period: "with your listing",
                  blurb: "Use your caterer workspace to keep menus, gallery, and categories polished as you scale.",
                  icon: Star,
                  accent:
                    "border-2 border-brand-red/90 bg-white shadow-[0_28px_70px_-24px_rgba(229,57,53,0.22),0_0_0_1px_rgba(229,57,53,0.06)] ring-4 ring-brand-red/10 lg:-translate-y-1 lg:scale-[1.02]",
                  cta: "Set up workspace",
                  href: "/register",
                  featured: true,
                  darkCard: false,
                  perks: [
                    "Business hub: profile, gallery, and service categories",
                    "Publish the details hosts compare before they enquire",
                    "Built for teams updating menus and photos often",
                  ],
                },
                {
                  name: "Partner program",
                  tag: "Kitchens at scale",
                  price: "Custom",
                  period: "let’s talk",
                  blurb: "Multi-location brands, high-volume kitchens, or bespoke onboarding — we align with your ops team.",
                  icon: Sparkle,
                  accent: "border border-gray-200/90 bg-brand-dark text-white shadow-xl",
                  cta: "Talk to sales",
                  href: "/contact",
                  featured: false,
                  darkCard: true,
                  perks: [
                    "Priority onboarding and listing reviews",
                    "Support for multi-brand or multi-city rollouts",
                    "Commercial terms tailored to your footprint",
                  ],
                },
              ].map((pkg) => {
                const Icon = pkg.icon;
                const isDark = pkg.darkCard;
                return (
                  <article
                    key={pkg.name}
                    className={`relative flex flex-col rounded-3xl p-8 transition duration-300 hover:-translate-y-1 ${pkg.accent}`}
                  >
                    {pkg.featured ? (
                      <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-red px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-brand-red/30">
                        {pkg.tag}
                      </div>
                    ) : (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-brand-yellow" : "text-brand-red"}`}
                      >
                        {pkg.tag}
                      </span>
                    )}

                    <div className="mt-5 flex items-start gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                          isDark
                            ? "bg-white/10 text-brand-yellow"
                            : pkg.featured
                              ? "bg-brand-red/10 text-brand-red"
                              : "bg-gray-100 text-brand-dark"
                        }`}
                      >
                        <Icon className="text-2xl" weight={pkg.featured || isDark ? "duotone" : "regular"} aria-hidden />
                      </div>
                      <div>
                        <h3
                          className={`font-heading text-2xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-brand-dark"}`}
                        >
                          {pkg.name}
                        </h3>
                        <p
                          className={`mt-1 text-sm leading-relaxed ${isDark ? "text-white/70" : "text-gray-600"}`}
                        >
                          {pkg.blurb}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-8 flex items-baseline gap-2 border-t border-dashed pt-8 ${isDark ? "border-white/15" : "border-gray-200/80"}`}
                    >
                      <span
                        className={`font-heading text-4xl font-extrabold tabular-nums ${isDark ? "text-white" : "text-brand-dark"}`}
                      >
                        {pkg.price}
                      </span>
                      <span className={`text-sm font-medium ${isDark ? "text-white/55" : "text-gray-500"}`}>
                        {pkg.period}
                      </span>
                    </div>

                    <ul className="mt-6 flex flex-1 flex-col gap-3">
                      {pkg.perks.map((line) => (
                        <li key={line} className="flex gap-3 text-sm leading-snug">
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              isDark ? "bg-brand-red text-white" : "bg-brand-green/15 text-brand-green"
                            }`}
                          >
                            <Check className="text-xs" weight="bold" aria-hidden />
                          </span>
                          <span className={isDark ? "text-white/85" : "text-gray-600"}>{line}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={pkg.href}
                      className={`mt-10 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition ${
                        isDark
                          ? "bg-brand-yellow text-brand-dark shadow-md hover:bg-amber-300"
                          : pkg.featured
                            ? "bg-brand-red text-white shadow-lg shadow-brand-red/25 hover:bg-red-700"
                            : "border border-gray-200 bg-white text-brand-dark hover:border-brand-red/30 hover:text-brand-red"
                      }`}
                    >
                      {pkg.cta}
                      <ArrowRight className="text-lg" aria-hidden />
                    </Link>
                  </article>
                );
              })}
            </div>

            <p className="mx-auto mt-12 max-w-2xl text-center text-sm leading-relaxed text-gray-500">
              Final fees for food and service stay between you and your clients. These packages are about your{" "}
              <strong className="font-semibold text-brand-dark">presence on Bharat Catering</strong> — not guest
              tickets.{" "}
              <Link href="/caterers" className="font-semibold text-brand-red underline-offset-2 hover:underline">
                Looking to hire a caterer? Browse the directory.
              </Link>
            </p>
            <p className="mx-auto mt-4 text-center">
              <Link
                href="/packages"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-red underline-offset-4 hover:underline"
              >
                Full yearly plans, feature table &amp; how to choose
                <ArrowRight className="text-base" aria-hidden />
              </Link>
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="relative flex items-center bg-brand-dark py-24" id="trust">
          <div className="absolute inset-0 z-0">
            <Image src={IMG.stats} alt="" fill className="object-cover opacity-20" sizes="100vw" />
            <div className="absolute inset-0 bg-brand-dark/80" aria-hidden />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-12 px-6 md:flex-row">
            <div className="text-white md:w-1/2">
              <div className="mb-4 inline-block">
                <span className="paint-stroke-bg green font-heading text-sm font-bold uppercase tracking-widest text-white">
                  Since 2024
                </span>
              </div>
              <h2 className="font-heading mb-6 text-4xl font-bold leading-tight md:text-6xl">
                Why Businesses Trust <span className="text-brand-red">Bharat Catering</span>
              </h2>
              <p className="mb-8 max-w-lg text-lg text-gray-300">
                We connect you with the most reliable, hygienic, and highly-rated catering services across India.
                Quality food for quality moments.
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-md bg-white px-8 py-4 font-bold text-brand-dark transition-all duration-300 hover:scale-105 hover:bg-gray-200 hover:shadow-lg"
              >
                Get Started <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid w-full grid-cols-2 gap-6 md:w-1/2">
              {[
                {
                  label: "Verified reviews",
                  value: stats?.verifiedReviews != null ? nf.format(stats.verifiedReviews) : "—",
                  accent: "text-brand-yellow",
                },
                {
                  label: "Caterers listed",
                  value:
                    stats?.cateringServicesListed != null
                      ? `${nf.format(stats.cateringServicesListed)}+`
                      : "—",
                  accent: "text-brand-green",
                  offset: true,
                },
                {
                  label: "Hosts helped",
                  value:
                    stats?.customersHelped != null
                      ? stats.customersHelped >= 1000
                        ? `${Math.round(stats.customersHelped / 1000)}k+`
                        : `${nf.format(stats.customersHelped)}+`
                      : "—",
                  accent: "text-blue-400",
                },
                {
                  label: "Guides & articles",
                  value: stats?.researchArticles != null ? nf.format(stats.researchArticles) : "—",
                  accent: "text-orange-400",
                  offset: true,
                },
              ].map((box) => (
                <div
                  key={box.label}
                  className={`rounded-xl border border-white/20 bg-black/50 p-8 text-center backdrop-blur-sm ${box.offset ? "translate-y-6" : ""}`}
                >
                  <div className="font-heading mb-2 text-5xl font-bold text-outline text-white">{box.value}</div>
                  <div className={`text-sm font-semibold uppercase tracking-wider ${box.accent}`}>{box.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials & blog */}
        <section className="bg-gray-50 py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-2">
            <div id="testimonials">
              <h2 className="font-heading mb-8 text-3xl font-bold text-brand-dark">What Our Customers Say</h2>
              <div className="group relative overflow-hidden rounded-2xl shadow-lg">
                <div className="relative h-[400px] w-full">
                  <Image
                    src={IMG.testimonial}
                    alt=""
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <Quotes className="mb-4 text-4xl text-brand-yellow opacity-80" weight="fill" />
                  <p className="mb-6 text-lg italic">
                    &ldquo;Finding a caterer for our corporate event was a breeze. The quality of food and service was
                    exceptional. Highly recommended platform!&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-red text-xl font-bold">
                      A
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">Anthom Bu Spar</h4>
                      <p className="text-sm text-gray-300">Corporate Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-heading mb-8 text-3xl font-bold text-brand-dark">Latest Insights</h2>
              {blogQ.isPending ? (
                <div className="flex flex-col gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-6 rounded-2xl bg-white p-4 shadow-sm">
                      <div className="h-32 w-32 shrink-0 animate-pulse rounded-xl bg-gray-200" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                        <div className="h-6 w-full animate-pulse rounded bg-gray-100" />
                        <div className="h-12 w-full animate-pulse rounded bg-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : blogQ.isError || !blogQ.data?.items.length ? (
                <p className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-6 text-sm text-amber-900">
                  Insights will appear here once the blog API is available (run{" "}
                  <code className="rounded bg-white px-1">npm run migration:run</code> in catering-backend).
                </p>
              ) : (
                <div className="flex flex-col gap-6">
                  {blogQ.data.items.map((post, idx) => (
                    <Link
                      key={post.id}
                      href={`/blog/${encodeURIComponent(post.slug)}`}
                      className="group flex cursor-pointer items-center gap-6 rounded-2xl bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                    >
                      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={post.featuredImageUrl ?? IMG.blog}
                          alt=""
                          fill
                          className={`object-cover transition-transform duration-500 group-hover:scale-110 ${idx === 1 ? "grayscale group-hover:grayscale-0" : ""}`}
                          sizes="128px"
                        />
                      </div>
                      <div>
                        <span
                          className={`mb-2 block text-xs font-bold uppercase tracking-wider ${idx === 0 ? "text-brand-red" : "text-brand-green"}`}
                        >
                          {post.categoryLabel}
                        </span>
                        <h3 className="font-heading mb-2 text-xl font-bold text-brand-dark transition-colors group-hover:text-brand-red">
                          {post.title}
                        </h3>
                        <p className="line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link
                href="/blog"
                className="group mt-8 inline-flex items-center gap-2 font-bold text-brand-red hover:text-red-800"
              >
                View all articles <ArrowRight className="transition-transform group-hover:translate-x-2" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
