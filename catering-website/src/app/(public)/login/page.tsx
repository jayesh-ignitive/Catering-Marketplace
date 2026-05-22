"use client";

import {
  PartnerOnboardingAuthShell,
  obInputClass,
  obLabel,
  obPrimaryBtn,
  obTextLink,
} from "@/components/auth/PartnerOnboardingAuthShell";
import { FormFieldError } from "@/components/common/FormFieldError";
import { useAuth } from "@/context/AuthContext";
import { AuthApiError } from "@/lib/auth-api";
import { setPendingVerifyEmail } from "@/lib/pending-verify-email";
import { useI18n } from "@/context/LocaleContext";
import { postAuthPath } from "@/lib/post-auth-path";
import { createLoginFormSchema, zodFieldErrors } from "@/lib/validation/auth-forms";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "react-toastify";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export default function LoginPage() {
  const { w } = useI18n();
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(postAuthPath(user));
  }, [ready, user, router]);

  function clearError(field: keyof FieldErrors) {
    setErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createLoginFormSchema(w.auth.validation).safeParse({ email, password });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error) as FieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const u = await login(parsed.data.email, parsed.data.password);
      toast.success(w.auth.login.signedIn);
      router.push(postAuthPath(u));
    } catch (err) {
      if (err instanceof AuthApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setPendingVerifyEmail(parsed.data.email);
        toast.info(w.auth.login.verifyRedirect);
        router.replace("/verify-otp?from=login");
        return;
      }
      toast.error(err instanceof Error ? err.message : w.auth.login.signInFailed);
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
          <p className="font-heading text-sm font-semibold text-brand-dark">{w.auth.preparingKitchen}</p>
        </div>
      </main>
    );
  }

  return (
    <PartnerOnboardingAuthShell
      title={w.auth.login.title}
      subtitle={
        <p>
          {w.auth.login.subtitlePrefix}{" "}
          <Link href="/register" className={obTextLink}>
            {w.auth.login.subtitleLink}
          </Link>{" "}
          {w.auth.login.subtitleSuffix}
        </p>
      }
    >
      <form noValidate onSubmit={onSubmit} className="space-y-6">
        <div>
          <label htmlFor={emailId} className={obLabel}>
            {w.auth.login.workEmail}
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            placeholder={w.auth.login.emailPlaceholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className={obInputClass(Boolean(errors.email))}
          />
          <FormFieldError id="login-email-error" message={errors.email} />
        </div>

        <div>
          <label htmlFor={passwordId} className={obLabel}>
            {w.auth.login.password}
          </label>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={w.auth.login.passwordPlaceholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className={`${obInputClass(Boolean(errors.password))} pr-12`}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-[#9CA3AF] transition-colors hover:bg-gray-100 hover:text-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1"
              aria-label={showPassword ? w.auth.login.hidePassword : w.auth.login.showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeSlash size={22} className="pointer-events-none" aria-hidden />
              ) : (
                <Eye size={22} className="pointer-events-none" aria-hidden />
              )}
            </button>
          </div>
          <FormFieldError id="login-password-error" message={errors.password} />
        </div>

        <button type="submit" disabled={submitting} className={`group mt-2 ${obPrimaryBtn}`}>
          <span>{submitting ? "Signing in…" : "Sign in"}</span>
          {!submitting ? (
            <ArrowRight
              className="text-lg transition-transform duration-300 group-hover:translate-x-0.5"
              weight="bold"
              aria-hidden
            />
          ) : null}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#6B7280]">
        <Link href="/verify-otp" className={obTextLink}>
          {w.auth.login.haveVerificationCode}
        </Link>
      </p>
    </PartnerOnboardingAuthShell>
  );
}
