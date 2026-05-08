"use client";

import { AdminThemeLayout } from "@/components/admin/AdminThemeLayout";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminWorkspaceShell({ children }: { children: React.ReactNode }) {
  const { ready, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/workspace");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
        Loading…
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
        Redirecting…
      </div>
    );
  }

  return (
    <AdminThemeLayout
      user={user}
      onLogout={() => {
        logout();
        router.push("/");
      }}
    >
      {children}
    </AdminThemeLayout>
  );
}
