"use client";

import { I18nLoadingFallback } from "@/components/common/I18nLoadingFallback";
import { WorkspaceThemeLayout } from "@/components/workspace/WorkspaceThemeLayout";
import { useAuth } from "@/context/AuthContext";
import { fetchWorkspaceCatererProfile } from "@/lib/catering-api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CatererWorkspaceShellLayout({ children }: { children: React.ReactNode }) {
  const { ready, user, token } = useAuth();
  const router = useRouter();

  const profileQ = useQuery({
    queryKey: ["workspace", "profile", token],
    queryFn: () => fetchWorkspaceCatererProfile(token!),
    enabled: Boolean(ready && token && user && user.role !== "admin"),
    retry: 1,
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

  useEffect(() => {
    if (!profileQ.isSuccess || !profileQ.data) return;
    if (!profileQ.data.completion.isComplete) {
      router.replace("/workspace/onboarding");
    }
  }, [profileQ.isSuccess, profileQ.data, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <I18nLoadingFallback />
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <I18nLoadingFallback variant="redirect" />
      </div>
    );
  }

  if (profileQ.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <I18nLoadingFallback variant="workspace" />
      </div>
    );
  }

  if (profileQ.isError) {
    return (
      <WorkspaceThemeLayout user={user} profile={profileQ.data ?? null}>
        {children}
      </WorkspaceThemeLayout>
    );
  }

  if (profileQ.data && !profileQ.data.completion.isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <I18nLoadingFallback variant="openingSetup" />
      </div>
    );
  }

  return (
    <WorkspaceThemeLayout user={user} profile={profileQ.data ?? null}>
      {children}
    </WorkspaceThemeLayout>
  );
}
