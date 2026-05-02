"use client";

import { BusinessOnboardingShell } from "@/components/workspace/BusinessOnboardingShell";
import { useAuth } from "@/context/AuthContext";
import { fetchWorkspaceCatererProfile } from "@/lib/catering-api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WorkspaceOnboardingLayout({ children }: { children: React.ReactNode }) {
  const { ready, user, token } = useAuth();
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

  return <BusinessOnboardingShell>{children}</BusinessOnboardingShell>;
}
