"use client";

import { setStoredToken, verifyEmail } from "@/lib/auth-api";
import { postAuthPath } from "@/lib/post-auth-path";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "react-toastify";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "err">(() => (token ? "loading" : "err"));
  const [message, setMessage] = useState(() =>
    token ? "" : "Missing verification token. Open the link from your email."
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await verifyEmail(token);
        if (cancelled) return;
        setStoredToken(res.accessToken);
        toast.success("Email verified — you’re signed in");
        window.location.assign(postAuthPath(res.user));
      } catch (e) {
        if (cancelled) return;
        setStatus("err");
        setMessage(e instanceof Error ? e.message : "Verification failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "loading") {
    return (
      <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-sm font-medium text-stone-500">Verifying your email…</p>
      </main>
    );
  }

  return (
    <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="card-shadow w-full max-w-md rounded-[var(--radius-xl)] border border-stone-200/80 bg-[var(--surface)] p-8 sm:p-10">
        <h1 className="text-xl font-extrabold text-[var(--foreground)]">Link invalid or expired</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">{message}</p>
        <div className="mt-6 flex flex-col gap-3 text-sm font-semibold">
          <Link
            href="/login"
            className="rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--orange-deep)] py-3 text-center text-white shadow-md"
          >
            Go to log in
          </Link>
          <Link href="/register" className="text-center text-[var(--primary)] underline-offset-2 hover:underline">
            Create a new account
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="mesh-hero flex flex-1 flex-col items-center justify-center px-4 py-16">
          <p className="text-sm font-medium text-stone-500">Loading…</p>
        </main>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
