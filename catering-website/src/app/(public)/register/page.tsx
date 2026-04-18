"use client";

import { FormFieldError } from "@/components/common/FormFieldError";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_SIGNUP_COUNTRY_ISO2,
  PHONE_COUNTRY_OPTIONS,
  dialCodeFromOption,
  dialSelectLabel,
  findCountryByIso2,
  flagEmoji,
} from "@/lib/phone-country-options";
import { setPendingVerifyEmail } from "@/lib/pending-verify-email";
import { postAuthPath } from "@/lib/post-auth-path";
import { registerFormSchema, zodFieldErrors } from "@/lib/validation/auth-forms";
import { CalendarCheck, CaretRight, ChefHat, Storefront } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type RegFields =
  | "fullName"
  | "email"
  | "businessName"
  | "phoneCountryCode"
  | "phoneNumber"
  | "password";

type FieldErrors = Partial<Record<RegFields, string>>;

const PANEL_IMG =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80";

const benefits = [
  {
    icon: ChefHat,
    title: "Menus guests actually read",
    text: "Show packages, dietary options, and pricing in a clear, professional layout.",
  },
  {
    icon: CalendarCheck,
    title: "Bookings without the chaos",
    text: "Keep event details, headcounts, and dates organised in one workspace.",
  },
  {
    icon: Storefront,
    title: "Built for catering teams",
    text: "From small kitchens to multi-site operations — scale as you grow.",
  },
] as const;

