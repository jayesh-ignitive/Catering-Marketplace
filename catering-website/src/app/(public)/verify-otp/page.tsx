"use client";

import { FormFieldError } from "@/components/common/FormFieldError";
import { OtpInput } from "@/components/common/OtpInput";
import { setStoredToken, verifyOtp, resendVerificationEmail } from "@/lib/auth-api";
import { clearPendingVerifyEmail, getPendingVerifyEmail } from "@/lib/pending-verify-email";
import { postAuthPath } from "@/lib/post-auth-path";
import { verifyOtpFormSchema, zodFieldErrors } from "@/lib/validation/auth-forms";
import {
  CaretRight,
  ChefHat,
  Envelope,
  Key,
  SealCheck,
  Sparkle,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { z } from "zod";

type FieldErrors = Partial<Record<"email" | "code", string>>;

const emailOnlySchema = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .email("Enter a valid email address");

const PANEL_IMG =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80";

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

  const fieldWrap =
    "group relative rounded-2xl border bg-white/80 shadow-[0_1px_2px_rgba(28,28,28,0.04)] transition-all duration-200";
  const fieldWrapOk =
    "border-gray-200/90 focus-within:border-brand-red/35 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(229,57,53,0.08),0_4px_24px_-8px_rgba(28,28,28,0.12)]";
  const fieldWrapErr =
    "border-red-300 bg-red-50/30 shadow-[0_0_0_4px_rgba(239,68,68,0.08)]";

  const inputInner =
    "w-full rounded-2xl border-0 bg-transparent py-3.5 pl-11 pr-4 text-[15px] font-medium tracking-tight text-brand-dark outline-none ring-0 placeholder:text-gray-400 focus:ring-0 read-only:cursor-default read-only:bg-gray-50/80";

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[#fafafa] lg:min-h-[560px] lg:flex-row">
      <div className="relative hidden min-h-[420px] w-full overflow-hidden lg:flex lg:min-h-0 lg:w-[46%] lg:max-w-none">
        <Image src={PANEL_IMG} alt="" fill className="object-cover" sizes="46vw" priority />
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark/92 to-brand-red/80"
          aria-hidden
        />
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:24px_24px]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm">
              <Sparkle className="text-brand-yellow" weight="fill" aria-hidden />
              Bharat Catering
            </div>
            <h2 className="font-heading mt-10 max-w-md text-4xl font-extrabold leading-[1.1] text-white xl:text-5xl">
              Confirm it&apos;s{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-brand-yellow">you</span>
                <span
                  className="absolute -bottom-1 left-0 h-3 w-full -skew-y-1 bg-brand-red/90"
                  aria-hidden
                />
              </span>
            </h2>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-white/75">
              One quick step keeps your catering account secure and helps guests trust your business on our
              directory.
            </p>
          </div>
          <div className="flex items-end justify-between gap-6 border-t border-white/10 pt-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <SealCheck className="text-3xl text-brand-yellow" weight="fill" aria-hidden />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-white">Secure verification</p>
                <p className="text-sm text-white/60">6-digit code · expires in 15 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-brand-dark px-6 py-10 lg:hidden">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-red/30 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">Email verification</p>
          <h1 className="font-heading mt-2 text-3xl font-extrabold text-white">Verify your email</h1>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Enter the code we sent you — then you&apos;re ready to manage your listing.
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-center px-5 py-12 sm:px-10 lg:px-12 xl:px-16">
        <div
          className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-brand-red/[0.06] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-10 h-48 w-48 rounded-full bg-brand-yellow/[0.08] blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-[440px]">
          <div className="mb-8 hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/15 bg-brand-red/[0.06] px-3 py-1.5">
              <Key className="text-lg text-brand-red" weight="duotone" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-red">
                One-time code
              </span>
            </div>
            <h1 className="font-heading mt-5 text-[1.75rem] font-extrabold tracking-tight text-brand-dark sm:text-[2rem]">
              Verify your email
            </h1>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-gray-500">
              Check spam folders first. Need a fresh code? Use <span className="font-semibold text-brand-dark">Resend code</span>{" "}
              under the digit boxes.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.35rem] border border-gray-100/80 bg-white shadow-[0_32px_64px_-28px_rgba(28,28,28,0.14),0_0_0_1px_rgba(28,28,28,0.04)]">
            <div className="h-1 w-full bg-gradient-to-r from-brand-red via-amber-400 to-brand-red" aria-hidden />

            <div className="p-7 sm:p-9">
              {fromLogin ? (
                <div className="mb-6 rounded-2xl border border-brand-red/15 bg-brand-red/[0.05] px-4 py-3">
                  <p className="text-sm font-semibold leading-snug text-brand-dark">
                    Finish signing in — enter the code we sent to your inbox.
                  </p>
                </div>
              ) : null}

              <div className="mb-8 border-b border-gray-100 pb-6">
                <p className="font-heading text-lg font-bold text-brand-dark">6-digit code</p>
                <p className="mt-1 text-sm text-gray-500">
                  Codes expire in 15 minutes. Paste works — all boxes fill at once.
                </p>
              </div>

              {process.env.NODE_ENV === "development" ? (
                <div className="mb-6 rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-left text-xs leading-relaxed text-amber-950">
                  <p className="font-bold text-amber-900">Development</p>
                  <p className="mt-1.5 text-amber-950/90">
                    API: <code className="rounded bg-white/80 px-1 font-mono">REGISTRATION_FIXED_OTP=true</code>{" "}
                    and <code className="rounded bg-white/80 px-1 font-mono">REGISTRATION_OTP_CODE=123456</code>{" "}
                    in backend <code className="font-mono">.env</code>. If{" "}
                    <code className="font-mono">NODE_ENV=production</code> locally, add{" "}
                    <code className="rounded bg-white/80 px-1 font-mono">ALLOW_FIXED_OTP_IN_PRODUCTION=true</code>{" "}
                    or unset <code className="font-mono">NODE_ENV</code>. Resend after env changes. Test inbox:{" "}
                    <code className="font-mono">DEV_OTP_EMAIL</code> / <code className="font-mono">DEV_OTP_CODE</code>
                    .
                  </p>
                </div>
              ) : null}

              <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
                <div className="space-y-2">
                  <label htmlFor="otp-email" className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-brand-dark">Email</span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      {emailReadOnly ? "From sign-up" : "Required"}
                    </span>
                  </label>
                  <div className={`${fieldWrap} ${errors.email ? fieldWrapErr : fieldWrapOk}`}>
                    <Envelope
                      className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand-red"
                      size={22}
                      aria-hidden
                    />
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
                      placeholder="name@company.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "otp-email-error" : undefined}
                      className={inputInner}
                    />
                  </div>
                  <FormFieldError id="otp-email-error" message={errors.email} />
                </div>

                <div className="rounded-2xl border border-gray-100/90 bg-gradient-to-b from-gray-50/90 to-white p-5 ring-1 ring-gray-100/80 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-red">
                      Verification code
                    </p>
                    <span className="text-[10px] font-semibold text-gray-400">Paste supported</span>
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
                    className="group flex h-[52px] min-w-[180px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-red px-6 text-[15px] font-bold text-white shadow-[0_8px_28px_-6px_rgba(229,57,53,0.55)] transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[0_14px_36px_-8px_rgba(229,57,53,0.45)] active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none sm:flex-1"
                  >
                    <span>{submitting ? "Verifying…" : "Verify and continue"}</span>
                    {!submitting ? (
                      <CaretRight
                        className="pointer-events-none text-xl transition-transform duration-300 group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    disabled={resending || submitting}
                    onClick={onResend}
                    className="text-center text-sm font-semibold text-brand-red underline-offset-4 hover:underline disabled:opacity-50 sm:shrink-0 sm:text-left"
                  >
                    {resending ? "Sending…" : "Resend code"}
                  </button>
                </div>
              </form>

              <div className="mt-8 rounded-2xl bg-gray-50/80 px-4 py-3 text-center">
                <p className="text-sm text-gray-600">
                  <Link
                    href="/login"
                    className="font-semibold text-brand-dark underline-offset-4 hover:text-brand-red hover:underline"
                  >
                    Back to log in
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-gray-400 lg:hidden">
            <ChefHat className="text-brand-red" size={16} aria-hidden />
            <span>
              <Link href="/register" className="font-semibold text-brand-red hover:underline">
                Create an account
              </Link>{" "}
              to list your business
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center bg-[#fafafa] px-4 py-24">
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-brand-red border-t-transparent"
              aria-hidden
            />
            <p className="font-heading text-sm font-semibold text-brand-dark">Loading verification…</p>
          </div>
        </main>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
