import type { Icon } from "@phosphor-icons/react";
import { Storefront, ListDashes, Images, PaperPlaneRight } from "@phosphor-icons/react";

export const WIZARD_STEPS: readonly {
  label: string;
  onboardingShortLabel: string;
  icon: Icon;
}[] = [
  { label: "Business", onboardingShortLabel: "Business info", icon: Storefront },
  { label: "Categories & Services", onboardingShortLabel: "Services", icon: ListDashes },
  { label: "Gallery", onboardingShortLabel: "Portfolio", icon: Images },
  { label: "Publish", onboardingShortLabel: "Review", icon: PaperPlaneRight },
] as const;

export type WizardStepIndex = 0 | 1 | 2 | 3;

export const STEP_INTROS: readonly { title: string; subtitle: string }[] = [
  {
    title: "Tell us about your catering service",
    subtitle: "Business name, location, tagline, and your story.",
  },
  {
    title: "What you offer customers",
    subtitle:
      "Guest capacity, experience, pricing — then specialties, services, and how people find you.",
  },
  {
    title: "Show your best work",
    subtitle: "Upload a banner and gallery photos — strong visuals increase trust and enquiries.",
  },
  {
    title: "Review & publish",
    subtitle: "Check the checklist, then save to make your listing visible on the marketplace.",
  },
];

/** Tabs in workspace (subset of wizard — no publish step). */
export type ProfileEditorTabId = "business" | "services" | "gallery";

export const PROFILE_TAB_ORDER: readonly ProfileEditorTabId[] = ["business", "services", "gallery"];

export function tabIdToStep(tab: ProfileEditorTabId): Exclude<WizardStepIndex, 3> {
  if (tab === "business") return 0;
  if (tab === "services") return 1;
  return 2;
}
