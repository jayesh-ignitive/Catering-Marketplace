"use client";

import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { WorkspaceBusinessWizard } from "@/components/workspace/caterer-profile/WorkspaceBusinessWizard";
import {
  fetchMarketplaceCitiesForWorkspace,
  fetchPublishedKeywordCatalog,
  fetchServiceCategories,
  fetchServiceOfferings,
  fetchWorkspaceCatererProfile,
} from "@/lib/catering-api";

function CatererProfileEditorContent() {
  const { token, user } = useAuth();

  const enabled = Boolean(token);
  const citiesQ = useQuery({
    queryKey: ["marketplace", "workspace-cities"],
    queryFn: fetchMarketplaceCitiesForWorkspace,
  });
  const categoriesQ = useQuery({ queryKey: ["catalog", "categories"], queryFn: fetchServiceCategories });
  const offeringsQ = useQuery({
    queryKey: ["marketplace", "service-offerings"],
    queryFn: fetchServiceOfferings,
  });
  const keywordCatalogQ = useQuery({
    queryKey: ["marketplace", "published-keyword-catalog"],
    queryFn: fetchPublishedKeywordCatalog,
    staleTime: 5 * 60 * 1000,
  });
  const profileQ = useQuery({
    queryKey: ["workspace", "profile", token],
    enabled,
    queryFn: () => fetchWorkspaceCatererProfile(token!),
  });
  const profile = profileQ.data;

  return (
    <div className="w-full min-w-0 max-w-none">
      <div className="mb-10">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#8A92A6]">
          Listing Management
        </p>
        <h1 className="font-heading mt-2 mb-2 text-3xl font-bold tracking-tight text-[#232D42]">
          Manage your listing
        </h1>
        <p className="mt-2 text-sm text-[#8A92A6]">
          Update business details, services, and gallery — changes save per tab.
        </p>
      </div>

      {enabled && profile && citiesQ.data && categoriesQ.data && offeringsQ.data ? (
        <WorkspaceBusinessWizard
          key={`${profile.cityId ?? "none"}-${profile.published}`}
          token={token!}
          profile={profile}
          cities={citiesQ.data}
          categories={categoriesQ.data}
          offerings={offeringsQ.data}
          keywordBrowseCatalog={keywordCatalogQ.data ?? []}
          accountUser={user}
          layout="tabs"
        />
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-brand-red" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-stone-400">
            Loading editor…
          </p>
        </div>
      )}
    </div>
  );
}

export default function CatererProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm text-[var(--foreground-muted)]">
          Loading…
        </div>
      }
    >
      <CatererProfileEditorContent />
    </Suspense>
  );
}
