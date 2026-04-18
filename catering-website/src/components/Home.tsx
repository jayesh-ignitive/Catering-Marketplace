"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  fetchCities,
  fetchServiceCategories,
  fetchTrustStats,
  searchCaterers,
  type CatererListing,
  type SearchResponse,
  type ServiceCategory,
} from "@/lib/catering-api";
import { FaArrowRight, FaMapMarkerAlt, FaSearch, FaStar, FaUtensils } from "react-icons/fa";

const nf = new Intl.NumberFormat("en-IN");

const steps = [
  { title: "Choose a service", body: "Pick the type of catering you need for your occasion." },
  { title: "Select your city", body: "We surface verified caterers who operate in your area." },
  { title: "Compare & read reviews", body: "Use ratings and specialties to shortlist with confidence." },
  { title: "Request quotes", body: "Reach out to multiple providers and pick what fits your budget." },
];

const testimonials = [
  {
    quote:
      "We compared per-plate pricing from several caterers in a day. The directory made it effortless.",
    name: "Narender Singh",
    place: "Agra",
  },
  {
    quote:
      "Five quality caterers replied quickly for our corporate lunch. Selection was much easier than cold-calling.",
    name: "Dhaval Vyas",
    place: "Ahmedabad",
  },
  {
    quote:
      "Found specialists for a large wedding buffet without endless WhatsApp groups. Highly recommend.",
    name: "Sandip Rana",
    place: "Ahmedabad",
  },
];

function CategoryCard({ c }: { c: ServiceCategory }) {
  return (
    <article
      id={c.slug}
      className="group relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-6 card-shadow transition duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/35 card-shadow-hover"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[var(--primary-soft)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--secondary-light)] to-[var(--secondary-muted)] text-[var(--primary)] shadow-inner transition duration-300 group-hover:bg-gradient-to-br group-hover:from-[var(--primary)] group-hover:to-[var(--orange-deep)] group-hover:text-white group-hover:shadow-md">
          <FaUtensils className="text-lg" aria-hidden />
        </div>
        <h3 className="text-lg font-bold text-[var(--foreground)]">{c.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{c.shortDescription}</p>
      </div>
    </article>
  );
}

