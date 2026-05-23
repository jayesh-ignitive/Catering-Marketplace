"use client";

import {
  PartnerOnboardingAuthShell,
  obInputClass,
  obLabel,
  obPrimaryBtn,
  obSecondaryOutlineBtn,
  obTextLink,
} from "@/components/auth/PartnerOnboardingAuthShell";
import { ExtensionSafeEmailInput } from "@/components/common/ExtensionSafeEmailInput";
import { FormFieldError } from "@/components/common/FormFieldError";
import { OtpInput } from "@/components/common/OtpInput";
import { setStoredToken, verifyOtp, resendVerificationEmail } from "@/lib/auth-api";
import { clearPendingVerifyEmail, getPendingVerifyEmail } from "@/lib/pending-verify-email";
import { useI18n } from "@/context/LocaleContext";
import { postAuthPath } from "@/lib/post-auth-path";
import { createVerifyOtpFormSchema, zodFieldErrors } from "@/lib/validation/auth-forms";
import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { z } from "zod";

type FieldErrors = Partial<Record<"email" | "code", string>>;

function VerifyOtpForm() {
  const { w } = useI18n();
  const v = w.auth.validation;
  const emailOnlySchema = z.string().trim().min(1, v.enterEmail).email(v.validEmail);
  const params = useSearchParams();
  const fromLogin = params.get("from") === "login";
  const [email, setEmail] = useState("");
  const [emailReadOnly, setEmailReadOnly] = useState(false);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const pending = getPendingVerifyEmail();
    if (pending) {
      setEmail(pending);
      setEmailReadOnly(true);
    }
  }, []);

  function clearError(field: keyof FieldErrors) {
    setErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  }

  const runVerify = useCallback(
    async (codeStr: string) => {
      const parsed = createVerifyOtpFormSchema(v).safeParse({ email, code: codeStr });
      if (!parsed.success) {
        setErrors(zodFieldErrors(parsed.error) as FieldErrors);
        return;
      }
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setErrors({});
      setSubmitting(true);
      try {
        const res = await verifyOtp(parsed.data);
        clearPendingVerifyEmail();
        setStoredToken(res.accessToken);
        toast.success(w.auth.verifyOtp.emailVerified);
        window.location.assign(postAuthPath(res.user));
      } catch (err) {
        setCode("");
        setErrors({ code: w.auth.verifyOtp.invalidCode });
        toast.error(err instanceof Error ? err.message : w.auth.verifyOtp.verificationFailed);
      } finally {
        inFlightRef.current = false;
        setSubmitting(false);
      }
    },
    [email]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runVerify(code);
  }

  async function onResend() {
    const parsed = emailOnlySchema.safeParse(email);
    if (!parsed.success) {
      setErrors({ email: parsed.error.issues[0]?.message ?? w.auth.verifyOtp.invalidEmail });
      return;
    }
    setErrors((e) => ({ ...e, email: undefined }));
    setResending(true);
    try {
      await resendVerificationEmail(parsed.data);
      toast.success(w.auth.verifyOtp.resendSuccess);
      setCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : w.auth.verifyOtp.resendFailed);
    } finally {
      setResending(false);
    }
  }

  return (
    <PartnerOnboardingAuthShell
      title={w.auth.verifyOtp.title}
      subtitle={<p>{w.auth.verifyOtp.subtitle}</p>}
    >
      {fromLogin ? (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-brand-dark">
            {w.auth.verifyOtp.fromLoginBanner}
          </p>
        </div>
      ) : null}

      <form noValidate onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="otp-email" className={obLabel}>
            {w.auth.verifyOtp.email}
          </label>
          <ExtensionSafeEmailInput
            id="otp-email"
            name="email"
            readOnly={emailReadOnly}
            value={email}
            onChange={(e) => {
              if (emailReadOnly) return;
              setEmail(e.target.value);
              clearError("email");
            }}
            placeholder={w.auth.verifyOtp.emailPlaceholder}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "otp-email-error" : undefined}
            className={`${obInputClass(Boolean(errors.email))} ${emailReadOnly ? "cursor-default bg-gray-50" : ""}`}
          />
          <FormFieldError id="otp-email-error" message={errors.email} />
        </div>

        <div>
          <p className={obLabel}>{w.auth.verifyOtp.otpLabel}</p>
          <OtpInput
            value={code}
            onChange={(digits) => {
              setCode(digits);
              clearError("code");
            }}
            onComplete={
              email.trim()
                ? (digits) => {
                    void runVerify(digits);
                  }
                : undefined
            }
            disabled={submitting}
            hasError={Boolean(errors.code)}
            autoFocus={Boolean(email.trim())}
          />
          <FormFieldError id="otp-code-error" message={errors.code} />
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <button type="submit" disabled={submitting || code.length !== 6} className={`group ${obPrimaryBtn}`}>
            <span>{submitting ? w.auth.verifyOtp.submitting : w.auth.verifyOtp.submit}</span>
            {!submitting ? (
              <ArrowRight
                className="text-lg transition-transform duration-300 group-hover:translate-x-0.5"
                weight="bold"
                aria-hidden
              />
            ) : null}
          </button>
          <button
            type="button"
            disabled={resending || submitting}
            onClick={onResend}
            className={`${obSecondaryOutlineBtn} py-2.5 text-sm`}
          >
            {resending ? w.auth.verifyOtp.resending : w.auth.verifyOtp.resend}
          </button>
        </div>
      </form>

      <p className="mt-10 text-center text-sm text-gray-600">
        <Link href="/login" className={obTextLink}>
          {w.auth.verifyOtp.backToLogin}
        </Link>
        {" · "}
        <Link href="/register" className={obTextLink}>
          {w.auth.verifyOtp.createAccount}
        </Link>
      </p>
    </PartnerOnboardingAuthShell>
  );
}

export default function VerifyOtpPage() {
  const { w } = useI18n();
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center bg-brand-gray px-4 py-24">
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
              aria-hidden
            />
            <p className="font-heading text-sm font-semibold text-brand-dark">
              {w.auth.verifyOtp.loadingVerification}
            </p>
          </div>
        </main>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
