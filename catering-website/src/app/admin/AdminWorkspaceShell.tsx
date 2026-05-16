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

  useEffect(() => {
    if (!ready || !user || user.role !== "admin") return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [ready, user]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-page text-sm font-medium text-brand-text-muted">
        Loading…
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-page text-sm font-medium text-brand-text-muted">
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
