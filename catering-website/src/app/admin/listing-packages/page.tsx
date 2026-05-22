"use client";

import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminModal, AdminModalField } from "@/components/admin/AdminModal";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAdminLanguages,
  fetchAdminListingPackages,
  type AdminLanguageItem,
  type AdminListingComparisonRow,
  type AdminListingPackagesPageTranslation,
  type AdminListingPlan,
  updateAdminListingPlan,
  upsertAdminListingComparisonTranslation,
  upsertAdminListingPackagesPageTranslation,
  upsertAdminListingPlanTranslation,
} from "@/lib/admin-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, PencilSimple, Translate } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const ADMIN_KEY = ["admin", "listing-packages"] as const;

type PageForm = Omit<
  AdminListingPackagesPageTranslation,
  "id" | "languageCode" | "languageName" | "updatedAt"
>;

const EMPTY_PAGE: PageForm = {
  languageId: "",
  heroEyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  valueTitle: "",
  valueBody: "",
  discoverTitle: "",
  discoverSubtitle: "",
  comparisonTitle: "",
  comparisonHint: "",
  featureColumnLabel: "",
  tierEssentialLabel: "",
  tierGrowthLabel: "",
  tierPremierLabel: "",
  recommendedBadge: "",
  audienceTitle: "",
  audienceSubtitle: "",
  audienceTags: [],
  helpTitle: "",
  helpBody: "",
  browseDirectoryLabel: "",
  disclaimerText: "",
};

function pageToForm(hit: AdminListingPackagesPageTranslation): PageForm {
  return {
    languageId: hit.languageId,
    heroEyebrow: hit.heroEyebrow,
    heroTitle: hit.heroTitle,
    heroSubtitle: hit.heroSubtitle,
    valueTitle: hit.valueTitle,
    valueBody: hit.valueBody,
    discoverTitle: hit.discoverTitle,
    discoverSubtitle: hit.discoverSubtitle,
    comparisonTitle: hit.comparisonTitle,
    comparisonHint: hit.comparisonHint,
    featureColumnLabel: hit.featureColumnLabel,
    tierEssentialLabel: hit.tierEssentialLabel,
    tierGrowthLabel: hit.tierGrowthLabel,
    tierPremierLabel: hit.tierPremierLabel,
    recommendedBadge: hit.recommendedBadge,
    audienceTitle: hit.audienceTitle,
    audienceSubtitle: hit.audienceSubtitle,
    audienceTags: hit.audienceTags,
    helpTitle: hit.helpTitle,
    helpBody: hit.helpBody,
    browseDirectoryLabel: hit.browseDirectoryLabel,
    disclaimerText: hit.disclaimerText,
  };
}

