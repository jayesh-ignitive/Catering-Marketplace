"use client";

import { I18nLoadingFallback } from "@/components/common/I18nLoadingFallback";
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
      router.replace("/admin");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <I18nLoadingFallback />
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <I18nLoadingFallback variant="redirect" />
      </div>
    );
  }

  if (profileQ.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa]">
        <I18nLoadingFallback variant="workspace" />
      </div>
    );
  }

  return <BusinessOnboardingShell>{children}</BusinessOnboardingShell>;
}
