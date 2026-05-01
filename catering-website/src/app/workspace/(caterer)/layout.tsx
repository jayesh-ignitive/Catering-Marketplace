"use client";

import { WorkspaceThemeLayout } from "@/components/workspace/WorkspaceThemeLayout";
import { useAuth } from "@/context/AuthContext";
import { fetchWorkspaceCatererProfile } from "@/lib/catering-api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CatererWorkspaceShellLayout({ children }: { children: React.ReactNode }) {
  const { ready, user, logout, token } = useAuth();
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
      router.replace("/");
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (!profileQ.isSuccess || !profileQ.data) return;
    if (!profileQ.data.completion.isComplete) {
      router.replace("/workspace/business");
    }
  }, [profileQ.isSuccess, profileQ.data, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
        Loading…
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
        Redirecting…
      </div>
    );
  }

  if (profileQ.isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)] text-[var(--foreground-muted)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-brand-red" />
        <p className="text-sm font-semibold text-stone-500">Loading workspace…</p>
      </div>
    );
  }

  if (profileQ.isError) {
    return (
      <WorkspaceThemeLayout
        user={user}
        onLogout={() => {
          logout();
          router.push("/");
        }}
      >
        {children}
      </WorkspaceThemeLayout>
    );
  }

  if (profileQ.data && !profileQ.data.completion.isComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)] text-[var(--foreground-muted)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-brand-red" />
        <p className="text-sm font-semibold text-stone-500">Opening business setup…</p>
      </div>
    );
  }

  return (
    <WorkspaceThemeLayout
      user={user}
      onLogout={() => {
        logout();
        router.push("/");
      }}
    >
      {children}
    </WorkspaceThemeLayout>
  );
}
