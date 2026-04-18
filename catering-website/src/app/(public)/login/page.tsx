"use client";

import { FormFieldError } from "@/components/common/FormFieldError";
import { useAuth } from "@/context/AuthContext";
import { AuthApiError } from "@/lib/auth-api";
import { setPendingVerifyEmail } from "@/lib/pending-verify-email";
import { postAuthPath } from "@/lib/post-auth-path";
import { loginFormSchema, zodFieldErrors } from "@/lib/validation/auth-forms";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="card-shadow w-full max-w-md rounded-[var(--radius-xl)] border border-stone-200/80 bg-[var(--surface)] p-8 sm:p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
          Caterer log in
        </h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          New to the platform?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </p>
        <form noValidate onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-stone-700">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
            />
            <FormFieldError id="login-email-error" message={errors.email} />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-stone-700"
            >
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className={`${inputBase} ${errors.password ? inputErr : inputOk}`}
            />
            <FormFieldError id="login-password-error" message={errors.password} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] py-3.5 text-sm font-bold text-white shadow-md shadow-[var(--primary)]/25 transition hover:opacity-[0.96] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
          <Link
            href="/verify-otp"
            className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
          >
            Have a code? Verify email
          </Link>
        </p>
      </div>
    </main>
  );
}