function CatererCard({ row }: { row: CatererListing }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-stone-200/90 bg-white p-6 card-shadow transition duration-300 hover:border-[var(--primary)]/25 card-shadow-hover">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-[var(--foreground)] leading-snug">{row.name}</h3>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-sm font-bold text-amber-900 ring-1 ring-amber-200/80">
          <FaStar className="text-[var(--primary)]" size={12} aria-hidden />
          {row.rating.toFixed(1)}
        </span>
      </div>
      <p className="text-sm text-[var(--foreground-muted)]">
        {nf.format(row.reviewCount)} reviews · {row.priceHint}
      </p>
      <div className="flex flex-wrap gap-2">
        {row.specialties.map((s) => (
          <span
            key={s}
            className="rounded-lg bg-[var(--light-gray)] px-2.5 py-1 text-xs font-semibold text-stone-700 ring-1 ring-stone-200/60"
          >
            {s}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] py-3 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/20 transition hover:opacity-[0.97] hover:shadow-lg hover:shadow-[var(--primary)]/25"
      >
        Request quote
        <FaArrowRight className="text-xs opacity-90" aria-hidden />
      </button>
    </article>
  );
}

export default function Home() {
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);

  const citiesQ = useQuery({ queryKey: ["catalog", "cities"], queryFn: fetchCities });
  const categoriesQ = useQuery({
    queryKey: ["catalog", "service-categories"],
    queryFn: fetchServiceCategories,
  });
  const statsQ = useQuery({ queryKey: ["catalog", "stats"], queryFn: fetchTrustStats });

  const searchM = useMutation({
    mutationFn: () => searchCaterers(cityId, categoryId),
    onSuccess: (data) => {
      setSearchResult(data);
      if (data.caterers.length === 0) {
        toast.info("No listings for that combination yet — try Mumbai + Wedding or Delhi + Corporate.");
      } else {
        toast.success(`Found ${data.caterers.length} caterer(s).`);
      }
    },
    onError: () => {
      toast.error(
        "Could not reach the API. Start the Nest server: cd catering-backend && npm run start:dev (port 4000).",
      );
    },
  });

  const cities = citiesQ.data ?? [];
  const categories = categoriesQ.data ?? [];
  const stats = statsQ.data;

  const heroReady = useMemo(
    () => !citiesQ.isPending && !categoriesQ.isPending,
    [citiesQ.isPending, categoriesQ.isPending],
  );

  const onSearch = () => {
    if (!cityId || !categoryId) {
      toast.warning("Please select both city and service category.");
      return;
    }
    searchM.mutate();
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <section className="relative overflow-hidden border-b border-stone-200/80 mesh-hero">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="container-max relative py-16 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
              Catering marketplace
            </p>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.1]">
              Find trusted{" "}
              <span className="text-gradient-brand">catering partners</span>
              <br className="hidden sm:block" />
              <span className="sm:ml-1.5">near you</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--foreground-muted)]">
              Browse categories, compare caterers, and request quotes — a clean, fast directory experience
              powered by your catalog API.
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-4xl">
            <div
              className="pointer-events-none absolute -inset-px rounded-[1.65rem] bg-gradient-to-br from-[var(--primary)]/25 via-transparent to-[var(--secondary)]/20 opacity-80 blur-sm"
              aria-hidden
            />
            <div className="relative rounded-3xl border border-stone-200/90 bg-white/95 p-6 card-shadow backdrop-blur-md sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-left text-sm font-bold text-[var(--foreground)]">
                  <span className="inline-flex items-center gap-2 font-semibold text-[var(--foreground-muted)]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                      <FaMapMarkerAlt className="text-sm" aria-hidden />
                    </span>
                    City
                  </span>
                  <select
                    className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3.5 text-base font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]/40 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/15"
                    value={cityId}
                    disabled={!heroReady}
                    onChange={(e) => setCityId(e.target.value)}
                  >
                    <option value="">Select city</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-left text-sm font-bold text-[var(--foreground)]">
                  <span className="inline-flex items-center gap-2 font-semibold text-[var(--foreground-muted)]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                      <FaUtensils className="text-sm" aria-hidden />
                    </span>
                    Service category
                  </span>
                  <select
                    className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3.5 text-base font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]/40 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/15"
                    value={categoryId}
                    disabled={!heroReady}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-7 flex flex-col items-stretch gap-4 border-t border-stone-100 pt-7 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--foreground-muted)]">
                  {citiesQ.isError || categoriesQ.isError ? (
                    "Ensure the Nest API is running on port 4000."
                  ) : (
                    <>
                      Live caterer profiles:{" "}
                      <Link
                        href="/caterers"
                        className="font-bold text-[var(--primary)] underline-offset-2 hover:underline"
                      >
                        browse the full directory
                      </Link>
                      . Quick search below uses sample catalog data.
                    </>
                  )}
                </p>
                <button
                  type="button"
                  onClick={onSearch}
                  disabled={searchM.isPending || !heroReady}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-[var(--primary)]/25 transition hover:opacity-[0.97] hover:shadow-xl hover:shadow-[var(--primary)]/30 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {searchM.isPending ? (
                    "Searching…"
                  ) : (
                    <>
                      <FaSearch aria-hidden />
                      Search caterers
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {searchResult && searchResult.caterers.length > 0 && (
        <section
          className="border-b border-stone-200/80 bg-gradient-to-b from-white to-[var(--background)] py-16"
          id="search-results"
        >
          <div className="container-max">
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">Results</p>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                  Top matches
                </h2>
                <p className="mt-2 text-[var(--foreground-muted)]">
                  {searchResult.city?.name} · {searchResult.category?.name}
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {searchResult.caterers.map((row) => (
                <CatererCard key={row.id} row={row} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 sm:py-20 lg:py-24" id="service-categories">
        <div className="container-max">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">Browse</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Service categories
            </h2>
            <p className="mt-4 text-lg text-[var(--foreground-muted)]">
              Every occasion covered — weddings, corporate, parties — in a scannable, modern grid.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categoriesQ.isPending &&
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200/60"
                  aria-hidden
                />
              ))}
            {!categoriesQ.isPending &&
              categories.map((c) => <CategoryCard key={c.id} c={c} />)}
          </div>
        </div>
      </section>

      <section
        className="relative border-y border-stone-200/80 bg-gradient-to-b from-white via-[var(--background-warm)] to-white py-16 sm:py-20"
        id="trust"
      >
        <div className="container-max relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">Trust</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Why hosts trust us
            </h2>
            <p className="mt-4 text-lg text-[var(--foreground-muted)]">
              Live metrics from your NestJS stats endpoint — the same signals guests expect from top
              marketplaces.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Verified reviews", value: stats?.verifiedReviews ?? "—", sub: "Authentic feedback" },
              {
                label: "Caterers listed",
                value: stats?.cateringServicesListed ?? "—",
                sub: "Growing network",
              },
              { label: "Guides & research", value: stats?.researchArticles ?? "—", sub: "Smarter planning" },
              { label: "Events helped", value: stats?.customersHelped ?? "—", sub: "Hosts supported" },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-stone-200/90 bg-white p-7 text-center card-shadow transition duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/25"
              >
                <p className="text-4xl font-extrabold tabular-nums text-gradient-brand">
                  {typeof card.value === "number" ? nf.format(card.value) : card.value}
                </p>
                <p className="mt-3 font-bold text-[var(--foreground)]">{card.label}</p>
                <p className="mt-1.5 text-sm text-[var(--foreground-muted)]">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24" id="how-it-works">
        <div className="container-max">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">Process</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-[var(--foreground-muted)]">Four clear steps from browse to booking.</p>
          </div>
          <div className="relative mx-auto mt-14 max-w-5xl">
            <div
              className="pointer-events-none absolute left-[8%] right-[8%] top-14 hidden h-0.5 lg:block"
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in srgb, var(--primary) 45%, transparent), color-mix(in srgb, var(--secondary) 50%, transparent))",
              }}
              aria-hidden
            />
            <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="relative rounded-2xl border border-stone-200/90 bg-white p-7 card-shadow transition duration-300 hover:border-[var(--primary)]/20"
              >
                <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--orange-deep)] text-sm font-extrabold text-white shadow-md shadow-[var(--primary)]/25">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold text-[var(--foreground)]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{s.body}</p>
              </li>
            ))}
            </ol>
          </div>
        </div>
      </section>

      <section
        className="border-t border-stone-200/80 bg-gradient-to-b from-white to-[var(--background)] py-16 sm:py-20"
        id="testimonials"
      >
        <div className="container-max">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)]">Reviews</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
              What hosts say
            </h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <blockquote
                key={t.name}
                className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-8 card-shadow transition duration-300 hover:border-[var(--primary)]/20"
              >
                <span
                  className="absolute -right-2 -top-2 text-8xl font-serif leading-none text-[var(--primary)]/[0.07]"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <p className="relative flex-1 text-lg font-medium leading-relaxed text-[var(--foreground)]">
                  {t.quote}
                </p>
                <footer className="relative mt-8 border-t border-stone-100 pt-5">
                  <cite className="not-italic">
                    <span className="font-bold text-[var(--primary)]">{t.name}</span>
                    <span className="mt-0.5 block text-sm font-medium text-[var(--foreground-muted)]">
                      {t.place}
                    </span>
                  </cite>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-max">
          <div className="relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white sm:px-12 sm:py-16">
            <div
              className="absolute inset-0 bg-gradient-to-br from-[var(--orange-deep)] via-[var(--primary)] to-[var(--orange-mid)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[var(--secondary)]/15 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl">List your catering business</h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
                This stack pairs a Next.js storefront with a NestJS catalog you can extend into CRM, payments,
                and lead routing.
              </p>
              <a
                href="mailto:hello@example.com?subject=List%20my%20catering%20business"
                className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[var(--orange-deep)] shadow-xl shadow-black/15 transition hover:bg-[var(--secondary-light)] hover:text-[var(--foreground)]"
              >
                Get in touch
                <FaArrowRight className="text-sm" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
