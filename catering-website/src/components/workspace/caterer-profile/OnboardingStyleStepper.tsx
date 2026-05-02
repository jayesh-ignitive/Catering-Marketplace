import { Check } from "@phosphor-icons/react";
import type { WizardStepIndex } from "./wizard-metadata";
import { WIZARD_STEPS } from "./wizard-metadata";

export function OnboardingStyleStepper({
  step,
  onSelectCompletedStep,
  navigationDisabled,
}: {
  step: WizardStepIndex;
  onSelectCompletedStep?: (target: WizardStepIndex) => void;
  navigationDisabled?: boolean;
}) {
  const n = WIZARD_STEPS.length;
  const pct = n <= 1 ? 0 : (step / (n - 1)) * 100;
  return (
    <div className="relative mb-10 sm:mb-12">
      <div
        className="pointer-events-none absolute top-5 left-0 right-0 h-1 -translate-y-1/2 rounded-full bg-gray-200"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-5 left-0 h-1 -translate-y-1/2 rounded-full bg-brand-red transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      <ol className="relative flex justify-between">
        {WIZARD_STEPS.map((item, idx) => {
          const done = idx < step;
          const active = idx === step;
          const canGoTo = done && onSelectCompletedStep && !navigationDisabled;
          const circle = (
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm transition-colors duration-300 ${
                done
                  ? "border-[#4CAF50] bg-[#4CAF50] text-white"
                  : active
                    ? "border-brand-red bg-brand-red text-white"
                    : "border-gray-200 bg-white text-gray-400"
              }`}
            >
              {done ? (
                <Check weight="bold" className="h-5 w-5" aria-hidden />
              ) : (
                <span>{idx + 1}</span>
              )}
            </span>
          );
          const label = (
            <span
              className={`max-w-[5rem] text-center text-[11px] leading-tight font-semibold sm:max-w-none sm:text-xs ${
                active ? "font-bold text-[#1c1c1c]" : done ? "font-bold text-[#4CAF50]" : "text-gray-400"
              }`}
            >
              {item.onboardingShortLabel}
            </span>
          );
          return (
            <li key={item.label} className="flex flex-col items-center gap-2">
              {canGoTo ? (
                <button
                  type="button"
                  onClick={() => onSelectCompletedStep(idx as WizardStepIndex)}
                  className="group flex max-w-[5.5rem] cursor-pointer flex-col items-center gap-2 rounded-lg p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
                  aria-label={`Go to ${item.onboardingShortLabel}`}
                >
                  {circle}
                  {label}
                </button>
              ) : (
                <>
                  {circle}
                  {label}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
