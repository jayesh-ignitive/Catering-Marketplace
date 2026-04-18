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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaRegCalendarCheck, FaStore, FaUtensils } from "react-icons/fa6";
import { toast } from "react-toastify";

type RegFields =
  | "fullName"
  | "email"
  | "businessName"
  | "phoneCountryCode"
  | "phoneNumber"
  | "password";

type FieldErrors = Partial<Record<RegFields, string>>;

const benefits = [
  {
    icon: FaUtensils,
    title: "Menus guests actually read",
    text: "Show packages, dietary options, and pricing in a clear, professional layout.",
  },
  {
    icon: FaRegCalendarCheck,
    title: "Bookings without the chaos",
    text: "Keep event details, headcounts, and dates organised in one workspace.",
  },
  {
    icon: FaStore,
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
      <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-sm font-medium text-stone-500">Loading…</p>
      </main>
    );
  }

  const inputBase =
    "mt-1.5 w-full rounded-xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-4";
  const inputOk =
    "border-stone-200 bg-white text-stone-900 ring-[var(--primary)]/25 focus:border-[var(--primary)]";
  const inputErr =
    "border-red-500/80 bg-white text-stone-900 ring-red-500/20 focus:border-red-500";
  const labelCls = "block text-sm font-semibold text-stone-800";
  const sectionTitle = "text-xs font-bold uppercase tracking-[0.12em] text-stone-500";

  return (
    <main className="mesh-hero flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-16 lg:py-16">
        <div className="order-2 flex flex-col justify-center space-y-8 lg:order-1 lg:pr-4">
          <header className="space-y-4">
            <p className="text-sm font-semibold tracking-wide text-[var(--primary)]">
              Join catering teams on the platform
            </p>
            <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-stone-900 sm:text-4xl lg:text-[2.35rem]">
              Your kitchen deserves a{" "}
              <span className="text-gradient-brand">smarter back office</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-[var(--foreground-muted)]">
              Create your workspace in minutes. Verify your email, then start adding menus,
              managing events, and keeping orders under control — without spreadsheets and
              scattered messages.
            </p>
          </header>
          <ul className="grid gap-4 sm:grid-cols-1 sm:gap-5">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl border border-stone-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm sm:p-5"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-lg text-[var(--primary)]"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-stone-900">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-muted)]">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 lg:order-2">
          <div className="card-shadow relative overflow-hidden rounded-[var(--radius-xl)] border border-stone-200/80 bg-[var(--surface)] p-8 sm:p-9">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-[0.12]"
              style={{
                background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
              }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-2xl">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                Already with us?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
                >
                  Log in
                </Link>
              </p>

              <form noValidate onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
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

                <div className="space-y-4 border-t border-stone-100 pt-6">
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
                    {/* Underline-style phone row: flag + code | number (matches material / compact UX) */}
                    <div
                      className={`mt-2 flex w-full min-w-0 items-stretch border-0 border-b-2 bg-transparent pb-0.5 transition-colors focus-within:border-[var(--primary)] ${
                        errors.phoneCountryCode || errors.phoneNumber
                          ? "border-b-red-500 focus-within:border-red-500"
                          : "border-b-stone-300"
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
                            className="min-w-[3rem] max-w-[5.5rem] cursor-pointer appearance-none border-0 bg-transparent py-0 pr-5 pl-0 text-sm font-semibold tabular-nums text-stone-900 outline-none ring-0 focus:ring-0 sm:max-w-[6rem]"
                          >
                            {PHONE_COUNTRY_OPTIONS.map((c) => (
                              <option key={c.iso2} value={c.iso2} title={c.name}>
                                {dialSelectLabel(c)}
                              </option>
                            ))}
                          </select>
                          <span
                            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-stone-400"
                            aria-hidden
                          >
                            ▼
                          </span>
                        </div>
                      </div>
                      <div
                        className="mx-2 my-2.5 w-px shrink-0 self-stretch bg-stone-200 sm:mx-3 sm:my-3"
                        aria-hidden
                      />
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
                        className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-stone-900 outline-none ring-0 placeholder:text-stone-400 focus:ring-0 sm:min-w-[12rem] sm:py-3"
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
                  className="mt-1 w-full rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] py-3.5 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/25 transition hover:opacity-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Creating your workspace…" : "Continue — verify email next"}
                </button>
                <p className="text-center text-xs leading-relaxed text-stone-500">
                  By continuing you agree we’ll email you a one-time code to confirm this address.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
