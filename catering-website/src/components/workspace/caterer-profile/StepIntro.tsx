import { useI18n } from "@/context/LocaleContext";
import type { WizardStepIndex } from "./wizard-metadata";
import { getStepIntros } from "./wizard-metadata";
import { workspaceHintTextClass } from "./constants";

export function StepIntro({
  step,
  uiVariant,
}: {
  step: WizardStepIndex;
  uiVariant: "default" | "onboarding";
}) {
  const { ws } = useI18n();
  if (uiVariant !== "onboarding") return null;
  const copy = getStepIntros(ws)[step];
  return (
    <div className="mb-4 md:col-span-2">
      <h2 className="mb-1 text-2xl font-semibold tracking-tight text-[#374151]">{copy.title}</h2>
      <p className={`text-base font-normal leading-relaxed ${workspaceHintTextClass}`}>{copy.subtitle}</p>
    </div>
  );
}
