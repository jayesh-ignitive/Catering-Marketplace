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
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
          Listing
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
          Manage your listing
        </h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
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
          uiVariant="onboarding"
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
