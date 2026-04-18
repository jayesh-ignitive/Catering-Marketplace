"use client";

import {
  ArrowRight,
  BowlFood,
  Buildings,
  Cake,
  Coffee,
  Confetti,
  Hamburger,
  Handshake,
  MagnifyingGlass,
  Martini,
  Plant,
  Quotes,
  Scroll,
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

            <div className="mb-12 flex flex-col items-end justify-between md:flex-row">
              <div>
                <div className="mb-4 inline-block rounded bg-brand-green px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Browse All
                </div>
                <h2 className="font-heading text-4xl font-bold text-brand-dark">Catering Service Categories</h2>
              </div>
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
                      href="/caterers"
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
