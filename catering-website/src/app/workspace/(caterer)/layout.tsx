"use client";

import { I18nLoadingFallback } from "@/components/common/I18nLoadingFallback";
import { hasSubmittedWorkspaceProfile } from "@/components/workspace/caterer-profile/utils";
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
    // Submitted profiles stay in the workspace even if a later field check fails.
    // Sending them back to onboarding loops, because onboarding returns submitted users here.
    if (
      !profileQ.data.completion.isComplete &&
      !hasSubmittedWorkspaceProfile(profileQ.data)
    ) {
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

  if (
    profileQ.data &&
    !profileQ.data.completion.isComplete &&
    !hasSubmittedWorkspaceProfile(profileQ.data)
  ) {
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
