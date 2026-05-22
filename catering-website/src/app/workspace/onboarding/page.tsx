"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/LocaleContext";
import { I18nLoadingFallback } from "@/components/common/I18nLoadingFallback";
import { WorkspaceBusinessWizard } from "@/components/workspace/caterer-profile/WorkspaceBusinessWizard";
import {
  fetchMarketplaceCitiesForWorkspace,
  fetchPublishedKeywordCatalog,
  fetchServiceCategories,
  fetchServiceOfferings,
  fetchWorkspaceCatererProfile,
} from "@/lib/catering-api";

export default function WorkspaceOnboardingPage() {
  const { token, user } = useAuth();
  const { locale } = useI18n();

  const enabled = Boolean(token);
  const citiesQ = useQuery({
    queryKey: ["marketplace", "workspace-cities", locale],
    queryFn: () => fetchMarketplaceCitiesForWorkspace(locale),
  });
  const categoriesQ = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: () => fetchServiceCategories(),
  });
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
    <div className="w-full">
      {enabled && profile && citiesQ.data && categoriesQ.data && offeringsQ.data ? (
        <WorkspaceBusinessWizard
          key={token}
          token={token!}
          profile={profile}
          cities={citiesQ.data}
          categories={categoriesQ.data}
          offerings={offeringsQ.data}
          keywordBrowseCatalog={keywordCatalogQ.data ?? []}
          accountUser={user}
          uiVariant="onboarding"
          layout="wizard"
        />
      ) : (
        <div className="mt-12 flex h-64 items-center justify-center rounded-sm border border-gray-200 bg-white shadow-sm">
          <I18nLoadingFallback variant="wizard" />
        </div>
      )}
    </div>
  );
}
