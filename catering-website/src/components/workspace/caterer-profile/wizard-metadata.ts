import type { Icon } from "@phosphor-icons/react";
import { Storefront, ListDashes, Images, PaperPlaneRight } from "@phosphor-icons/react";
import type { WorkspaceMessages } from "@/i18n/workspace.messages";

export type WizardStepIndex = 0 | 1 | 2 | 3;

export function getWizardSteps(ws: WorkspaceMessages): readonly {
  label: string;
  onboardingShortLabel: string;
  icon: Icon;
}[] {
  return [
    {
      label: ws.wizard.steps.business,
      onboardingShortLabel: ws.wizard.steps.businessShort,
      icon: Storefront,
    },
    {
      label: ws.wizard.steps.services,
      onboardingShortLabel: ws.wizard.steps.servicesShort,
      icon: ListDashes,
    },
    {
      label: ws.wizard.steps.gallery,
      onboardingShortLabel: ws.wizard.steps.galleryShort,
      icon: Images,
    },
    {
      label: ws.wizard.steps.submit,
      onboardingShortLabel: ws.wizard.steps.submitShort,
      icon: PaperPlaneRight,
    },
  ] as const;
}

export function getStepIntros(ws: WorkspaceMessages): readonly { title: string; subtitle: string }[] {
  return [
    {
      title: ws.wizard.intros.businessTitle,
      subtitle: ws.wizard.intros.businessSubtitle,
    },
    {
      title: ws.wizard.intros.servicesTitle,
      subtitle: ws.wizard.intros.servicesSubtitle,
    },
    {
      title: ws.wizard.intros.galleryTitle,
      subtitle: ws.wizard.intros.gallerySubtitle,
    },
    {
      title: ws.wizard.intros.submitTitle,
      subtitle: ws.wizard.intros.submitSubtitle,
    },
  ];
}

/** Tabs in workspace (subset of wizard — no submit-for-review step). */
export type ProfileEditorTabId = "business" | "services" | "gallery";

export const PROFILE_TAB_ORDER: readonly ProfileEditorTabId[] = ["business", "services", "gallery"];

export function tabIdToStep(tab: ProfileEditorTabId): Exclude<WizardStepIndex, 3> {
  if (tab === "business") return 0;
  if (tab === "services") return 1;
  return 2;
}
