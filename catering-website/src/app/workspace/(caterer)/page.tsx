"use client";

import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";
import { useAuth } from "@/context/AuthContext";
import { fetchWorkspaceCatererProfile } from "@/lib/catering-api";
import { useQuery } from "@tanstack/react-query";

export default function WorkspaceDashboardPage() {
  const { token, user } = useAuth();

  const profileQ = useQuery({
    queryKey: ["workspace", "profile", token],
    queryFn: () => fetchWorkspaceCatererProfile(token!),
    enabled: Boolean(token),
  });

  if (!user || !token) {
    return null;
  }

  if (profileQ.isPending || !profileQ.data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-sm border border-stone-200 bg-white shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-brand-red" />
        <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-[#8A92A6]">Loading dashboard…</p>
      </div>
    );
  }

  return <WorkspaceDashboard user={user} profile={profileQ.data} token={token} />;
}
