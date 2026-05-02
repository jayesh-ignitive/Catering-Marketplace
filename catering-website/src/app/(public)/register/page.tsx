"use client";

import {
  PartnerOnboardingAuthShell,
  obInputClass,
  obLabel,
  obPrimaryBtn,
} from "@/components/auth/PartnerOnboardingAuthShell";
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
import { ArrowRight } from "@phosphor-icons/react";
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
      <main className="flex flex-1 flex-col items-center justify-center bg-brand-gray px-4 py-24">
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

  const phoneErr = Boolean(errors.phoneCountryCode || errors.phoneNumber);
  const phoneShell = phoneErr
    ? "rounded-sm border !border-brand-red outline-none ring-0 ring-offset-0 transition-colors focus-within:border-brand-red focus-within:outline-none focus-within:ring-0"
    : "rounded-sm border border-[#E5E7EB] outline-none ring-0 ring-offset-0 transition-colors focus-within:border-brand-red focus-within:outline-none focus-within:ring-0";

  return (
    <PartnerOnboardingAuthShell
      title="Tell us about your business"
      subtitle={
        <p>
          Let&apos;s start with the basics — then we&apos;ll email you a code to verify your address. Already
          registered?{" "}
          <Link href="/login" className="font-semibold text-brand-red hover:underline">
            Log in
          </Link>
        </p>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-6">
        <div>
          <label htmlFor="reg-business" className={obLabel}>
            Business name *
          </label>
          <input
            id="reg-business"
            name="businessName"
            type="text"
            autoComplete="organization"
            placeholder="e.g. Royal Rajputana Caterers"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              clearError("businessName");
            }}
            aria-invalid={Boolean(errors.businessName)}
            aria-describedby={errors.businessName ? "reg-business-error" : undefined}
            className={obInputClass(Boolean(errors.businessName))}
          />
          <FormFieldError id="reg-business-error" message={errors.businessName} />
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
          <div>
            <label htmlFor="reg-name" className={obLabel}>
              Contact person *
            </label>
            <input
              id="reg-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError("fullName");
              }}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "reg-name-error" : undefined}
              className={obInputClass(Boolean(errors.fullName))}
            />
            <FormFieldError id="reg-name-error" message={errors.fullName} />
          </div>
          <div>
            <label htmlFor="reg-phone" className={obLabel}>
              Mobile number *
            </label>
            <div className={`flex min-w-0 items-stretch overflow-hidden bg-white ${phoneShell}`}>
              <div className="flex shrink-0 items-center gap-2 border-r border-[#E5E7EB] px-3 py-3 sm:px-4">
                <span className="text-[1.25rem] leading-none" title={selectedCountry.name} aria-hidden>
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
                    className="max-w-[5.5rem] cursor-pointer appearance-none border-0 bg-transparent py-0 pr-4 pl-0 text-sm font-medium tabular-nums text-[#111827] outline-none ring-0 focus:ring-0 sm:max-w-[6.5rem]"
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
              <input
                id="reg-phone"
                name="phoneNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="00000 00000"
                maxLength={14}
                value={phoneNumber}
                onChange={(e) => onPhoneNationalChange(e.target.value)}
                aria-invalid={phoneErr}
                aria-describedby="reg-phone-error"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3.5 text-sm text-[#111827] outline-none ring-0 placeholder:text-[#9CA3AF] focus:ring-0 sm:px-4"
              />
            </div>
            <FormFieldError id="reg-phone-error" message={errors.phoneCountryCode || errors.phoneNumber} />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className={obLabel}>
            Email address *
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="hello@yourbusiness.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "reg-email-error" : undefined}
            className={obInputClass(Boolean(errors.email))}
          />
          <FormFieldError id="reg-email-error" message={errors.email} />
        </div>

        <div>
          <label htmlFor="reg-password" className={obLabel}>
            Password *
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
            className={obInputClass(Boolean(errors.password))}
          />
          <FormFieldError id="reg-password-error" message={errors.password} />
        </div>

        <button type="submit" disabled={submitting} className={`group ${obPrimaryBtn} mt-4`}>
          <span>{submitting ? "Creating your workspace…" : "Continue — verify email next"}</span>
          {!submitting ? (
            <ArrowRight
              className="text-lg transition-transform duration-300 group-hover:translate-x-0.5"
              weight="bold"
              aria-hidden
            />
          ) : null}
        </button>

        <p className="text-center text-sm text-gray-600">
          By continuing you agree we&apos;ll email you a one-time code to confirm this address.
        </p>
      </form>
    </PartnerOnboardingAuthShell>
  );
}
