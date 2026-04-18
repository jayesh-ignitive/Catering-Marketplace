"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchMarketplaceCaterer,
  formatMarketplaceCapacityRange,
  formatMarketplacePriceFromInr,
  postCatererReview,
} from "@/lib/catering-api";
import {
  FaCheck,
  FaChevronRight,
  FaEnvelope,
  FaMapMarkerAlt,
  FaStar,
  FaUtensils,
} from "react-icons/fa";

const CatererProfileMap = dynamic(
  () => import("@/components/common/CatererProfileMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[220px] w-full animate-pulse rounded-xl bg-stone-100" aria-hidden />
    ),
  }
);

const nf = new Intl.NumberFormat("en-IN");

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-400" aria-hidden>
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar key={s} size={14} className={s <= Math.round(rating) ? "opacity-100" : "opacity-20"} />
      ))}
    </span>
  );
}

function WriteReviewForm({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const m = useMutation({
    mutationFn: () =>
      postCatererReview(slug, {
        authorName: authorName.trim(),
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      }),
    onSuccess: () => {
      toast.success("Thanks — your review was posted.");
      setAuthorName("");
      setTitle("");
      setComment("");
      setRating(5);
      void qc.invalidateQueries({ queryKey: ["marketplace", "caterer", slug] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      className="mt-8 rounded-xl border border-stone-200 bg-stone-50/80 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
    >
      <h3 className="text-sm font-extrabold text-stone-900">Write a review</h3>
      <p className="mt-1 text-xs text-[var(--foreground-muted)]">
        Share your experience (demo — public, not verified purchases).
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-stone-700">
          Your name
          <input
            required
            maxLength={120}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]/40 focus:ring-2 focus:ring-[var(--primary)]/15"
            placeholder="e.g. Priya S."
          />
        </label>
        <label className="block text-sm font-semibold text-stone-700">
          Rating
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]/40"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} — {n === 5 ? "Excellent" : n === 4 ? "Good" : n === 3 ? "Okay" : n === 2 ? "Poor" : "Very poor"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold text-stone-700">
        Short title <span className="font-normal text-stone-500">(optional)</span>
        <input
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]/40"
          placeholder="e.g. Great wedding buffet"
        />
      </label>
      <label className="mt-4 block text-sm font-semibold text-stone-700">
        Your review
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]/40"
          placeholder="At least 10 characters…"
        />
      </label>
      <button
        type="submit"
        disabled={m.isPending}
        className="mt-5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/20 disabled:opacity-60"
      >
        {m.isPending ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}

function DetailContent() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const q = useQuery({
    queryKey: ["marketplace", "caterer", slug],
    queryFn: () => fetchMarketplaceCaterer(slug),
    enabled: Boolean(slug),
  });

  if (!slug) {
    return (
      <div className="container-max py-20 text-center text-stone-600">Invalid profile link.</div>
    );
  }

  if (q.isPending) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="h-[42vh] animate-pulse bg-stone-200" />
        <div className="container-max -mt-16 grid gap-8 pb-20 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div className="h-96 animate-pulse rounded-2xl bg-stone-100" />
          <div className="h-72 animate-pulse rounded-2xl bg-stone-100" />
        </div>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="container-max py-24 text-center">
        <h1 className="text-2xl font-extrabold text-stone-900">Profile not found</h1>
        <p className="mt-3 text-[var(--foreground-muted)]">
          This caterer may be unpublished or the link is incorrect.
        </p>
        <Link
          href="/caterers"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] px-6 py-3 text-sm font-bold text-white shadow-md"
        >
          Browse all caterers
        </Link>
      </div>
    );
  }

  const d = q.data;
  const priceLine = formatMarketplacePriceFromInr(d.priceFrom);
  const capacityLine = formatMarketplaceCapacityRange(d.capacityGuestMin, d.capacityGuestMax);
  const locationLine = [d.city, d.state, d.country].filter(Boolean).join(", ");
  const hasMapPin =
    typeof d.latitude === "number" &&
    typeof d.longitude === "number" &&
    !Number.isNaN(d.latitude) &&
    !Number.isNaN(d.longitude);
  const mapsQuery = encodeURIComponent(
    d.streetAddress?.trim()
      ? `${d.streetAddress}, ${locationLine}`.replace(/^,\s*/, "")
      : locationLine || d.businessName
  );
  const externalMapsHref = hasMapPin
    ? `https://www.google.com/maps?q=${d.latitude},${d.longitude}`
    : mapsQuery.length > 0
      ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`
      : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="relative">
        <div className="relative h-[min(42vh,420px)] w-full overflow-hidden bg-stone-900">
          {d.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={d.heroImageUrl}
              alt=""
              className="h-full w-full object-cover opacity-95"
            />
          ) : (
            <div
              className="h-full w-full bg-gradient-to-br from-[var(--orange-deep)] via-[var(--primary)] to-[var(--orange-mid)]"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
          <div className="container-max relative flex h-full flex-col justify-end pb-10 pt-24 sm:pb-12">
            <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm font-medium text-white/80">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <FaChevronRight className="text-white/50" size={10} aria-hidden />
              <Link href="/caterers" className="hover:text-white">
                Caterers
              </Link>
              <FaChevronRight className="text-white/50" size={10} aria-hidden />
              <span className="text-white">{d.businessName}</span>
            </nav>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.35rem]">
                  {d.businessName}
                </h1>
                {d.tagline ? (
                  <p className="mt-2 max-w-2xl text-base text-white/90 sm:text-lg">{d.tagline}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/95">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                    <FaStar className="text-amber-300" size={14} aria-hidden />
                    <span className="font-bold tabular-nums">{d.avgRating.toFixed(1)}</span>
                    <span className="text-white/85">· {nf.format(d.reviewCount)} reviews</span>
                  </span>
                  {locationLine ? (
                    <span className="inline-flex items-center gap-2 text-white/90">
                      <FaMapMarkerAlt className="text-[var(--secondary-light)]" size={14} aria-hidden />
                      {locationLine}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-max grid gap-10 pb-20 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-14 lg:pt-12">
        <div className="space-y-12">
          <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 card-shadow">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-stone-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <FaUtensils size={16} aria-hidden />
              </span>
              About
            </h2>
            <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-[var(--foreground-muted)]">
              {d.about ||
                `${d.businessName} is a catering partner on this marketplace. More details will appear here when the team completes their profile.`}
            </p>
          </section>

          {d.servicesOffered.length > 0 ? (
            <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 card-shadow">
              <h2 className="text-xl font-extrabold text-stone-900">What we offer</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {d.servicesOffered.map((s) => (
                  <li key={s} className="flex items-start gap-3 text-sm font-medium text-stone-800">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                      <FaCheck size={10} aria-hidden />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(d.cuisines ?? []).length > 0 ? (
            <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 card-shadow">
              <h2 className="text-xl font-extrabold text-stone-900">Cuisines & specialties</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {(d.cuisines ?? []).map((c) => (
                  <span
                    key={c}
                    className="rounded-xl border border-stone-200 bg-[var(--light-gray)] px-4 py-2 text-sm font-semibold text-stone-800"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {(d.keywords ?? []).length > 0 ? (
            <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 card-shadow">
              <h2 className="text-xl font-extrabold text-stone-900">Search keywords</h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Tags used for discovery on the marketplace.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(d.keywords ?? []).map((k) => (
                  <span
                    key={k.slug}
                    className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/40 px-4 py-2 text-sm font-bold text-[var(--primary)]"
                  >
                    {k.label}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {d.galleryImages.length > 0 ? (
            <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 card-shadow">
              <h2 className="text-xl font-extrabold text-stone-900">Gallery</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {d.galleryImages.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 card-shadow">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-xl font-extrabold text-stone-900">Ratings & reviews</h2>
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                <StarDisplay rating={Math.round(d.avgRating)} />
                <span className="tabular-nums">{d.avgRating.toFixed(1)}</span>
                <span className="font-normal text-[var(--foreground-muted)]">
                  · {nf.format(d.reviewCount)} review{d.reviewCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            {d.reviewCount > d.reviews.length ? (
              <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                Showing the {d.reviews.length} most recent reviews.
              </p>
            ) : null}

            {d.reviews.length === 0 ? (
              <p className="mt-6 text-sm text-[var(--foreground-muted)]">
                No reviews yet — be the first to share your experience.
              </p>
            ) : (
              <ul className="mt-6 space-y-6">
                {d.reviews.map((r) => (
                  <li
                    key={r.id}
                    className="border-b border-stone-100 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-900">{r.authorName}</span>
                      <StarDisplay rating={r.rating} />
                      <time
                        dateTime={r.createdAt}
                        className="text-xs font-medium text-stone-500"
                      >
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    {r.title ? (
                      <p className="mt-2 font-semibold text-stone-800">{r.title}</p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                      {r.comment}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <WriteReviewForm slug={slug} />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {(d.streetAddress || locationLine || hasMapPin) && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 card-shadow">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">Location</h3>
              {d.streetAddress ? (
                <p className="mt-3 text-sm font-medium leading-relaxed text-stone-800">
                  {d.streetAddress}
                </p>
              ) : null}
              {locationLine ? (
                <p
                  className={`text-sm leading-relaxed text-[var(--foreground-muted)] ${d.streetAddress ? "mt-2" : "mt-3"}`}
                >
                  {locationLine}
                </p>
              ) : null}
              {hasMapPin ? (
                <div className="mt-4">
                  <CatererProfileMap
                    latitude={d.latitude!}
                    longitude={d.longitude!}
                    businessName={d.businessName}
                    addressLine={d.streetAddress ?? locationLine}
                  />
                </div>
              ) : null}
              {externalMapsHref ? (
                <a
                  href={externalMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm font-bold text-[var(--primary)] hover:underline"
                >
                  Open in Google Maps
                </a>
              ) : null}
            </div>
          )}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 card-shadow">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">Quick facts</h3>
            <dl className="mt-5 space-y-4 text-sm">
              {d.primaryCategoryName ? (
                <div>
                  <dt className="font-semibold text-stone-500">Service focus</dt>
                  <dd className="mt-1 font-bold text-stone-900">{d.primaryCategoryName}</dd>
                </div>
              ) : null}
              {priceLine ? (
                <div>
                  <dt className="font-semibold text-stone-500">Indicative pricing</dt>
                  <dd className="mt-1 font-bold text-stone-900">{priceLine}</dd>
                </div>
              ) : null}
              {d.yearsInBusiness != null ? (
                <div>
                  <dt className="font-semibold text-stone-500">Years in business</dt>
                  <dd className="mt-1 font-bold text-stone-900">{d.yearsInBusiness}+ years</dd>
                </div>
              ) : null}
              {capacityLine ? (
                <div>
                  <dt className="font-semibold text-stone-500">Typical event size</dt>
                  <dd className="mt-1 font-bold text-stone-900">{capacityLine}</dd>
                </div>
              ) : null}
              {d.subdomain ? (
                <div>
                  <dt className="font-semibold text-stone-500">Workspace</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-stone-800">{d.subdomain}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-br from-[var(--primary-soft)] to-white p-6 card-shadow">
            <h3 className="text-lg font-extrabold text-stone-900">Interested?</h3>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Send a brief with your event date, guest count, and city — the caterer will follow up.
            </p>
            <a
              href={`mailto:hello@example.com?subject=${encodeURIComponent(`Quote request: ${d.businessName}`)}`}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] py-3.5 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/25 transition hover:opacity-[0.96]"
            >
              <FaEnvelope size={14} aria-hidden />
              Request a quote
            </a>
            <Link
              href="/caterers"
              className="mt-3 block w-full rounded-xl border border-stone-200 bg-white py-3 text-center text-sm font-bold text-stone-800 transition hover:border-[var(--primary)]/30"
            >
              Back to listings
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CatererDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] py-24 text-center text-stone-500">
          Loading profile…
        </div>
      }
    >
      <DetailContent />
    </Suspense>
  );
}
