"use client";

import {
  ArrowRight,
  Check,
  ChatsCircle,
  Crown,
  Medal,
  Phone,
  Sparkle,
  Storefront,
} from "@phosphor-icons/react";
import Link from "next/link";

const SUPPORT_PHONE_DISPLAY = "+91 0123456789";
const SUPPORT_PHONE_TEL = "+910123456789";

type PlanRow = {
  label: string;
  essential: boolean | string;
  growth: boolean | string;
  premier: boolean | string;
};

const COMPARISON: PlanRow[] = [
  { label: "Directory listing (search & filters)", essential: true, growth: true, premier: true },
  { label: "Profile: story, services, service areas", essential: true, growth: true, premier: true },
  { label: "Gallery images (published)", essential: "Up to 6", growth: "Up to 18", premier: "Higher limit" },
  { label: "Enquiry priority in inbox / routing", essential: "Standard", growth: "Elevated", premier: "Highest" },
  { label: "Homepage or collection spotlight", essential: false, growth: "Rotating", premier: "Priority" },
  { label: "Website link from profile", essential: false, growth: "Nofollow", premier: "Dofollow (SEO)" },
  { label: "Social highlight (owned channels)", essential: false, growth: "Quarterly", premier: "Monthly" },
  { label: "Editorial / PR mention or guest slot", essential: false, growth: "Optional add-on", premier: "Included" },
  { label: "Listing badge tier", essential: "Essential", growth: "Growth", premier: "Premier" },
  { label: "Profile SEO & copy review", essential: false, growth: "Light", premier: "Full pass" },
];

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

