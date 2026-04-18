"use client";

import { FormFieldError } from "@/components/common/FormFieldError";
import { useAuth } from "@/context/AuthContext";
import { AuthApiError } from "@/lib/auth-api";
import { setPendingVerifyEmail } from "@/lib/pending-verify-email";
import { postAuthPath } from "@/lib/post-auth-path";
import { loginFormSchema, zodFieldErrors } from "@/lib/validation/auth-forms";
import { CaretRight, ChefHat, Envelope, Eye, EyeSlash, Lock, LockKey, Sparkle } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "react-toastify";

type FieldErrors = Partial<Record<"email" | "password", string>>;

const PANEL_IMG =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80";

export default function LoginPage() {
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
    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error) as FieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const u = await login(parsed.data.email, parsed.data.password);
      toast.success("Signed in");
      router.push(postAuthPath(u));
    } catch (err) {
      if (err instanceof AuthApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setPendingVerifyEmail(parsed.data.email);
        toast.info("Enter the verification code we sent you.");
        router.replace("/verify-otp?from=login");
        return;
      }
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
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
          <p className="font-heading text-sm font-semibold text-brand-dark">Preparing your kitchen…</p>
        </div>
      </main>
    );
  }

  const fieldWrap =
    "group relative rounded-2xl border bg-white/80 shadow-[0_1px_2px_rgba(28,28,28,0.04)] transition-all duration-200";
  const fieldWrapOk =
    "border-gray-200/90 focus-within:border-brand-red/35 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(229,57,53,0.08),0_4px_24px_-8px_rgba(28,28,28,0.12)]";
  const fieldWrapErr =
    "border-red-300 bg-red-50/30 shadow-[0_0_0_4px_rgba(239,68,68,0.08)]";

  const inputInner =
    "w-full rounded-2xl border-0 bg-transparent py-3.5 pl-11 pr-4 text-[15px] font-medium tracking-tight text-brand-dark outline-none ring-0 placeholder:text-gray-400 focus:ring-0";

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[#fafafa] lg:min-h-[560px] lg:flex-row">
      {/* Brand panel — desktop */}
      <div className="relative hidden min-h-[420px] w-full overflow-hidden lg:flex lg:min-h-0 lg:w-[46%] lg:max-w-none">
        <Image
          src={PANEL_IMG}
          alt=""
          fill
          className="object-cover"
          sizes="46vw"
          priority
        />
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
              Welcome back to{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-brand-yellow">your table</span>
                <span
                  className="absolute -bottom-1 left-0 h-3 w-full -skew-y-1 bg-brand-red/90"
                  aria-hidden
                />
              </span>
            </h2>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-white/75">
              Manage listings, respond to leads, and keep your catering business in front of hosts across
              India.
            </p>
          </div>
          <div className="flex items-end justify-between gap-6 border-t border-white/10 pt-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <ChefHat className="text-3xl text-brand-yellow" weight="fill" aria-hidden />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-white">Trusted directory</p>
                <p className="text-sm text-white/60">10,000+ happy customers · 120+ cities</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile hero strip */}
      <div className="relative overflow-hidden bg-brand-dark px-6 py-10 lg:hidden">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-red/30 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">Member access</p>
          <h1 className="font-heading mt-2 text-3xl font-extrabold text-white">Sign in</h1>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Caterer accounts — manage your presence on Bharat Catering.
          </p>
        </div>
      </div>

      {/* Form column */}
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
              <LockKey className="text-lg text-brand-red" weight="duotone" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-red">
                Secure sign-in
              </span>
            </div>
            <h1 className="font-heading mt-5 text-[1.75rem] font-extrabold tracking-tight text-brand-dark sm:text-[2rem]">
              Log in to your account
            </h1>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-gray-500">
              New here?{" "}
              <Link href="/register" className="font-semibold text-brand-red underline-offset-4 hover:underline">
                Create an account
              </Link>{" "}
              and list your business.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.35rem] border border-gray-100/80 bg-white shadow-[0_32px_64px_-28px_rgba(28,28,28,0.14),0_0_0_1px_rgba(28,28,28,0.04)]">
            <div className="h-1 w-full bg-gradient-to-r from-brand-red via-amber-400 to-brand-red" aria-hidden />

            <div className="p-7 sm:p-9">
              <div className="mb-8 border-b border-gray-100 pb-6">
                <p className="font-heading text-lg font-bold text-brand-dark">Credentials</p>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the email and password you used when registering your catering business.
                </p>
              </div>

              <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
                <div className="space-y-2">
                  <label htmlFor={emailId} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-brand-dark">Work email</span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      Required
                    </span>
                  </label>
                  <div className={`${fieldWrap} ${errors.email ? fieldWrapErr : fieldWrapOk}`}>
                    <Envelope
                      className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand-red"
                      size={22}
                      aria-hidden
                    />
                    <input
                      id={emailId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "login-email-error" : undefined}
                      className={inputInner}
                    />
                  </div>
                  <FormFieldError id="login-email-error" message={errors.email} />
                </div>

                <div className="space-y-2">
                  <label htmlFor={passwordId} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-brand-dark">Password</span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      Required
                    </span>
                  </label>
                  <div className={`${fieldWrap} ${errors.password ? fieldWrapErr : fieldWrapOk}`}>
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand-red"
                      size={22}
                      aria-hidden
                    />
                    <input
                      id={passwordId}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError("password");
                      }}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "login-password-error" : undefined}
                      className={`${inputInner} pr-12`}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-brand-dark"
                      aria-label={showPassword ? "Hide password" : "Show password"}
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="group mt-2 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-red text-[15px] font-bold text-white shadow-[0_8px_28px_-6px_rgba(229,57,53,0.55)] transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[0_14px_36px_-8px_rgba(229,57,53,0.45)] active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55 disabled:shadow-none"
                >
                  <span>{submitting ? "Signing in…" : "Sign in"}</span>
                  {!submitting ? (
                    <CaretRight
                      className="pointer-events-none text-xl transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </form>

              <div className="mt-8 rounded-2xl bg-gray-50/80 px-4 py-3 text-center">
                <p className="text-sm text-gray-600">
                  <Link
                    href="/verify-otp"
                    className="font-semibold text-brand-dark underline-offset-4 hover:text-brand-red hover:underline"
                  >
                    Have a verification code?
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400 lg:hidden">
            <Link href="/register" className="font-semibold text-brand-red hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
