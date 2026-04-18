"use client";

import { FormFieldError } from "@/components/common/FormFieldError";
import { OtpInput } from "@/components/common/OtpInput";
import { setStoredToken, verifyOtp, resendVerificationEmail } from "@/lib/auth-api";
import { clearPendingVerifyEmail, getPendingVerifyEmail } from "@/lib/pending-verify-email";
import { postAuthPath } from "@/lib/post-auth-path";
import { verifyOtpFormSchema, zodFieldErrors } from "@/lib/validation/auth-forms";
import { z } from "zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type FieldErrors = Partial<Record<"email" | "code", string>>;

const emailOnlySchema = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .email("Enter a valid email address");

function VerifyOtpForm() {
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
      const parsed = verifyOtpFormSchema.safeParse({ email, code: codeStr });
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
        toast.success("Email verified — you’re signed in");
        window.location.assign(postAuthPath(res.user));
      } catch (err) {
        setCode("");
        setErrors({ code: "Invalid or expired code. Try again or request a new code." });
        toast.error(err instanceof Error ? err.message : "Verification failed");
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
      setErrors({ email: parsed.error.issues[0]?.message ?? "Invalid email" });
      return;
    }
    setErrors((e) => ({ ...e, email: undefined }));
    setResending(true);
    try {
      await resendVerificationEmail(parsed.data);
      toast.success("If this account exists and is unverified, we sent a new code.");
      setCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setResending(false);
    }
  }

  const inputBase =
    "mt-1.5 w-full rounded-xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-4";
  const inputOk =
    "border-stone-200 bg-white text-stone-900 ring-[var(--primary)]/25 focus:border-[var(--primary)]";
  const inputErr =
    "border-red-500/80 bg-white text-stone-900 ring-red-500/20 focus:border-red-500";

  return (
    <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="card-shadow w-full max-w-lg rounded-[var(--radius-xl)] border border-stone-200/80 bg-[var(--surface)] p-8 sm:p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
          Verify your email
        </h1>
        {fromLogin ? (
          <p className="mt-2 rounded-xl bg-[var(--primary-soft)] px-3 py-2 text-sm font-medium text-stone-800">
            Finish signing in — enter the code we sent to your inbox.
          </p>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
          Enter the 6-digit code we sent to your email. Codes expire in 15 minutes.
          {process.env.NODE_ENV === "development" ? (
            <span className="mt-2 block rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Dev API: <code className="font-mono">REGISTRATION_FIXED_OTP=true</code> and{" "}
              <code className="font-mono">REGISTRATION_OTP_CODE=123456</code> in backend{" "}
              <code className="font-mono">.env</code> (values like <code className="font-mono">True</code> or{" "}
              <code className="font-mono">1</code> work). If <code className="font-mono">NODE_ENV=production</code>{" "}
              is set locally, add <code className="font-mono">ALLOW_FIXED_OTP_IN_PRODUCTION=true</code> or remove{" "}
              <code className="font-mono">NODE_ENV</code>. Resend code after changing env. Test inbox:{" "}
              <code className="font-mono">DEV_OTP_EMAIL</code> / <code className="font-mono">DEV_OTP_CODE</code>.
            </span>
          ) : null}
        </p>

        <form noValidate onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
          <div>
            <label htmlFor="otp-email" className="block text-sm font-semibold text-stone-700">
              Email
            </label>
            <input
              id="otp-email"
              name="email"
              type="email"
              autoComplete="email"
              readOnly={emailReadOnly}
              value={email}
              onChange={(e) => {
                if (emailReadOnly) return;
                setEmail(e.target.value);
                clearError("email");
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "otp-email-error" : undefined}
              className={`${inputBase} ${errors.email ? inputErr : inputOk} ${emailReadOnly ? "cursor-default bg-stone-50 text-stone-700" : ""}`}
            />
            <FormFieldError id="otp-email-error" message={errors.email} />
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-[#faf8f6] to-white p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.9)] ring-1 ring-stone-100/80 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
                One-time code
              </p>
              <span className="text-[10px] font-semibold text-stone-400">Paste supported</span>
            </div>
            <div className="mt-4">
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
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/25 transition hover:opacity-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Verifying…" : "Verify and continue"}
            </button>
            <button
              type="button"
              disabled={resending || submitting}
              onClick={onResend}
              className="text-sm font-semibold text-[var(--primary)] underline-offset-2 hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-[var(--foreground-muted)]">
          <Link href="/login" className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
          <p className="text-sm font-medium text-stone-500">Loading…</p>
        </main>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
