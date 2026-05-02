import type { WizardStepIndex } from "./wizard-metadata";
import { STEP_INTROS } from "./wizard-metadata";
import { workspaceHintTextClass } from "./constants";

export function StepIntro({
  step,
  uiVariant,
}: {
  step: WizardStepIndex;
  uiVariant: "default" | "onboarding";
}) {
  if (uiVariant !== "onboarding") return null;
  const copy = STEP_INTROS[step];
  return (
    <div className="mb-4 md:col-span-2">
      <h2 className="mb-1 text-2xl font-semibold tracking-tight text-[#374151]">{copy.title}</h2>
      <p className={`text-base font-normal leading-relaxed ${workspaceHintTextClass}`}>{copy.subtitle}</p>
    </div>
  );
}
