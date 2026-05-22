"use client";

import { I18nLoadingFallback } from "@/components/common/I18nLoadingFallback";
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
      <div className="flex h-64 items-center justify-center rounded-sm border border-stone-200 bg-white shadow-sm">
        <I18nLoadingFallback variant="dashboard" />
      </div>
    );
  }

  return <WorkspaceDashboard user={user} profile={profileQ.data} token={token} />;
}
