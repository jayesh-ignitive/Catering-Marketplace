import type {
  CatererWorkspaceProfile,
  PatchWorkspaceProfileStep0Body,
} from "@/lib/catering-api";
import { getMarketplacePriceTierHintVars, MARKETPLACE_PRICE_TIER_INR } from "@/lib/catering-api";
import type { TransVars } from "@/i18n/format";
import type { WorkspaceMessages } from "@/i18n/workspace.messages";
import type { WizardStepIndex } from "./wizard-metadata";

/** Re-export for onboarding wizard — same bounds as marketplace display/API. */
export const PRICE_TIER_INR = MARKETPLACE_PRICE_TIER_INR;

type PriceTrans = (template: string, vars?: TransVars) => string;

/** True once the caterer has submitted for marketplace review (any status after draft). */
export function hasSubmittedWorkspaceProfile(profile: CatererWorkspaceProfile): boolean {
  if (profile.submittedForReviewAt) return true;
  return profile.approvalStatus !== "draft";
}

export function firstIncompleteStep(profile: CatererWorkspaceProfile): WizardStepIndex {
  const missing = new Set(profile.completion.missingFields);
  if (missing.has("city") || missing.has("address") || missing.has("about")) return 0;
  if (missing.has("category") || missing.has("services") /* || missing.has("keywords") */) return 1;
  if (missing.has("gallery") || missing.has("banner")) return 2;
  if (!hasSubmittedWorkspaceProfile(profile)) return 3;
  return 2;
}

export function fieldClassErrored(base: string, errored: boolean) {
  return `${base} ${errored ? "!border-brand-red" : ""}`;
}