export default function AdminListingPackagesPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [activeLanguageId, setActiveLanguageId] = useState("");
  const [pageForm, setPageForm] = useState<PageForm>(EMPTY_PAGE);
  const [planTranslate, setPlanTranslate] = useState<AdminListingPlan | null>(null);
  const [rowTranslate, setRowTranslate] = useState<AdminListingComparisonRow | null>(null);
  const [planName, setPlanName] = useState("");
  const [planSubtitle, setPlanSubtitle] = useState("");
  const [planPeriod, setPlanPeriod] = useState("");
  const [planCta, setPlanCta] = useState("");
  const [planFeatures, setPlanFeatures] = useState("");
  const [rowLabel, setRowLabel] = useState("");
  const [rowEssential, setRowEssential] = useState("");
  const [rowGrowth, setRowGrowth] = useState("");
  const [rowPremier, setRowPremier] = useState("");

  const bundleQ = useQuery({
    queryKey: ADMIN_KEY,
    queryFn: () => fetchAdminListingPackages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const languagesQ = useQuery({
    queryKey: ["admin", "languages"],
    queryFn: () => fetchAdminLanguages(token!),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const languages = useMemo(
    () => (languagesQ.data ?? []).filter((l) => l.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [languagesQ.data],
  );

  const bundle = bundleQ.data;
  const pageHit = bundle?.pageTranslations.find((t) => t.languageId === activeLanguageId);

  useEffect(() => {
    if (!activeLanguageId && languages.length > 0) {
      const en = languages.find((l) => l.code === "en") ?? languages[0];
      setActiveLanguageId(en.id);
    }
  }, [languages, activeLanguageId]);

  useEffect(() => {
    if (pageHit) {
      setPageForm(pageToForm(pageHit));
    } else if (activeLanguageId) {
      setPageForm({ ...EMPTY_PAGE, languageId: activeLanguageId });
    }
  }, [pageHit, activeLanguageId]);

  const savePageM = useMutation({
    mutationFn: () => upsertAdminListingPackagesPageTranslation(token!, pageForm),
    onSuccess: (data) => {
      qc.setQueryData(ADMIN_KEY, data);
      toast.success("Page copy saved");
    },
    onError: () => toast.error("Could not save page copy"),
  });

  const savePlanM = useMutation({
    mutationFn: () => {
      if (!planTranslate) throw new Error("No plan");
      return upsertAdminListingPlanTranslation(token!, planTranslate.id, {
        languageId: activeLanguageId,
        name: planName,
        subtitle: planSubtitle,
        periodLabel: planPeriod,
        ctaLabel: planCta,
        features: planFeatures.split("\n").map((s) => s.trim()).filter(Boolean),
      });
    },
    onSuccess: (data) => {
      qc.setQueryData(ADMIN_KEY, data);
      setPlanTranslate(null);
      toast.success("Plan translation saved");
    },
    onError: () => toast.error("Could not save plan translation"),
  });

  const saveRowM = useMutation({
    mutationFn: () => {
      if (!rowTranslate) throw new Error("No row");
      return upsertAdminListingComparisonTranslation(token!, rowTranslate.id, {
        languageId: activeLanguageId,
        label: rowLabel,
        essentialValue: rowEssential,
        growthValue: rowGrowth,
        premierValue: rowPremier,
      });
    },
    onSuccess: (data) => {
      qc.setQueryData(ADMIN_KEY, data);
      setRowTranslate(null);
      toast.success("Comparison row saved");
    },
    onError: () => toast.error("Could not save comparison row"),
  });

  function openPlanTranslate(plan: AdminListingPlan) {
    setPlanTranslate(plan);
    const hit = plan.translations.find((t) => t.languageId === activeLanguageId);
    setPlanName(hit?.name ?? "");
    setPlanSubtitle(hit?.subtitle ?? "");
    setPlanPeriod(hit?.periodLabel ?? "");
    setPlanCta(hit?.ctaLabel ?? "");
    setPlanFeatures(hit?.features.join("\n") ?? "");
  }

  function openRowTranslate(row: AdminListingComparisonRow) {
    setRowTranslate(row);
    const hit = row.translations.find((t) => t.languageId === activeLanguageId);
    setRowLabel(hit?.label ?? "");
    setRowEssential(hit?.essentialValue ?? "false");
    setRowGrowth(hit?.growthValue ?? "false");
    setRowPremier(hit?.premierValue ?? "false");
  }

  async function patchPlan(
    plan: AdminListingPlan,
    patch: Parameters<typeof updateAdminListingPlan>[2],
  ) {
    try {
      const data = await updateAdminListingPlan(token!, plan.id, patch);
      qc.setQueryData(ADMIN_KEY, data);
      toast.success("Plan updated");
    } catch {
      toast.error("Could not update plan");
    }
  }

  const activeLang = languages.find((l) => l.id === activeLanguageId);

  return (
    <div className="space-y-8">
      <AdminBreadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Listing packages", href: "/admin/listing-packages" },
        ]}
      />
      <div className="flex items-center gap-3">
        <Package className="text-2xl text-brand-red" weight="duotone" aria-hidden />
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-brand-dark">Listing packages</h1>
          <p className="text-sm text-gray-600">
            Content for <code className="text-xs">/packages</code> — page copy, plan cards, and comparison table.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Language</span>
        {languages.map((lang: AdminLanguageItem) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => setActiveLanguageId(lang.id)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-bold transition ${
              activeLanguageId === lang.id
                ? "bg-brand-red text-white"
                : "border border-gray-200 bg-white text-gray-700 hover:border-brand-red/30"
            }`}
          >
            {lang.name} ({lang.code})
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-extrabold text-brand-dark">
          Page copy {activeLang ? `— ${activeLang.name}` : ""}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AdminModalField label="Hero eyebrow">
            <input
              className="admin-input w-full"
              value={pageForm.heroEyebrow}
              onChange={(e) => setPageForm((f) => ({ ...f, heroEyebrow: e.target.value }))}
            />
          </AdminModalField>
          <AdminModalField label="Hero title">
            <input
              className="admin-input w-full"
              value={pageForm.heroTitle}
              onChange={(e) => setPageForm((f) => ({ ...f, heroTitle: e.target.value }))}
            />
          </AdminModalField>
        </div>
        <div className="mt-4">
        <AdminModalField label="Hero subtitle">
          <textarea
            className="admin-input min-h-[80px] w-full"
            value={pageForm.heroSubtitle}
            onChange={(e) => setPageForm((f) => ({ ...f, heroSubtitle: e.target.value }))}
          />
        </AdminModalField>
        </div>
        <div className="mt-4">
        <AdminModalField label="Value proposition body">
          <textarea
            className="admin-input min-h-[100px] w-full"
            value={pageForm.valueBody}
            onChange={(e) => setPageForm((f) => ({ ...f, valueBody: e.target.value }))}
          />
        </AdminModalField>
        </div>
        <div className="mt-4">
        <AdminModalField label="Discover subtitle">
          <textarea
            className="admin-input min-h-[72px] w-full"
            value={pageForm.discoverSubtitle}
            onChange={(e) => setPageForm((f) => ({ ...f, discoverSubtitle: e.target.value }))}
          />
        </AdminModalField>
        </div>
        <div className="mt-4">
        <AdminModalField label="Audience tags (one per line)">
          <textarea
            className="admin-input min-h-[120px] w-full font-mono text-sm"
            value={pageForm.audienceTags.join("\n")}
            onChange={(e) =>
              setPageForm((f) => ({
                ...f,
                audienceTags: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
              }))
            }
          />
        </AdminModalField>
        </div>
        <button
          type="button"
          disabled={savePageM.isPending || !activeLanguageId}
          onClick={() => savePageM.mutate()}
          className="mt-6 cursor-pointer rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Save page copy
        </button>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-extrabold text-brand-dark">Plans</h2>
        <p className="mt-1 text-sm text-gray-500">
          Price and layout are shared; use Translate for names and features per language.
        </p>
        <ul className="mt-4 divide-y divide-gray-100">
          {(bundle?.plans ?? []).map((plan) => (
            <li key={plan.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-bold text-brand-dark">
                  {plan.code} — {plan.translations.find((t) => t.languageCode === "en")?.name ?? plan.code}
                </p>
                <p className="text-sm text-gray-500">{plan.priceDisplay}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={plan.isRecommended}
                    onChange={(e) => patchPlan(plan, { isRecommended: e.target.checked })}
                    className="cursor-pointer"
                  />
                  Recommended
                </label>
                <button
                  type="button"
                  onClick={() => openPlanTranslate(plan)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-bold text-brand-dark hover:border-brand-red/30"
                >
                  <Translate aria-hidden />
                  Translate
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-extrabold text-brand-dark">Comparison table</h2>
        <p className="mt-1 text-sm text-gray-500">
          Cell values: <code>true</code>, <code>false</code>, or display text.
        </p>
        <ul className="mt-4 divide-y divide-gray-100">
          {(bundle?.comparisonRows ?? []).map((row) => {
            const en = row.translations.find((t) => t.languageCode === "en");
            return (
              <li key={row.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm font-medium text-brand-dark">{en?.label ?? row.id}</span>
                <button
                  type="button"
                  onClick={() => openRowTranslate(row)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-bold hover:border-brand-red/30"
                >
                  <PencilSimple aria-hidden />
                  Edit
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <AdminModal
        open={Boolean(planTranslate)}
        title={`Translate plan — ${planTranslate?.code ?? ""} (${activeLang?.code ?? ""})`}
        onClose={() => setPlanTranslate(null)}
      >
        <AdminModalField label="Name">
          <input className="admin-input w-full" value={planName} onChange={(e) => setPlanName(e.target.value)} />
        </AdminModalField>
        <div className="mt-3">
        <AdminModalField label="Subtitle">
          <input
            className="admin-input w-full"
            value={planSubtitle}
            onChange={(e) => setPlanSubtitle(e.target.value)}
          />
        </AdminModalField>
        <AdminModalField label="Features (one per line)">
          <textarea
            className="admin-input min-h-[160px] w-full font-mono text-sm"
            value={planFeatures}
            onChange={(e) => setPlanFeatures(e.target.value)}
          />
        </AdminModalField>
        </div>
        <button
          type="button"
          disabled={savePlanM.isPending}
          onClick={() => savePlanM.mutate()}
          className="mt-4 cursor-pointer rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          Save plan translation
        </button>
      </AdminModal>

      <AdminModal
        open={Boolean(rowTranslate)}
        title={`Comparison row (${activeLang?.code ?? ""})`}
        onClose={() => setRowTranslate(null)}
      >
        <AdminModalField label="Feature label">
          <input className="admin-input w-full" value={rowLabel} onChange={(e) => setRowLabel(e.target.value)} />
        </AdminModalField>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <AdminModalField label="Essential">
            <input
              className="admin-input w-full"
              value={rowEssential}
              onChange={(e) => setRowEssential(e.target.value)}
            />
          </AdminModalField>
          <AdminModalField label="Growth">
            <input className="admin-input w-full" value={rowGrowth} onChange={(e) => setRowGrowth(e.target.value)} />
          </AdminModalField>
          <AdminModalField label="Premier">
            <input className="admin-input w-full" value={rowPremier} onChange={(e) => setRowPremier(e.target.value)} />
          </AdminModalField>
        </div>
        <button
          type="button"
          disabled={saveRowM.isPending}
          onClick={() => saveRowM.mutate()}
          className="mt-4 cursor-pointer rounded-xl bg-brand-red px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          Save row
        </button>
      </AdminModal>
    </div>
  );
}