export default function CateringPackagesPage() {
  return (
    <div className="min-h-screen bg-[#faf7f4] text-gray-800">
      <section className="relative overflow-hidden bg-brand-dark py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:20px_20px]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-brand-red/40 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-yellow">For caterers &amp; brands</p>
          <h1 className="font-heading mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Catering listing packages
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            On a busy marketplace, a basic profile is rarely enough. These plans stack{" "}
            <strong className="font-semibold text-white">visibility, trust signals, and enquiry features</strong> so
            serious hosts can find you faster — similar to how leading Indian directories tier their listings (see for
            example{" "}
            <a
              href="https://www.cateringcorner.in/packages"
              className="font-semibold text-brand-yellow underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Catering Corner&apos;s packaging model
            </a>
            ).
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
                Which tier is usually the best value?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-[15px]">
                Directories like{" "}
                <a
                  href="https://www.cateringcorner.in/packages"
                  className="font-semibold text-brand-red underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Catering Corner
                </a>{" "}
                typically use a <strong className="font-semibold text-brand-dark">three-step ladder</strong> (entry /
                growth / premium): entry covers “be findable,” growth adds homepage or social exposure and stronger
                enquiry treatment, premium adds SEO-friendly backlinks and PR-style placement. For most regional
                kitchens, <strong className="font-semibold text-brand-dark">the middle tier</strong> tends to be the
                sweet spot between cost and lead quality; choose <strong className="font-semibold text-brand-dark">premier</strong>{" "}
                when you are scaling multi-city or competing for high-ticket weddings and corporate RFPs. Final mix
                should match your margin and enquiry volume — we are happy to advise.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-extrabold text-brand-dark sm:text-4xl">Discover our listing plans</h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            Pick the depth of exposure that matches how aggressively you want to grow on Bharat Catering. Annual fees
            below are <strong className="text-brand-dark">indicative</strong> — confirm current rates and inclusions with
            our team before purchase.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {[
            {
              name: "Directory Essential",
              subtitle: "Bronze-style entry",
              price: "₹9,999",
              period: "/ year (indicative)",
              icon: Medal,
              highlight: false,
              dark: false,
              cta: "Enquire for Essential",
              features: [
                "Live listing in marketplace search",
                "Core business profile & categories",
                "Up to 6 gallery images",
                "Standard enquiry handling",
                "Essential trust badge on profile",
              ],
            },
            {
              name: "Directory Growth",
              subtitle: "Silver-style — most kitchens start here",
              price: "₹14,999",
              period: "/ year (indicative)",
              icon: Storefront,
              highlight: true,
              dark: false,
              cta: "Enquire for Growth",
              features: [
                "Everything in Essential",
                "Elevated enquiry priority",
                "Expanded gallery (up to 18 images)",
                "Rotating homepage / collection spotlight",
                "Nofollow website link + quarterly social highlight",
                "Growth badge & lighter SEO pass on copy",
              ],
            },
            {
              name: "Directory Premier",
              subtitle: "Gold-style maximum visibility",
              price: "₹24,999",
              period: "/ year (indicative)",
              icon: Crown,
              highlight: false,
              dark: true,
              cta: "Enquire for Premier",
              features: [
                "Everything in Growth",
                "Highest enquiry routing priority",
                "Higher gallery cap for full menus & events",
                "Dofollow website link for SEO value",
                "Monthly social spotlight + PR / editorial slot",
                "Premier badge & full SEO profile review",
              ],
            },
          ].map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                  plan.dark
                    ? "border-gray-700 bg-brand-dark text-white"
                    : plan.highlight
                      ? "border-2 border-brand-red/90 bg-white ring-4 ring-brand-red/10"
                      : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlight ? (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-red px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    Recommended for growth
                  </div>
                ) : null}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                      plan.dark ? "bg-white/10 text-brand-yellow" : "bg-brand-red/10 text-brand-red"
                    }`}
                  >
                    <Icon className="text-2xl" weight="duotone" aria-hidden />
                  </div>
                  <div>
                    <h3 className={`font-heading text-xl font-extrabold ${plan.dark ? "text-white" : "text-brand-dark"}`}>
                      {plan.name}
                    </h3>
                    <p className={`mt-1 text-xs font-semibold uppercase tracking-wider ${plan.dark ? "text-white/55" : "text-gray-500"}`}>
                      {plan.subtitle}
                    </p>
                  </div>
                </div>
                <div className={`mt-8 border-t border-dashed pt-8 ${plan.dark ? "border-white/15" : "border-gray-200"}`}>
                  <p className={`font-heading text-4xl font-extrabold tabular-nums ${plan.dark ? "text-white" : "text-brand-dark"}`}>
                    {plan.price}
                  </p>
                  <p className={`text-sm font-medium ${plan.dark ? "text-white/60" : "text-gray-500"}`}>{plan.period}</p>
                </div>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm leading-snug">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          plan.dark ? "bg-brand-red text-white" : "bg-brand-green/15 text-brand-green"
                        }`}
                      >
                        <Check className="text-xs" weight="bold" aria-hidden />
                      </span>
                      <span className={plan.dark ? "text-white/85" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/contact?topic=${encodeURIComponent(plan.name)}`}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
                    plan.dark
                      ? "bg-brand-yellow text-brand-dark hover:bg-amber-300"
                      : plan.highlight
                        ? "bg-brand-red text-white shadow-lg shadow-brand-red/25 hover:bg-red-700"
                        : "border border-gray-200 bg-white text-brand-dark hover:border-brand-red/35 hover:text-brand-red"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="text-lg" aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-16 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
            <h2 className="font-heading text-lg font-extrabold text-brand-dark sm:text-xl">At-a-glance comparison</h2>
            <p className="mt-1 text-sm text-gray-500">Exact quotas can change — use this table to brief our sales team.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white">
                  <th className="px-4 py-4 font-heading text-xs font-bold uppercase tracking-wider text-gray-500 sm:px-6">
                    Feature
                  </th>
                  <th className="px-3 py-4 text-center font-heading text-xs font-bold uppercase tracking-wider text-brand-dark sm:px-4">
                    Essential
                  </th>
                  <th className="px-3 py-4 text-center font-heading text-xs font-bold uppercase tracking-wider text-brand-red sm:px-4">
                    Growth
                  </th>
                  <th className="px-3 py-4 text-center font-heading text-xs font-bold uppercase tracking-wider text-brand-dark sm:px-4">
                    Premier
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label} className="border-b border-gray-50 odd:bg-gray-50/40">
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
            Who sees your listing?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
            Hosts on Bharat Catering search by occasion and city — the same demand patterns directories optimise for
            across weddings, corporates, and home celebrations.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              "Wedding & marriage catering",
              "Birthday & party catering",
              "Corporate & office catering",
              "Buffet & large-format events",
              "Home & intimate catering",
              "Outdoor & venue catering",
            ].map((label) => (
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
              See how hosts browse the directory
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-10 rounded-3xl border border-brand-red/15 bg-gradient-to-br from-brand-red/[0.06] to-white px-6 py-12 sm:grid-cols-2 sm:px-10">
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-brand-dark">Need a hand choosing?</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Tell us your city mix, average ticket size, and whether you chase weddings, corporates, or both. We will
              map you to the leanest plan that still hits your lead goals.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end sm:justify-center">
            <a
              href={`tel:${SUPPORT_PHONE_TEL}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-brand-dark shadow-sm transition hover:border-brand-red/30 sm:w-auto"
            >
              <Phone className="text-brand-red" weight="duotone" aria-hidden />
              Call {SUPPORT_PHONE_DISPLAY}
            </a>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-red px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-red/25 transition hover:bg-red-700 sm:w-auto"
            >
              <ChatsCircle weight="duotone" aria-hidden />
              Send an enquiry
            </Link>
          </div>
        </section>

        <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-gray-500">
          Reference: tiered “Bronze / Silver / Gold” listing packaging and annual pricing is a common pattern on Indian
          catering directories — e.g.{" "}
          <a
            href="https://www.cateringcorner.in/packages"
            className="font-semibold text-brand-red underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Catering Corner — Pricing &amp; Catering Packages
          </a>
          . Bharat Catering plans above are our own product framing; fees and inclusions are confirmed at contract
          time.
        </p>
      </div>
    </div>
  );
}
