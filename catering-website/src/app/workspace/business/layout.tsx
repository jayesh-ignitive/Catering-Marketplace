"use client";

import { UserAccountMenu } from "@/components/common/UserAccountMenu";
import { BusinessOnboardingShell } from "@/components/workspace/BusinessOnboardingShell";
import { useAuth } from "@/context/AuthContext";
import { fetchWorkspaceCatererProfile } from "@/lib/catering-api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Storefront } from "@phosphor-icons/react";

export default function BusinessProfileLayout({ children }: { children: React.ReactNode }) {
  const { ready, user, logout, token } = useAuth();
  const router = useRouter();

  const profileQ = useQuery({
    queryKey: ["workspace", "profile", token],
    queryFn: () => fetchWorkspaceCatererProfile(token!),
    enabled: Boolean(ready && token && user && user.role !== "admin"),
  });

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "admin") {
      router.replace("/");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] text-sm text-stone-500">
        Loading…
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] text-sm text-stone-500">
        Redirecting…
      </div>
    );
  }

  if (profileQ.isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f8f9fa] text-stone-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-brand-red" />
        <p className="text-sm font-semibold text-stone-400">Loading workspace…</p>
      </div>
    );
  }

  const onboarding = !profileQ.isSuccess || !profileQ.data.completion.isComplete;

  if (onboarding) {
    return <BusinessOnboardingShell>{children}</BusinessOnboardingShell>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa] font-sans">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 shadow-sm md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red text-white shadow-md shadow-brand-red/20">
            <Storefront weight="fill" className="h-6 w-6" />
          </div>
          <span className="text-xl font-black tracking-tight text-stone-900">
            Bharat<span className="text-brand-red">Caterers</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/workspace"
            className="text-sm font-semibold text-stone-600 transition-colors hover:text-brand-red"
          >
            Dashboard
          </Link>
          <UserAccountMenu
            user={user}
            onLogout={() => {
              logout();
              router.push("/");
            }}
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
