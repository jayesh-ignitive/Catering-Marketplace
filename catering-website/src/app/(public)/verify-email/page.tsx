"use client";

import { useI18n } from "@/context/LocaleContext";
import { setStoredToken, verifyEmail } from "@/lib/auth-api";
import { postAuthPath } from "@/lib/post-auth-path";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "react-toastify";

function VerifyEmailInner() {
  const { w } = useI18n();
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "err">(() => (token ? "loading" : "err"));
  const [message, setMessage] = useState(() =>
    token ? "" : w.auth.verifyEmail.missingToken
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await verifyEmail(token);
        if (cancelled) return;
        setStoredToken(res.accessToken);
        toast.success(w.auth.verifyEmail.emailVerified);
        window.location.assign(postAuthPath(res.user));
      } catch (e) {
        if (cancelled) return;
        setStatus("err");
        setMessage(e instanceof Error ? e.message : w.auth.verifyEmail.verificationFailed);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-sm font-medium text-stone-500">{w.auth.verifyEmail.verifying}</p>
      </main>
    );
  }

  return (
    <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="card-shadow w-full max-w-md rounded-[var(--radius-xl)] border border-stone-200/80 bg-[var(--surface)] p-8 sm:p-10">
        <h1 className="text-xl font-extrabold text-[var(--foreground)]">{w.auth.verifyEmail.linkInvalid}</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">{message}</p>
        <div className="mt-6 flex flex-col gap-3 text-sm font-semibold">
          <Link
            href="/login"
            className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] py-3 text-center text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          >
            {w.auth.verifyEmail.goToLogin}
          </Link>
          <Link
            href="/register"
            className="cursor-pointer rounded-sm py-2 text-center text-[var(--primary)] underline-offset-2 outline-none transition-colors hover:text-[var(--orange-deep)] hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2"
          >
            {w.auth.verifyEmail.createNewAccount}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  const { w, trans } = useI18n();

  return (
    <Suspense
      fallback={
        <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
          <p className="text-sm font-medium text-stone-500">{w.common.loading}</p>
        </main>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