/** Align with backend `HeroUrlOrDataImageConstraint` (banner / hero). */
export function isValidBannerSource(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith("data:image/")) {
    return t.length <= 3 * 1024 * 1024;
  }
  if (t.startsWith("images/banner/")) {
    return t.length <= 2048 && !/\s/.test(t) && /\.(jpe?g|png|webp|gif)$/i.test(t);
  }
  if (t.startsWith("images/")) {
    return t.length <= 2048 && !/\s/.test(t);
  }
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidGallerySource(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith("data:image/")) {
    return t.length <= 4 * 1024 * 1024;
  }
  if (t.startsWith("images/gallery/") || t.startsWith("images/")) {
    return t.length <= 2048 && !/\s/.test(t) && /\.(jpe?g|png|webp|gif)$/i.test(t);
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

function normalizePlaceName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

/** Match Google locality / district to a catalog city option. */
export function matchCatalogCityId(
  cities: { id: string; name: string }[],
  locality: string,
  district = ""
): string | null {
  const candidates = [locality, district].map(normalizePlaceName).filter(Boolean);
  if (candidates.length === 0 || cities.length === 0) return null;

  for (const candidate of candidates) {
    const exact = cities.find((city) => normalizePlaceName(city.name) === candidate);
    if (exact) return exact.id;
  }

  for (const candidate of candidates) {
    const partial = cities.find((city) => {
      const name = normalizePlaceName(city.name);
      return name.includes(candidate) || candidate.includes(name);
    });
    if (partial) return partial.id;
  }

  return null;
}

export function getGuestCapacityPresets(ws: WorkspaceMessages) {
  const p = ws.wizard.presets.capacity;
  return [
    { id: "cap-xs", label: p.upTo50, min: 1, max: 50 },
    { id: "cap-sm", label: p.guests51to150, min: 51, max: 150 },
    { id: "cap-md", label: p.guests151to300, min: 151, max: 300 },
    { id: "cap-lg", label: p.guests301to500, min: 301, max: 500 },
    { id: "cap-xl", label: p.guests500plus, min: 501, max: 5000 },
  ] as const;
}

export function getExperiencePresets(ws: WorkspaceMessages) {
  const p = ws.wizard.presets.experience;
  return [
    { id: "exp-new", label: p.justStarting, years: 0 },
    { id: "exp-1-3", label: p.years1to3, years: 2 },
    { id: "exp-4-10", label: p.years4to10, years: 7 },
    { id: "exp-10p", label: p.years10plus, years: 15 },
  ] as const;
}

export function getPricePerGuestPresets(ws: WorkspaceMessages, trans: PriceTrans = (t) => t) {
  const p = ws.wizard.presets.price;
  const tierVars = getMarketplacePriceTierHintVars();
  return [
    {
      id: "price-budget",
      label: p.budgetFriendly,
      hint: trans(p.budgetHint, tierVars.budget),
      band: "budget" as const,
      priceHint: MARKETPLACE_PRICE_TIER_INR.budget.from,
      priceToHint: MARKETPLACE_PRICE_TIER_INR.budget.to,
    },
    {
      id: "price-mid",
      label: p.midRange,
      hint: trans(p.midHint, tierVars.mid),
      band: "mid" as const,
      priceHint: MARKETPLACE_PRICE_TIER_INR.mid.from,
      priceToHint: MARKETPLACE_PRICE_TIER_INR.mid.to,
    },
    {
      id: "price-premium",
      label: p.premium,
      hint: trans(p.premiumHint, { min: tierVars.premium.min }),
      band: "premium" as const,
      priceHint: MARKETPLACE_PRICE_TIER_INR.premium.from,
      priceToHint: null as number | null,
    },
  ] as const;
}

export function inferGuestPresetFromNumbers(
  min: number | null,
  max: number | null,
  ws: WorkspaceMessages,
): string {
  if (min == null || max == null || !Number.isFinite(min) || !Number.isFinite(max)) return "";
  for (const preset of getGuestCapacityPresets(ws)) {
    if (preset.min === min && preset.max === max) return preset.id;
  }
  return "cap-custom";
}

export function inferExperiencePresetFromYears(y: number | null, ws: WorkspaceMessages): string {
  if (y == null || !Number.isFinite(y)) return "";
  const yi = Math.round(Number(y));
  for (const preset of getExperiencePresets(ws)) {
    if (preset.years === yi) return preset.id;
  }
  return "exp-custom";
}

const LEGACY_PRICE_FROM: Partial<Record<"budget" | "mid" | "premium", readonly number[]>> = {
  budget: [300, 350, 400],
  premium: [900, 1200],
};

function normalizeLegacyTierPriceFrom(
  band: string,
  pf: number,
): number {
  const rounded = Math.round(pf);
  if (band === "budget" && LEGACY_PRICE_FROM.budget?.includes(rounded)) {
    return PRICE_TIER_INR.budget.from;
  }
  if (band === "premium" && LEGACY_PRICE_FROM.premium?.includes(rounded)) {
    return PRICE_TIER_INR.premium.from;
  }
  return pf;
}

function priceFromMatchesTier(pf: number, band: "budget" | "mid" | "premium", from: number): boolean {
  const rounded = Math.round(pf);
  if (rounded === from) return true;
  return LEGACY_PRICE_FROM[band]?.includes(rounded) ?? false;
}

function priceToMatchesTier(
  pt: number | null | undefined,
  band: "budget" | "mid" | "premium",
  to: number | null | undefined,
): boolean {
  if (to == null) {
    return pt == null || !Number.isFinite(pt);
  }
  if (pt == null || !Number.isFinite(pt)) {
    return false;
  }
  return Math.round(pt) === to;
}

/** Match a preset chip only when band and saved rate both align with that tier. */
export function inferPricePresetFromProfile(
  band: string | null | undefined,
  pf: number | null,
  pt: number | null | undefined,
  ws: WorkspaceMessages,
): string {
  const b = band?.trim() ?? "";
  if (b === "custom") {
    return pf != null && Number.isFinite(pf) ? "price-custom" : "";
  }

  const normalizedPf =
    pf != null && Number.isFinite(pf) && b ? normalizeLegacyTierPriceFrom(b, pf) : pf;

  if (normalizedPf != null && Number.isFinite(normalizedPf)) {
    for (const preset of getPricePerGuestPresets(ws)) {
      if (
        preset.band === b &&
        priceFromMatchesTier(normalizedPf, preset.band, preset.priceHint) &&
        priceToMatchesTier(pt, preset.band, preset.priceToHint)
      ) {
        return preset.id;
      }
    }
    return "price-custom";
  }

  if (b === "budget") return "price-budget";
  if (b === "mid") return "price-mid";
  if (b === "premium") return "price-premium";
  return "";
}

export function initialPriceFromField(
  band: string | null | undefined,
  pf: number | null,
  pt: number | null | undefined,
  ws: WorkspaceMessages,
): string {
  const b = band?.trim() ?? "";
  const normalizedPf =
    pf != null && Number.isFinite(pf) && b ? normalizeLegacyTierPriceFrom(b, pf) : pf;

  const presetId = inferPricePresetFromProfile(band, normalizedPf, pt, ws);
  if (presetId && presetId !== "price-custom") {
    const preset = getPricePerGuestPresets(ws).find((p) => p.id === presetId);
    if (preset) return String(preset.priceHint);
  }
  if (normalizedPf != null && Number.isFinite(normalizedPf)) {
    return String(Math.round(normalizedPf));
  }
  const emptyPresetId = inferPricePresetFromProfile(band, null, pt, ws);
  if (!emptyPresetId || emptyPresetId === "price-custom") return "";
  const preset = getPricePerGuestPresets(ws).find((p) => p.id === emptyPresetId);
  return preset ? String(preset.priceHint) : "";
}

export function initialPriceToField(
  band: string | null | undefined,
  pf: number | null,
  pt: number | null | undefined,
  ws: WorkspaceMessages,
): string {
  const b = band?.trim() ?? "";
  const normalizedPf =
    pf != null && Number.isFinite(pf) && b ? normalizeLegacyTierPriceFrom(b, pf) : pf;

  const presetId = inferPricePresetFromProfile(band, normalizedPf, pt, ws);
  if (presetId && presetId !== "price-custom") {
    const preset = getPricePerGuestPresets(ws).find((p) => p.id === presetId);
    if (preset?.priceToHint != null) return String(preset.priceToHint);
    return "";
  }
  if (pt != null && Number.isFinite(pt)) {
    return String(Math.round(pt));
  }
  return "";
}

export function resolvePriceFieldsForSave(
  pricePresetId: string,
  priceFromRaw: string,
  priceToRaw: string,
  ws: WorkspaceMessages,
): { priceFrom?: number; priceTo?: number | null } {
  if (pricePresetId && pricePresetId !== "price-custom") {
    const preset = getPricePerGuestPresets(ws).find((p) => p.id === pricePresetId);
    if (preset) {
      return {
        priceFrom: preset.priceHint,
        priceTo: preset.priceToHint,
      };
    }
  }
  return {
    priceFrom: optionalPriceFromField(priceFromRaw),
    priceTo: optionalPriceToField(priceToRaw),
  };
}

/** Omit from PATCH when blank — avoids sending `0` which fails backend `@Min(1)` on capacity. */
export function optionalPositiveIntFromField(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return undefined;
  return n;
}

export function optionalNonNegativeIntFromField(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return undefined;
  return n;
}

export function optionalPriceFromField(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function optionalPriceToField(raw: string): number | null | undefined {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}