export default function RegisterPage() {
  const { register, user, ready } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [countryIso, setCountryIso] = useState(DEFAULT_SIGNUP_COUNTRY_ISO2);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedCountry = useMemo(
    () => findCountryByIso2(countryIso) ?? PHONE_COUNTRY_OPTIONS[0]!,
    [countryIso]
  );
  const phoneCountryCode = dialCodeFromOption(selectedCountry);

  useEffect(() => {
    if (ready && user) router.replace(postAuthPath(user));
  }, [ready, user, router]);

  function clearError(field: RegFields) {
    setErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  }

  function clearPhoneErrors() {
    setErrors((e) => {
      if (!e.phoneCountryCode && !e.phoneNumber) return e;
      const next = { ...e };
      delete next.phoneCountryCode;
      delete next.phoneNumber;
      return next;
    });
  }

  function onPhoneNationalChange(raw: string) {
    setPhoneNumber(raw.replace(/\D/g, "").slice(0, 14));
    clearPhoneErrors();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerFormSchema.safeParse({
      fullName,
      email,
      businessName,
      phoneCountryCode,
      phoneNumber,
      password,
    });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error) as FieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await register(parsed.data);
      setPendingVerifyEmail(parsed.data.email.trim().toLowerCase());
      toast.success("We sent a verification code to your email");
      router.replace("/verify-otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-24">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
            aria-hidden
          />
          <p className="font-heading text-sm font-semibold text-brand-dark">Setting the table…</p>
        </div>
      </main>
    );
  }

  const inputBase =
    "mt-2 w-full rounded-lg border px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:ring-4";
  const inputOk =
    "border-gray-200 bg-white text-brand-dark ring-brand-red/10 focus:border-brand-red focus:ring-brand-red/15";
  const inputErr = "border-red-400 bg-white text-brand-dark ring-red-500/15 focus:border-red-500";
  const labelCls = "text-xs font-bold uppercase tracking-wider text-gray-500";
  const sectionTitle = "text-xs font-bold uppercase tracking-[0.15em] text-brand-red";

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-white lg:min-h-[640px] lg:flex-row">
      {/* Desktop brand column */}
      <div className="relative hidden min-h-[480px] w-full lg:flex lg:min-h-0 lg:w-[44%] lg:max-w-none">
        <Image src={PANEL_IMG} alt="" fill className="object-cover" sizes="44vw" priority />
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark/95 to-brand-red/85"
          aria-hidden
        />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:24px_24px]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">For caterers</p>
            <h1 className="font-heading mt-4 max-w-md text-3xl font-extrabold leading-tight text-white xl:text-4xl">
              List your business on{" "}
              <span className="text-brand-yellow">Bharat Catering</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
              Create your workspace in minutes. Verify your email, then publish menus and connect with hosts
              across India.
            </p>
          </div>
          <ul className="space-y-4">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex gap-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/90 text-white">
                  <Icon className="text-xl" weight="duotone" aria-hidden />
                </span>
                <div>
                  <p className="font-heading font-bold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile intro */}
      <div className="relative overflow-hidden bg-brand-dark px-6 py-8 lg:hidden">
        <div className="absolute -right-8 top-0 h-28 w-28 rounded-full bg-brand-red/35 blur-2xl" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">For caterers</p>
        <h1 className="font-heading mt-2 text-2xl font-extrabold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-white/70">Join Bharat Catering and reach more hosts.</p>
        <ul className="mt-6 space-y-3">
          {benefits.map(({ icon: Icon, title }) => (
            <li key={title} className="flex items-center gap-3 text-sm font-medium text-white/90">
              <Icon className="shrink-0 text-brand-yellow" weight="fill" aria-hidden />
              {title}
            </li>
          ))}
        </ul>
      </div>

      {/* Form column */}
      <div className="relative flex flex-1 flex-col justify-center bg-gradient-to-b from-gray-50/90 to-white px-5 py-10 sm:px-10 lg:px-12 xl:px-14">
        <div className="pointer-events-none absolute -left-24 bottom-32 h-56 w-56 rounded-full bg-brand-yellow/[0.07] blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-24 h-48 w-48 rounded-full bg-brand-red/[0.06] blur-3xl" aria-hidden />

        <div className="relative mx-auto w-full max-w-[460px]">
          <div className="mb-6 hidden lg:block">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-brand-dark xl:text-[1.65rem]">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Already with us?{" "}
              <Link href="/login" className="font-semibold text-brand-red hover:underline">
                Log in
              </Link>
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white/95 p-6 shadow-[0_24px_80px_-24px_rgba(28,28,28,0.12)] backdrop-blur-sm sm:p-8">
            <p className="mb-6 text-sm text-gray-600 lg:hidden">
              Already with us?{" "}
              <Link href="/login" className="font-semibold text-brand-red">
                Log in
              </Link>
            </p>

            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
              <div className="space-y-4">
                <p className={sectionTitle}>About you</p>
                <div>
                  <label htmlFor="reg-name" className={labelCls}>
                    Full name
                  </label>
                  <input
                    id="reg-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      clearError("fullName");
                    }}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "reg-name-error" : undefined}
                    className={`${inputBase} ${errors.fullName ? inputErr : inputOk}`}
                  />
                  <FormFieldError id="reg-name-error" message={errors.fullName} />
                </div>
                <div>
                  <label htmlFor="reg-business" className={labelCls}>
                    Business or brand name
                  </label>
                  <input
                    id="reg-business"
                    name="businessName"
                    type="text"
                    autoComplete="organization"
                    placeholder="e.g. Spice Route Catering"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      clearError("businessName");
                    }}
                    aria-invalid={Boolean(errors.businessName)}
                    aria-describedby={errors.businessName ? "reg-business-error" : undefined}
                    className={`${inputBase} ${errors.businessName ? inputErr : inputOk}`}
                  />
                  <FormFieldError id="reg-business-error" message={errors.businessName} />
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-6">
                <p className={sectionTitle}>Contact & sign-in</p>
                <div>
                  <label htmlFor="reg-email" className={labelCls}>
                    Work email
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@yourbusiness.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "reg-email-error" : undefined}
                    className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                  />
                  <FormFieldError id="reg-email-error" message={errors.email} />
                </div>
                <div>
                  <label htmlFor="reg-phone" className={labelCls}>
                    Phone
                  </label>
                  <div
                    className={`mt-2 flex w-full min-w-0 items-stretch border-0 border-b-2 bg-transparent pb-0.5 transition-colors focus-within:border-brand-red ${
                      errors.phoneCountryCode || errors.phoneNumber
                        ? "border-b-red-500 focus-within:border-red-500"
                        : "border-b-gray-300"
                    }`}
                  >
                    <div className="flex shrink-0 items-center gap-2 py-2.5 pr-1 sm:py-3">
                      <span className="text-[1.35rem] leading-none" title={selectedCountry.name} aria-hidden>
                        {flagEmoji(selectedCountry.iso2)}
                      </span>
                      <div className="relative flex items-center">
                        <select
                          id="reg-country"
                          name="country"
                          aria-label={`Country code, ${selectedCountry.name}`}
                          value={countryIso}
                          onChange={(e) => {
                            setCountryIso(e.target.value);
                            clearPhoneErrors();
                          }}
                          className="min-w-[3rem] max-w-[5.5rem] cursor-pointer appearance-none border-0 bg-transparent py-0 pr-5 pl-0 text-sm font-semibold tabular-nums text-brand-dark outline-none ring-0 focus:ring-0 sm:max-w-[6rem]"
                        >
                          {PHONE_COUNTRY_OPTIONS.map((c) => (
                            <option key={c.iso2} value={c.iso2} title={c.name}>
                              {dialSelectLabel(c)}
                            </option>
                          ))}
                        </select>
                        <span
                          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-gray-400"
                          aria-hidden
                        >
                          ▼
                        </span>
                      </div>
                    </div>
                    <div className="mx-2 my-2.5 w-px shrink-0 self-stretch bg-gray-200 sm:mx-3 sm:my-3" aria-hidden />
                    <input
                      id="reg-phone"
                      name="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="Phone number"
                      maxLength={14}
                      value={phoneNumber}
                      onChange={(e) => onPhoneNationalChange(e.target.value)}
                      aria-invalid={Boolean(errors.phoneCountryCode || errors.phoneNumber)}
                      aria-describedby="reg-phone-error"
                      className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-brand-dark outline-none ring-0 placeholder:text-gray-400 focus:ring-0 sm:min-w-[12rem] sm:py-3"
                    />
                  </div>
                  <FormFieldError
                    id="reg-phone-error"
                    message={errors.phoneCountryCode || errors.phoneNumber}
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className={labelCls}>
                    Password
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError("password");
                    }}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "reg-password-error" : undefined}
                    className={`${inputBase} ${errors.password ? inputErr : inputOk}`}
                  />
                  <FormFieldError id="reg-password-error" message={errors.password} />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group relative mt-1 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand-red text-sm font-bold text-white shadow-lg shadow-brand-red/25 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                <span className="relative z-10">
                  {submitting ? "Creating your workspace…" : "Continue — verify email next"}
                </span>
                {!submitting ? (
                  <CaretRight
                    className="relative z-10 shrink-0 text-xl transition-transform duration-300 group-hover:translate-x-0.5 pointer-events-none"
                    aria-hidden
                  />
                ) : null}
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition duration-500 group-hover:translate-x-full"
                  aria-hidden
                />
              </button>
              <p className="text-center text-xs leading-relaxed text-gray-500">
                By continuing you agree we&apos;ll email you a one-time code to confirm this address.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
