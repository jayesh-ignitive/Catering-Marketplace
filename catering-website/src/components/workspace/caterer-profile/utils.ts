import type { CatererWorkspaceProfile } from "@/lib/catering-api";
import type { PatchWorkspaceProfileStep0Body } from "@/lib/catering-api";
import type { WizardStepIndex } from "./wizard-metadata";

export function firstIncompleteStep(profile: CatererWorkspaceProfile): WizardStepIndex {
  const missing = new Set(profile.completion.missingFields);
  if (missing.has("city") || missing.has("about")) return 0;
  if (missing.has("category") || missing.has("services") || missing.has("keywords")) return 1;
  if (missing.has("gallery")) return 2;
  return 3;
}

export function fieldClassErrored(base: string, errored: boolean) {
  return `${base} ${errored ? "!border-brand-red" : ""}`;
}

export function isValidGallerySource(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith("data:image/")) {
    return t.length <= 4 * 1024 * 1024;
  }
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function parsePriceBand(raw: string): PatchWorkspaceProfileStep0Body["priceBand"] | undefined {
  const b = raw.trim();
  if (b === "budget" || b === "mid" || b === "premium" || b === "custom") return b;
  return undefined;
}

export function parseStreetParts(raw: string | null | undefined): { line: string; pin: string } {
  if (!raw?.trim()) return { line: "", pin: "" };
  const m = raw.match(/\b(\d{6})\b/);
  if (m) {
    const pin = m[1]!;
    const line = raw.replace(pin, "").replace(/^[,\s]+|[,\s]+$/g, "").trim();
    return { line, pin };
  }
  return { line: raw.trim(), pin: "" };
}

export const GUEST_CAPACITY_PRESETS = [
  { id: "cap-xs", label: "Up to 50 guests", min: 1, max: 50 },
  { id: "cap-sm", label: "51 – 150 guests", min: 51, max: 150 },
  { id: "cap-md", label: "151 – 300 guests", min: 151, max: 300 },
  { id: "cap-lg", label: "301 – 500 guests", min: 301, max: 500 },
  { id: "cap-xl", label: "500+ guests", min: 501, max: 5000 },
] as const;

export const EXPERIENCE_PRESETS = [
  { id: "exp-new", label: "Just starting (under 1 year)", years: 0 },
  { id: "exp-1-3", label: "1 – 3 years", years: 2 },
  { id: "exp-4-10", label: "4 – 10 years", years: 7 },
  { id: "exp-10p", label: "10+ years", years: 15 },
] as const;

export const PRICE_PER_GUEST_PRESETS = [
  {
    id: "price-budget",
    label: "Budget-friendly",
    hint: "Typically under ₹400 per guest",
    band: "budget" as const,
    priceHint: 350,
  },
  {
    id: "price-mid",
    label: "Mid-range",
    hint: "Roughly ₹400 – ₹900 per guest",
    band: "mid" as const,
    priceHint: 650,
  },
  {
    id: "price-premium",
    label: "Premium",
    hint: "Roughly ₹900+ per guest",
    band: "premium" as const,
    priceHint: 1200,
  },
] as const;

export function inferGuestPresetFromNumbers(min: number | null, max: number | null): string {
  if (min == null || max == null || !Number.isFinite(min) || !Number.isFinite(max)) return "";
  for (const p of GUEST_CAPACITY_PRESETS) {
    if (p.min === min && p.max === max) return p.id;
  }
  return "cap-custom";
}

export function inferExperiencePresetFromYears(y: number | null): string {
  if (y == null || !Number.isFinite(y)) return "";
  const yi = Math.round(Number(y));
  for (const p of EXPERIENCE_PRESETS) {
    if (p.years === yi) return p.id;
  }
  return "exp-custom";
}

export function inferPricePresetFromProfile(band: string | null | undefined, pf: number | null): string {
  const b = band?.trim() ?? "";
  if (b === "budget") return "price-budget";
  if (b === "mid") return "price-mid";
  if (b === "premium") return "price-premium";
  if (b === "custom" || (pf != null && Number.isFinite(pf))) return "price-custom";
  return "";
}
