"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { patchAccountProfile, type AuthUser } from "@/lib/auth-api";
import {
  type CatererWorkspaceProfile,
  fetchMarketplaceCitiesForWorkspace,
  fetchMarketplaceKeywordSuggestions,
  fetchPublishedKeywordCatalog,
  fetchServiceCategories,
  fetchServiceOfferings,
  fetchWorkspaceCatererProfile,
  type MarketplaceKeywordRef,
  patchWorkspaceCatererProfileStep,
  publishWorkspaceCatererProfile,
  type PatchWorkspaceProfileStep0Body,
  type PatchWorkspaceProfileStep1Body,
  uploadCateringImage,
} from "@/lib/catering-api";
import {
  Storefront,
  ListDashes,
  Images,
  PaperPlaneRight,
  UploadSimple,
  CheckCircle,
  XCircle,
  Check,
  ArrowRight,
  Trash,
} from "@phosphor-icons/react";
import {
  SearchableKeywordTags,
  WORKSPACE_KEYWORD_LIMIT,
} from "@/components/workspace/SearchableKeywordTags";
import { SearchableMultiSelect } from "@/components/workspace/SearchableMultiSelect";
import { SearchableSingleSelect } from "@/components/workspace/SearchableSingleSelect";

const WIZARD_STEPS = [
  { label: "Business", onboardingShortLabel: "Business info", icon: Storefront },
  { label: "Categories & Services", onboardingShortLabel: "Services", icon: ListDashes },
  { label: "Gallery", onboardingShortLabel: "Portfolio", icon: Images },
  { label: "Publish", onboardingShortLabel: "Review", icon: PaperPlaneRight },
] as const;

type WizardStepIndex = 0 | 1 | 2 | 3;

const STEP_INTROS: readonly { title: string; subtitle: string }[] = [
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

function StepIntro({
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
      <h2 className="mb-1 text-3xl font-bold tracking-tight text-[#374151]">{copy.title}</h2>
      <p className="text-base font-normal leading-relaxed text-[#6B7280]">{copy.subtitle}</p>
    </div>
  );
}

function OnboardingStyleStepper({
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

function firstIncompleteStep(profile: CatererWorkspaceProfile): WizardStepIndex {
  const missing = new Set(profile.completion.missingFields);
  if (missing.has("city") || missing.has("about")) return 0;
  if (missing.has("category") || missing.has("services") || missing.has("keywords")) return 1;
  if (missing.has("gallery")) return 2;
  return 3;
}

function InputLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[#374151]">
      {children}
    </label>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-brand-red" role="alert">
      {message}
    </p>
  );
}

/** Near-square corners like static `onboarding.html` form controls (minimal rounding). */
const fieldRadius = "rounded-sm";

/** Reference: neutral borders (#E5E7EB), labels #374151, placeholders #9CA3AF */
/** Border-only focus — avoids clipped `ring` box-shadow looking like a red bottom edge after blur */
const fieldBase = `block w-full ${fieldRadius} border border-[#E5E7EB] bg-white px-4 py-3.5 text-sm text-[#111827] outline-none ring-0 ring-offset-0 transition-colors placeholder:text-[#9CA3AF] focus:border-brand-red focus:outline-none focus:ring-0`;

const inputClassName = fieldBase;

const textareaClassName = `${fieldBase} min-h-[6rem] resize-y`;

const multiSelectClassName = `${fieldBase} min-h-[250px] cursor-pointer py-2`;

function fieldClassErrored(base: string, errored: boolean) {
  return `${base} ${errored ? "!border-brand-red" : ""}`;
}

/** Must match backend `WORKSPACE_ABOUT_MIN_LEN` — see `PatchWorkspaceProfileStep0Body` note in catering-api. */
const ABOUT_MIN_LEN = 15;

/** Matches backend gallery `ArrayMaxSize`. */
const WORKSPACE_GALLERY_MAX = 20;
/** Matches `POST /api/upload/image` multer limit (see catering-backend upload controller). */
const MAX_GALLERY_UPLOAD_BYTES = 5 * 1024 * 1024;

function isValidGallerySource(s: string): boolean {
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

function parsePriceBand(raw: string): PatchWorkspaceProfileStep0Body["priceBand"] | undefined {
  const b = raw.trim();
  if (b === "budget" || b === "mid" || b === "premium" || b === "custom") return b;
  return undefined;
}

const GUEST_CAPACITY_PRESETS = [
  { id: "cap-xs", label: "Up to 50 guests", min: 1, max: 50 },
  { id: "cap-sm", label: "51 – 150 guests", min: 51, max: 150 },
  { id: "cap-md", label: "151 – 300 guests", min: 151, max: 300 },
  { id: "cap-lg", label: "301 – 500 guests", min: 301, max: 500 },
  { id: "cap-xl", label: "500+ guests", min: 501, max: 5000 },
] as const;

const EXPERIENCE_PRESETS = [
  { id: "exp-new", label: "Just starting (under 1 year)", years: 0 },
  { id: "exp-1-3", label: "1 – 3 years", years: 2 },
  { id: "exp-4-10", label: "4 – 10 years", years: 7 },
  { id: "exp-10p", label: "10+ years", years: 15 },
] as const;

const PRICE_PER_GUEST_PRESETS = [
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

function inferGuestPresetFromNumbers(min: number | null, max: number | null): string {
  if (min == null || max == null || !Number.isFinite(min) || !Number.isFinite(max)) return "";
  for (const p of GUEST_CAPACITY_PRESETS) {
    if (p.min === min && p.max === max) return p.id;
  }
  return "cap-custom";
}

function inferExperiencePresetFromYears(y: number | null): string {
  if (y == null || !Number.isFinite(y)) return "";
  const yi = Math.round(Number(y));
  for (const p of EXPERIENCE_PRESETS) {
    if (p.years === yi) return p.id;
  }
  return "exp-custom";
}

function inferPricePresetFromProfile(band: string | null | undefined, pf: number | null): string {
  const b = band?.trim() ?? "";
  if (b === "budget") return "price-budget";
  if (b === "mid") return "price-mid";
  if (b === "premium") return "price-premium";
  if (b === "custom" || (pf != null && Number.isFinite(pf))) return "price-custom";
  return "";
}

function ChoiceChip({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-sm border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1 sm:w-auto sm:min-w-[11rem] ${
        selected
          ? "border-brand-red bg-red-50 text-brand-red"
          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-brand-red/60"
      }`}
    >
      <span className="text-sm font-semibold">{title}</span>
      {subtitle ? <span className="text-xs font-normal text-[#6B7280]">{subtitle}</span> : null}
    </button>
  );
}

/** Multi-select pill for categories / offerings (onboarding services step). */
function ToggleChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`cursor-pointer rounded-sm border px-3.5 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1 ${
        selected
          ? "border-brand-red bg-red-50 text-brand-red"
          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-brand-red/60"
      }`}
    >
      {children}
    </button>
  );
}

function parseStreetParts(raw: string | null | undefined): { line: string; pin: string } {
  if (!raw?.trim()) return { line: "", pin: "" };
  const m = raw.match(/\b(\d{6})\b/);
  if (m) {
    const pin = m[1]!;
    const line = raw.replace(pin, "").replace(/^[,\s]+|[,\s]+$/g, "").trim();
    return { line, pin };
  }
  return { line: raw.trim(), pin: "" };
}

function WorkspaceBusinessWizard({
  token,
  profile,
  cities,
  categories,
  offerings,
  keywordBrowseCatalog,
  accountUser,
  uiVariant = "default",
}: {
  token: string;
  profile: CatererWorkspaceProfile;
  cities: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  offerings: { id: string; name: string }[];
  /** Published-marketplace keyword labels (`GET .../caterers/keywords`). */
  keywordBrowseCatalog: MarketplaceKeywordRef[];
  accountUser: AuthUser | null;
  uiVariant?: "default" | "onboarding";
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<WizardStepIndex>(firstIncompleteStep(profile));
  const [businessName, setBusinessName] = useState(accountUser?.businessName ?? "");
  const [contactFullName, setContactFullName] = useState(accountUser?.fullName ?? "");
  const [cityId, setCityId] = useState(profile.cityId ?? "");

  useEffect(() => {
    if (!accountUser) return;
    setBusinessName(accountUser.businessName ?? "");
    setContactFullName(accountUser.fullName);
  }, [accountUser?.id, accountUser?.businessName, accountUser?.fullName]);
  const streetParts = parseStreetParts(profile.streetAddress);
  const [streetLine, setStreetLine] = useState(streetParts.line);
  const [pincode, setPincode] = useState(streetParts.pin);
  const [tagline, setTagline] = useState(profile.tagline ?? "");
  const [about, setAbout] = useState(profile.about ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(profile.heroImageUrl ?? "");
  const [priceBand, setPriceBand] = useState(profile.priceBand ?? "");
  const [priceFrom, setPriceFrom] = useState(profile.priceFrom != null ? String(profile.priceFrom) : "");
  const [yearsInBusiness, setYearsInBusiness] = useState(
    profile.yearsInBusiness != null ? String(profile.yearsInBusiness) : ""
  );
  const [capacityGuestMin, setCapacityGuestMin] = useState(
    profile.capacityGuestMin != null ? String(profile.capacityGuestMin) : ""
  );
  const [capacityGuestMax, setCapacityGuestMax] = useState(
    profile.capacityGuestMax != null ? String(profile.capacityGuestMax) : ""
  );
  const [guestPresetId, setGuestPresetId] = useState(() =>
    inferGuestPresetFromNumbers(profile.capacityGuestMin ?? null, profile.capacityGuestMax ?? null)
  );
  const [experiencePresetId, setExperiencePresetId] = useState(() =>
    inferExperiencePresetFromYears(profile.yearsInBusiness ?? null)
  );
  const [pricePresetId, setPricePresetId] = useState(() =>
    inferPricePresetFromProfile(profile.priceBand, profile.priceFrom ?? null)
  );
  const [categoryCodes, setCategoryCodes] = useState<string[]>(profile.categoryCodes ?? []);
  const [serviceOfferingIds, setServiceOfferingIds] = useState<string[]>(profile.serviceOfferingIds ?? []);
  const [keywordList, setKeywordList] = useState<string[]>(() =>
    (profile.keywords ?? []).map((k) => k.trim()).filter(Boolean)
  );
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() =>
    (profile.galleryImageUrls ?? [])
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, WORKSPACE_GALLERY_MAX)
  );

  const [bannerDragging, setBannerDragging] = useState(false);
  const [galleryDragging, setGalleryDragging] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const keywords = useMemo(
    () => keywordList.map((x) => x.trim()).filter(Boolean),
    [keywordList]
  );

  const fetchKeywordSuggestions = useCallback(
    (term: string) => fetchMarketplaceKeywordSuggestions(term),
    []
  );
  const galleryImageUrls = useMemo(
    () => galleryUrls.map((x) => x.trim()).filter(Boolean),
    [galleryUrls]
  );

  const pincodeDigits = pincode.replace(/\D/g, "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validateStepFields = useCallback(
    (s: WizardStepIndex): Record<string, string> => {
      const e: Record<string, string> = {};
      if (s === 0) {
        if (accountUser) {
          if (businessName.trim().length < 2) {
            e.businessName = "Enter your business name (at least 2 characters).";
          }
          if (contactFullName.trim().length < 2) {
            e.contactFullName = "Enter the contact person’s name (at least 2 characters).";
          }
        }
        if (!cityId.trim()) {
          e.cityId = "Select a city.";
        }
        if (uiVariant === "onboarding" && pincodeDigits.length !== 6) {
          e.pincode = "Enter a valid 6-digit pincode.";
        }
        const aboutTrim = about.trim();
        if (!aboutTrim) {
          e.about = "Describe your business so customers know what you offer.";
        } else if (aboutTrim.length < ABOUT_MIN_LEN) {
          e.about = `Please add a bit more detail (at least ${ABOUT_MIN_LEN} characters).`;
        }

        const capMinRaw = capacityGuestMin.trim();
        const capMaxRaw = capacityGuestMax.trim();
        const capMin = capMinRaw === "" ? NaN : Number(capMinRaw);
        const capMax = capMaxRaw === "" ? NaN : Number(capMaxRaw);

        /** Guest capacity, experience & price are on services step during onboarding */
        const skipCapacityDetail = uiVariant === "onboarding";
        const skipYearsDetail = uiVariant === "onboarding";
        const skipPriceFromFormat = uiVariant === "onboarding";

        if (!skipCapacityDetail) {
          if (
            capMinRaw !== "" &&
            (!Number.isFinite(capMin) || capMin < 1 || !Number.isInteger(capMin))
          ) {
            e.capacityGuestMin = "Enter a whole number of guests (1 or more), or leave blank.";
          }
          if (
            capMaxRaw !== "" &&
            (!Number.isFinite(capMax) || capMax < 1 || !Number.isInteger(capMax))
          ) {
            e.capacityGuestMax = "Enter a whole number of guests (1 or more), or leave blank.";
          }
          if (
            Number.isFinite(capMin) &&
            Number.isFinite(capMax) &&
            !e.capacityGuestMin &&
            !e.capacityGuestMax &&
            capMin > capMax
          ) {
            e.capacityRange = "Minimum guests cannot be greater than maximum.";
          }
        }

        const pf = priceFrom.trim();
        if (pf !== "" && !skipPriceFromFormat) {
          const n = Number(pf);
          if (!Number.isFinite(n) || n < 0) {
            e.priceFrom = "Enter a valid price (0 or higher).";
          }
        }

        if (!skipYearsDetail) {
          const y = yearsInBusiness.trim();
          if (y !== "") {
            const ny = Number(y);
            if (!Number.isFinite(ny) || ny < 0 || ny > 120 || !Number.isInteger(ny)) {
              e.yearsInBusiness = "Enter whole years (0–120), or leave blank.";
            }
          }
        }
      } else if (s === 1) {
        const capMin1 = capacityGuestMin.trim();
        const capMax1 = capacityGuestMax.trim();
        const capMinN = capMin1 === "" ? NaN : Number(capMin1);
        const capMaxN = capMax1 === "" ? NaN : Number(capMax1);

        const skipGuestsCapacityDetail =
          uiVariant !== "onboarding" ||
          (Boolean(guestPresetId) && guestPresetId !== "cap-custom");

        if (uiVariant === "onboarding") {
          if (!guestPresetId) {
            e.guestServe = "Choose how many guests you can typically serve.";
          } else if (guestPresetId === "cap-custom") {
            if (!capMin1 || !capMax1) {
              e.guestServe = "Enter minimum and maximum guests, or pick a range above.";
            }
          }
        }

        if (!skipGuestsCapacityDetail) {
          if (
            capMin1 !== "" &&
            (!Number.isFinite(capMinN) || capMinN < 1 || !Number.isInteger(capMinN))
          ) {
            e.capacityGuestMin = "Enter a whole number of guests (1 or more), or leave blank.";
          }
          if (
            capMax1 !== "" &&
            (!Number.isFinite(capMaxN) || capMaxN < 1 || !Number.isInteger(capMaxN))
          ) {
            e.capacityGuestMax = "Enter a whole number of guests (1 or more), or leave blank.";
          }
          if (
            Number.isFinite(capMinN) &&
            Number.isFinite(capMaxN) &&
            !e.capacityGuestMin &&
            !e.capacityGuestMax &&
            capMinN > capMaxN
          ) {
            e.capacityRange = "Minimum guests cannot be greater than maximum.";
          }
        }

        const skipExpNumericStep1 =
          uiVariant !== "onboarding" ||
          (Boolean(experiencePresetId) && experiencePresetId !== "exp-custom");
        const skipPriceFmtStep1 =
          uiVariant !== "onboarding" ||
          (Boolean(pricePresetId) && pricePresetId !== "price-custom");

        if (uiVariant === "onboarding") {
          if (!experiencePresetId) {
            e.experience = "Tell us how experienced you are.";
          } else if (experiencePresetId === "exp-custom" && !yearsInBusiness.trim()) {
            e.experience = "Enter years in business, or choose an option above.";
          }

          if (!pricePresetId) {
            e.priceTier = "Choose a typical price level or enter your own rate.";
          } else if (pricePresetId === "price-custom" && !priceFrom.trim()) {
            e.priceTier = "Enter your average price per guest (INR).";
          }
        }

        const pfStep1 = priceFrom.trim();
        if (pfStep1 !== "" && !skipPriceFmtStep1) {
          const n = Number(pfStep1);
          if (!Number.isFinite(n) || n < 0) {
            e.priceFrom = "Enter a valid price (0 or higher).";
          }
        }

        if (!skipExpNumericStep1) {
          const y = yearsInBusiness.trim();
          if (y !== "") {
            const ny = Number(y);
            if (!Number.isFinite(ny) || ny < 0 || ny > 120 || !Number.isInteger(ny)) {
              e.yearsInBusiness = "Enter whole years (0–120), or leave blank.";
            }
          }
        }

        if (categoryCodes.length === 0) {
          e.categories = "Select at least one category.";
        }
        if (serviceOfferingIds.length === 0) {
          e.services = "Select at least one service.";
        }
        if (keywords.length === 0) {
          e.keywords = "Add at least one search keyword.";
        } else if (keywords.length > WORKSPACE_KEYWORD_LIMIT) {
          e.keywords = `Use at most ${WORKSPACE_KEYWORD_LIMIT} keywords.`;
        }
      } else if (s === 2) {
        if (galleryImageUrls.length === 0) {
          e.gallery = "Add at least one gallery photo.";
        } else if (galleryImageUrls.length > WORKSPACE_GALLERY_MAX) {
          e.gallery = `Use at most ${WORKSPACE_GALLERY_MAX} gallery photos.`;
        } else {
          const badIdx = galleryImageUrls.findIndex((url) => !isValidGallerySource(url));
          if (badIdx !== -1) {
            e.gallery = `Photo ${badIdx + 1}: use https URLs or uploaded images (PNG, JPG, GIF).`;
          }
        }
      }
      return e;
    },
    [
      accountUser,
      about,
      businessName,
      capacityGuestMax,
      capacityGuestMin,
      categoryCodes,
      cityId,
      contactFullName,
      galleryImageUrls,
      keywords,
      pincodeDigits,
      priceFrom,
      serviceOfferingIds,
      experiencePresetId,
      guestPresetId,
      pricePresetId,
      uiVariant,
      yearsInBusiness,
    ]
  );

  const saveM = useMutation({
    mutationFn: async (saveStep: WizardStepIndex) => {
      if (accountUser && saveStep === 0) {
        await patchAccountProfile(token, {
          fullName: contactFullName.trim(),
          businessName: businessName.trim(),
        });
      }

      if (saveStep === 3) {
        return publishWorkspaceCatererProfile(token);
      }

      const streetCombined = [streetLine.trim(), pincode.trim()].filter(Boolean).join(", ").trim();

      if (saveStep === 0) {
        const body: PatchWorkspaceProfileStep0Body = {
          cityId: cityId.trim(),
          about: about.trim(),
        };
        if (streetCombined) body.streetAddress = streetCombined;
        const tl = tagline.trim();
        if (tl) body.tagline = tl;
        if (heroImageUrl.trim()) body.heroImageUrl = heroImageUrl;

        if (uiVariant !== "onboarding") {
          const pb = parsePriceBand(priceBand);
          if (pb) body.priceBand = pb;
          const pf = priceFrom.trim();
          if (pf !== "") body.priceFrom = Number(pf);
          const y = yearsInBusiness.trim();
          if (y !== "") body.yearsInBusiness = Number(y);
          const cmin = capacityGuestMin.trim();
          const cmax = capacityGuestMax.trim();
          if (cmin !== "") body.capacityGuestMin = Number(cmin);
          if (cmax !== "") body.capacityGuestMax = Number(cmax);
        }

        return patchWorkspaceCatererProfileStep(token, 0, body);
      }

      if (saveStep === 1) {
        const body: PatchWorkspaceProfileStep1Body = {
          categoryCodes,
          serviceOfferingIds,
          keywords,
        };
        if (uiVariant === "onboarding") {
          body.capacityGuestMin = Number(capacityGuestMin);
          body.capacityGuestMax = Number(capacityGuestMax);
          body.yearsInBusiness = Number(yearsInBusiness);
          const pb = parsePriceBand(priceBand);
          if (pb) body.priceBand = pb;
          body.priceFrom = Number(priceFrom);
        }
        return patchWorkspaceCatererProfileStep(token, 1, body);
      }

      return patchWorkspaceCatererProfileStep(token, 2, {
        galleryImageUrls,
        heroImageUrl,
      });
    },
    onSuccess: async () => {
      await refreshUser();
      void qc.invalidateQueries({ queryKey: ["workspace", "profile", token] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleBannerFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > MAX_GALLERY_UPLOAD_BYTES) {
      return;
    }
    try {
      const { url } = await uploadCateringImage(token, file);
      setHeroImageUrl(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload banner.");
    }
  };

  const appendGalleryFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files?.length) return;
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) {
        return;
      }

      const accepted: string[] = [];
      for (const file of list) {
        if (file.size > MAX_GALLERY_UPLOAD_BYTES) {
          continue;
        }
        try {
          const { url } = await uploadCateringImage(token, file);
          accepted.push(url);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : `Could not upload ${file.name}.`);
        }
      }
      if (!accepted.length) return;

      setGalleryUrls((prev) => {
        const remaining = WORKSPACE_GALLERY_MAX - prev.length;
        if (remaining <= 0) {
          return prev;
        }
        const slice = accepted.slice(0, remaining);
        clearFieldError("gallery");
        return [...prev, ...slice];
      });
    },
    [clearFieldError, token]
  );

  const removeGalleryAt = useCallback((index: number) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
    clearFieldError("gallery");
  }, [clearFieldError]);

  return (
    <div
      className={
        uiVariant === "onboarding"
          ? ""
          : `mt-6 overflow-hidden ${fieldRadius} border border-gray-200 bg-white shadow-sm`
      }
    >
      {/* Stepper */}
      {uiVariant === "onboarding" ? (
        <nav aria-label="Progress" className="mb-2">
          <OnboardingStyleStepper
            step={step}
            navigationDisabled={saveM.isPending}
            onSelectCompletedStep={(target) => {
              setFieldErrors({});
              setStep(target);
            }}
          />
        </nav>
      ) : (
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-8 sm:px-12 sm:py-10">
          <nav aria-label="Progress">
            <ol role="list" className="flex items-center justify-between">
              {WIZARD_STEPS.map((stepItem, idx) => {
                const active = idx === step;
                const done = idx < step;
                const Icon = stepItem.icon;
                return (
                  <li
                    key={stepItem.label}
                    className={`relative flex-1 ${idx !== 0 ? "pl-2" : ""} ${idx !== WIZARD_STEPS.length - 1 ? "pr-2" : "flex-none"}`}
                  >
                    {idx !== WIZARD_STEPS.length - 1 && (
                      <div
                        className="absolute top-1/2 left-10 right-2 h-1 -translate-y-1/2 rounded-full bg-stone-200"
                        aria-hidden="true"
                      >
                        <div
                          className={`h-full rounded-full bg-brand-red transition-all duration-700 ease-in-out ${done ? "w-full" : "w-0"}`}
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={!done}
                      onClick={() => setStep(idx as WizardStepIndex)}
                      className="group relative z-10 flex cursor-pointer flex-col items-center disabled:cursor-not-allowed"
                    >
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                          active
                            ? "scale-110 border-brand-red bg-white text-brand-red shadow-lg shadow-brand-red/20"
                            : done
                              ? "border-brand-red bg-brand-red text-white"
                              : "border-stone-200 bg-white text-stone-400"
                        }`}
                      >
                        <Icon weight={active || done ? "fill" : "regular"} className="h-6 w-6" />
                      </span>
                      <span
                        className={`absolute -bottom-7 whitespace-nowrap text-[13px] font-bold transition-colors duration-300 ${active ? "text-brand-red" : done ? "text-stone-900" : "text-stone-400"}`}
                      >
                        {stepItem.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      )}

      <div className={uiVariant === "onboarding" ? "pb-4" : "p-6 sm:p-10 lg:p-12"}>
        <div
          className={`grid md:grid-cols-2 ${uiVariant === "onboarding" ? "gap-x-8 gap-y-5" : "gap-x-10 gap-y-8"}`}
        >
          {step === 0 ? (
            <>
              <StepIntro step={0} uiVariant={uiVariant} />

              {accountUser ? (
                <>
                  <div
                    className="md:col-span-2"
                    {...(fieldErrors.businessName ? { "data-invalid-field": "" } : {})}
                  >
                    <InputLabel htmlFor="ws-business-name">
                      Business name <span className="text-brand-red">*</span>
                    </InputLabel>
                    <input
                      id="ws-business-name"
                      autoComplete="organization"
                      aria-invalid={Boolean(fieldErrors.businessName)}
                      aria-describedby={fieldErrors.businessName ? "ws-business-name-err" : undefined}
                      className={fieldClassErrored(inputClassName, Boolean(fieldErrors.businessName))}
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        clearFieldError("businessName");
                      }}
                      placeholder="e.g. Royal Rajputana Caterers"
                      maxLength={120}
                    />
                    <FieldError id="ws-business-name-err" message={fieldErrors.businessName} />
                  </div>
                  <div
                    className="md:col-span-2"
                    {...(fieldErrors.contactFullName ? { "data-invalid-field": "" } : {})}
                  >
                    <InputLabel htmlFor="ws-contact-name">
                      Contact person <span className="text-brand-red">*</span>
                    </InputLabel>
                    <input
                      id="ws-contact-name"
                      autoComplete="name"
                      aria-invalid={Boolean(fieldErrors.contactFullName)}
                      aria-describedby={fieldErrors.contactFullName ? "ws-contact-name-err" : undefined}
                      className={fieldClassErrored(inputClassName, Boolean(fieldErrors.contactFullName))}
                      value={contactFullName}
                      onChange={(e) => {
                        setContactFullName(e.target.value);
                        clearFieldError("contactFullName");
                      }}
                      placeholder="Full name"
                      maxLength={120}
                    />
                    <FieldError id="ws-contact-name-err" message={fieldErrors.contactFullName} />
                  </div>
                </>
              ) : null}

              <div className="md:col-span-2">
                <InputLabel>
                  Street / area{" "}
                  <span className="text-xs font-normal text-[#6B7280]">(optional)</span>
                </InputLabel>
                <input
                  value={streetLine}
                  onChange={(e) => setStreetLine(e.target.value)}
                  placeholder="e.g. Unit 3, Link Road"
                  className={inputClassName}
                  autoComplete="street-address"
                />
              </div>
              <div {...(fieldErrors.cityId ? { "data-invalid-field": "" } : {})}>
                <InputLabel>
                  City <span className="text-brand-red">*</span>
                </InputLabel>
                <SearchableSingleSelect
                  id="ws-city-search"
                  options={cities.map((c) => ({ id: c.id, label: c.name }))}
                  value={cityId}
                  onChange={(nextId) => {
                    setCityId(nextId);
                    clearFieldError("cityId");
                  }}
                  placeholder="Search or select your city…"
                  searchPlaceholder="Type to filter cities…"
                  aria-invalid={Boolean(fieldErrors.cityId)}
                  aria-describedby={fieldErrors.cityId ? "ws-city-err" : undefined}
                  errored={Boolean(fieldErrors.cityId)}
                />
                <FieldError id="ws-city-err" message={fieldErrors.cityId} />
              </div>
              <div {...(fieldErrors.pincode ? { "data-invalid-field": "" } : {})}>
                <InputLabel htmlFor="ws-pincode">
                  Pincode{" "}
                  {uiVariant === "onboarding" ? <span className="text-brand-red">*</span> : null}
                </InputLabel>
                <input
                  id="ws-pincode"
                  aria-invalid={Boolean(fieldErrors.pincode)}
                  aria-describedby={
                    fieldErrors.pincode ? "ws-pincode-err" : uiVariant === "onboarding" ? "ws-pincode-hint" : undefined
                  }
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    clearFieldError("pincode");
                  }}
                  placeholder="e.g. 400001"
                  className={fieldClassErrored(inputClassName, Boolean(fieldErrors.pincode))}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                />
                {fieldErrors.pincode ? (
                  <FieldError id="ws-pincode-err" message={fieldErrors.pincode} />
                ) : uiVariant === "onboarding" ? (
                  <p id="ws-pincode-hint" className="mt-1 text-xs text-[#6B7280]">
                    6-digit postal code
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <InputLabel>Tagline</InputLabel>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Creating unforgettable culinary experiences"
                  className={inputClassName}
                />
              </div>
              <div className="md:col-span-2" {...(fieldErrors.about ? { "data-invalid-field": "" } : {})}>
                <InputLabel htmlFor="ws-about">
                  About <span className="text-brand-red">*</span>
                </InputLabel>
                <textarea
                  id="ws-about"
                  rows={5}
                  aria-invalid={Boolean(fieldErrors.about)}
                  aria-describedby={fieldErrors.about ? "ws-about-err" : undefined}
                  value={about}
                  onChange={(e) => {
                    setAbout(e.target.value);
                    clearFieldError("about");
                  }}
                  placeholder="Describe your catering business, your story, and what makes you unique..."
                  className={fieldClassErrored(textareaClassName, Boolean(fieldErrors.about))}
                />
                <FieldError id="ws-about-err" message={fieldErrors.about} />
              </div>

              {uiVariant !== "onboarding" ? (
              <>
              <div
                className="grid grid-cols-1 gap-5 md:col-span-2 md:grid-cols-2 md:gap-5"
                {...(fieldErrors.capacityRange || fieldErrors.capacityGuestMin || fieldErrors.capacityGuestMax
                  ? { "data-invalid-field": "" }
                  : {})}
              >
                <div>
                  <InputLabel htmlFor="ws-cap-min">Min capacity (guests)</InputLabel>
                  <input
                    id="ws-cap-min"
                    type="number"
                    min={1}
                    aria-invalid={Boolean(fieldErrors.capacityGuestMin || fieldErrors.capacityRange)}
                    aria-describedby={
                      fieldErrors.capacityGuestMin
                        ? "ws-cap-min-err"
                        : fieldErrors.capacityRange
                          ? "ws-cap-range-err"
                          : undefined
                    }
                    placeholder="e.g. 50"
                    value={capacityGuestMin}
                    onChange={(e) => {
                      setCapacityGuestMin(e.target.value);
                      clearFieldError("capacityGuestMin");
                      clearFieldError("capacityRange");
                    }}
                    className={fieldClassErrored(
                      inputClassName,
                      Boolean(fieldErrors.capacityGuestMin || fieldErrors.capacityRange)
                    )}
                  />
                  <FieldError id="ws-cap-min-err" message={fieldErrors.capacityGuestMin} />
                </div>
                <div>
                  <InputLabel htmlFor="ws-cap-max">Max capacity (guests)</InputLabel>
                  <input
                    id="ws-cap-max"
                    type="number"
                    min={1}
                    aria-invalid={Boolean(fieldErrors.capacityGuestMax || fieldErrors.capacityRange)}
                    aria-describedby={
                      fieldErrors.capacityGuestMax
                        ? "ws-cap-max-err"
                        : fieldErrors.capacityRange
                          ? "ws-cap-range-err"
                          : undefined
                    }
                    placeholder="e.g. 1000"
                    value={capacityGuestMax}
                    onChange={(e) => {
                      setCapacityGuestMax(e.target.value);
                      clearFieldError("capacityGuestMax");
                      clearFieldError("capacityRange");
                    }}
                    className={fieldClassErrored(
                      inputClassName,
                      Boolean(fieldErrors.capacityGuestMax || fieldErrors.capacityRange)
                    )}
                  />
                  <FieldError id="ws-cap-max-err" message={fieldErrors.capacityGuestMax} />
                </div>
              </div>
              {fieldErrors.capacityRange ? (
                <div className="md:col-span-2">
                  <FieldError id="ws-cap-range-err" message={fieldErrors.capacityRange} />
                </div>
              ) : null}
              <div className="md:col-span-2" {...(fieldErrors.yearsInBusiness ? { "data-invalid-field": "" } : {})}>
                <InputLabel htmlFor="ws-years">Years in business</InputLabel>
                <input
                  id="ws-years"
                  type="number"
                  min={0}
                  aria-invalid={Boolean(fieldErrors.yearsInBusiness)}
                  aria-describedby={fieldErrors.yearsInBusiness ? "ws-years-err" : undefined}
                  placeholder="e.g. 5"
                  value={yearsInBusiness}
                  onChange={(e) => {
                    setYearsInBusiness(e.target.value);
                    clearFieldError("yearsInBusiness");
                  }}
                  className={fieldClassErrored(inputClassName, Boolean(fieldErrors.yearsInBusiness))}
                />
                <FieldError id="ws-years-err" message={fieldErrors.yearsInBusiness} />
              </div>
              <div>
                <InputLabel htmlFor="ws-price-band">Price band</InputLabel>
                <select
                  id="ws-price-band"
                  value={priceBand}
                  onChange={(e) => setPriceBand(e.target.value)}
                  className={inputClassName}
                >
                  <option value="">Select price band</option>
                  <option value="budget">Budget-Friendly</option>
                  <option value="mid">Mid-Range</option>
                  <option value="premium">Premium / Luxury</option>
                  <option value="custom">Custom Pricing</option>
                </select>
              </div>
              <div {...(fieldErrors.priceFrom ? { "data-invalid-field": "" } : {})}>
                <InputLabel htmlFor="ws-price-from">Price from (INR per guest)</InputLabel>
                <input
                  id="ws-price-from"
                  type="number"
                  min={0}
                  aria-invalid={Boolean(fieldErrors.priceFrom)}
                  aria-describedby={fieldErrors.priceFrom ? "ws-price-from-err" : undefined}
                  placeholder="e.g. 500"
                  value={priceFrom}
                  onChange={(e) => {
                    setPriceFrom(e.target.value);
                    clearFieldError("priceFrom");
                  }}
                  className={fieldClassErrored(inputClassName, Boolean(fieldErrors.priceFrom))}
                />
                <FieldError id="ws-price-from-err" message={fieldErrors.priceFrom} />
              </div>
              </>
              ) : null}
            </>
          ) : null}

          {step === 1 ? (
            <>
              <StepIntro step={1} uiVariant={uiVariant} />

              {uiVariant === "onboarding" ? (
                <>
                  <section
                    className="md:col-span-2 space-y-3 border-b border-[#E5E7EB] pb-8"
                    aria-labelledby="ws-q-guests"
                    {...(fieldErrors.guestServe ? { "data-invalid-field": "" } : {})}
                  >
                    <div>
                      <h3 id="ws-q-guests" className="text-lg font-semibold tracking-tight text-[#374151]">
                        How many guests can you serve? <span className="text-brand-red">*</span>
                      </h3>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Pick the range that best matches most of your events.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {GUEST_CAPACITY_PRESETS.map((p) => (
                        <ChoiceChip
                          key={p.id}
                          selected={guestPresetId === p.id}
                          onClick={() => {
                            setGuestPresetId(p.id);
                            setCapacityGuestMin(String(p.min));
                            setCapacityGuestMax(String(p.max));
                            clearFieldError("guestServe");
                            clearFieldError("capacityGuestMin");
                            clearFieldError("capacityGuestMax");
                            clearFieldError("capacityRange");
                          }}
                          title={p.label}
                        />
                      ))}
                      <ChoiceChip
                        selected={guestPresetId === "cap-custom"}
                        onClick={() => {
                          setGuestPresetId("cap-custom");
                          clearFieldError("guestServe");
                        }}
                        title="Custom range"
                        subtitle="Enter min & max guests"
                      />
                    </div>
                    {guestPresetId === "cap-custom" ? (
                      <div className="grid max-w-xl grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                        <div>
                          <InputLabel htmlFor="ws-cap-min-onb">Minimum guests</InputLabel>
                          <input
                            id="ws-cap-min-onb"
                            type="number"
                            min={1}
                            value={capacityGuestMin}
                            onChange={(e) => {
                              setCapacityGuestMin(e.target.value);
                              setGuestPresetId("cap-custom");
                              clearFieldError("guestServe");
                              clearFieldError("capacityGuestMin");
                              clearFieldError("capacityRange");
                            }}
                            className={fieldClassErrored(
                              inputClassName,
                              Boolean(fieldErrors.capacityGuestMin || fieldErrors.capacityRange)
                            )}
                            placeholder="e.g. 50"
                          />
                          <FieldError message={fieldErrors.capacityGuestMin} />
                        </div>
                        <div>
                          <InputLabel htmlFor="ws-cap-max-onb">Maximum guests</InputLabel>
                          <input
                            id="ws-cap-max-onb"
                            type="number"
                            min={1}
                            value={capacityGuestMax}
                            onChange={(e) => {
                              setCapacityGuestMax(e.target.value);
                              setGuestPresetId("cap-custom");
                              clearFieldError("guestServe");
                              clearFieldError("capacityGuestMax");
                              clearFieldError("capacityRange");
                            }}
                            className={fieldClassErrored(
                              inputClassName,
                              Boolean(fieldErrors.capacityGuestMax || fieldErrors.capacityRange)
                            )}
                            placeholder="e.g. 500"
                          />
                          <FieldError message={fieldErrors.capacityGuestMax} />
                        </div>
                      </div>
                    ) : null}
                    {fieldErrors.capacityRange ? (
                      <FieldError id="ws-cap-range-onb-err" message={fieldErrors.capacityRange} />
                    ) : null}
                    <FieldError id="ws-guest-serve-err" message={fieldErrors.guestServe} />
                  </section>

                  <section
                    className="md:col-span-2 space-y-3 border-b border-[#E5E7EB] pb-8"
                    aria-labelledby="ws-q-experience"
                    {...(fieldErrors.experience ? { "data-invalid-field": "" } : {})}
                  >
                    <div>
                      <h3 id="ws-q-experience" className="text-lg font-semibold tracking-tight text-[#374151]">
                        How experienced are you? <span className="text-brand-red">*</span>
                      </h3>
                      <p className="mt-1 text-sm text-[#6B7280]">Rough tenure is fine — customers trust honesty.</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {EXPERIENCE_PRESETS.map((p) => (
                        <ChoiceChip
                          key={p.id}
                          selected={experiencePresetId === p.id}
                          onClick={() => {
                            setExperiencePresetId(p.id);
                            setYearsInBusiness(String(p.years));
                            clearFieldError("experience");
                            clearFieldError("yearsInBusiness");
                          }}
                          title={p.label}
                        />
                      ))}
                      <ChoiceChip
                        selected={experiencePresetId === "exp-custom"}
                        onClick={() => {
                          setExperiencePresetId("exp-custom");
                          clearFieldError("experience");
                        }}
                        title="Custom"
                        subtitle="Enter exact years"
                      />
                    </div>
                    {experiencePresetId === "exp-custom" ? (
                      <div className="max-w-xs pt-2">
                        <InputLabel htmlFor="ws-years-onb">Years in business</InputLabel>
                        <input
                          id="ws-years-onb"
                          type="number"
                          min={0}
                          max={120}
                          value={yearsInBusiness}
                          onChange={(e) => {
                            setYearsInBusiness(e.target.value);
                            setExperiencePresetId("exp-custom");
                            clearFieldError("experience");
                            clearFieldError("yearsInBusiness");
                          }}
                          className={fieldClassErrored(inputClassName, Boolean(fieldErrors.yearsInBusiness))}
                          placeholder="e.g. 5"
                        />
                        <FieldError id="ws-years-onb-err" message={fieldErrors.yearsInBusiness} />
                      </div>
                    ) : null}
                    <FieldError id="ws-experience-err" message={fieldErrors.experience} />
                  </section>

                  <section
                    className="md:col-span-2 space-y-3 border-b border-[#E5E7EB] pb-8"
                    aria-labelledby="ws-q-price-guest"
                    {...(fieldErrors.priceTier || fieldErrors.priceFrom ? { "data-invalid-field": "" } : {})}
                  >
                    <div>
                      <h3 id="ws-q-price-guest" className="text-lg font-semibold tracking-tight text-[#374151]">
                        What&apos;s your average price per guest? <span className="text-brand-red">*</span>
                      </h3>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Typical starting rate — you can refine details later.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {PRICE_PER_GUEST_PRESETS.map((p) => (
                        <ChoiceChip
                          key={p.id}
                          selected={pricePresetId === p.id}
                          onClick={() => {
                            setPricePresetId(p.id);
                            setPriceBand(p.band);
                            setPriceFrom(String(p.priceHint));
                            clearFieldError("priceTier");
                            clearFieldError("priceFrom");
                          }}
                          title={p.label}
                          subtitle={p.hint}
                        />
                      ))}
                      <ChoiceChip
                        selected={pricePresetId === "price-custom"}
                        onClick={() => {
                          setPricePresetId("price-custom");
                          setPriceBand("custom");
                          clearFieldError("priceTier");
                          clearFieldError("priceFrom");
                        }}
                        title={"I'll enter my rate"}
                        subtitle="INR per guest + band"
                      />
                    </div>
                    {pricePresetId === "price-custom" ? (
                      <div className="grid max-w-2xl grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                        <div>
                          <InputLabel htmlFor="ws-price-from-onb">Average price per guest (INR)</InputLabel>
                          <input
                            id="ws-price-from-onb"
                            type="number"
                            min={0}
                            value={priceFrom}
                            onChange={(e) => {
                              setPriceFrom(e.target.value);
                              setPricePresetId("price-custom");
                              clearFieldError("priceTier");
                              clearFieldError("priceFrom");
                            }}
                            className={fieldClassErrored(
                              inputClassName,
                              Boolean(fieldErrors.priceFrom || fieldErrors.priceTier)
                            )}
                            placeholder="e.g. 550"
                          />
                          <FieldError id="ws-price-from-onb-err" message={fieldErrors.priceFrom} />
                        </div>
                        <div>
                          <InputLabel htmlFor="ws-price-band-onb">Price band</InputLabel>
                          <select
                            id="ws-price-band-onb"
                            value={priceBand}
                            onChange={(e) => {
                              setPriceBand(e.target.value);
                              setPricePresetId("price-custom");
                              clearFieldError("priceTier");
                            }}
                            className={inputClassName}
                          >
                            <option value="custom">Custom</option>
                            <option value="budget">Budget-friendly</option>
                            <option value="mid">Mid-range</option>
                            <option value="premium">Premium</option>
                          </select>
                        </div>
                      </div>
                    ) : null}
                    <FieldError id="ws-price-tier-err" message={fieldErrors.priceTier} />
                  </section>

                  <section
                    className="md:col-span-2 space-y-3 border-b border-[#E5E7EB] pb-8"
                    aria-labelledby="ws-q-categories"
                    {...(fieldErrors.categories ? { "data-invalid-field": "" } : {})}
                  >
                    <div>
                      <h3
                        id="ws-q-categories"
                        className="text-lg font-semibold tracking-tight text-[#374151]"
                      >
                        What types of catering do you specialize in?{" "}
                        <span className="text-brand-red">*</span>
                      </h3>
                      <p className="mt-1 text-sm text-[#6B7280]">Select all that apply — tap to add or remove.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => {
                        const on = categoryCodes.includes(c.id);
                        return (
                          <ToggleChip
                            key={c.id}
                            selected={on}
                            onClick={() => {
                              setCategoryCodes((prev) =>
                                prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                              );
                              clearFieldError("categories");
                            }}
                          >
                            {c.name}
                          </ToggleChip>
                        );
                      })}
                    </div>
                    <FieldError id="ws-categories-err" message={fieldErrors.categories} />
                  </section>

                  <section
                    className="md:col-span-2 space-y-3 border-b border-[#E5E7EB] pb-8"
                    aria-labelledby="ws-q-services"
                    {...(fieldErrors.services ? { "data-invalid-field": "" } : {})}
                  >
                    <div>
                      <h3 id="ws-q-services" className="text-lg font-semibold tracking-tight text-[#374151]">
                        Which services do you actually provide? <span className="text-brand-red">*</span>
                      </h3>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Search by name, then tap a row to add or remove — like a compact multi-select.
                      </p>
                    </div>
                    <SearchableMultiSelect
                      id="ws-services-search"
                      options={offerings.map((o) => ({ id: o.id, label: o.name }))}
                      value={serviceOfferingIds}
                      onChange={(next) => {
                        setServiceOfferingIds(next);
                        clearFieldError("services");
                      }}
                      placeholder="Search services…"
                      searchPlaceholder="Filter or add more services…"
                      aria-invalid={Boolean(fieldErrors.services)}
                      aria-describedby={fieldErrors.services ? "ws-services-err" : undefined}
                      errored={Boolean(fieldErrors.services)}
                    />
                    <FieldError id="ws-services-err" message={fieldErrors.services} />
                  </section>

                  <section
                    className="md:col-span-2 space-y-3"
                    aria-labelledby="ws-q-keywords"
                    {...(fieldErrors.keywords ? { "data-invalid-field": "" } : {})}
                  >
                    <div>
                      <h3 id="ws-q-keywords" className="text-lg font-semibold tracking-tight text-[#374151]">
                        What should people type to find you in search?{" "}
                        <span className="text-brand-red">*</span>
                      </h3>
                      <p id="ws-keywords-hint" className="mt-1 text-sm text-[#6B7280]">
                        Search suggestions from other listings, or add your own phrases — Enter or click &quot;Add&quot;.
                        Up to {WORKSPACE_KEYWORD_LIMIT} keywords.
                      </p>
                    </div>
                    <SearchableKeywordTags
                      id="ws-keywords"
                      value={keywordList}
                      onChange={(next) => {
                        setKeywordList(next);
                        clearFieldError("keywords");
                      }}
                      fetchSuggestions={fetchKeywordSuggestions}
                      browseCatalog={keywordBrowseCatalog}
                      placeholder="Search keywords or type a phrase to add…"
                      searchPlaceholder="Add another keyword…"
                      aria-invalid={Boolean(fieldErrors.keywords)}
                      aria-describedby={
                        fieldErrors.keywords ? "ws-keywords-err ws-keywords-hint" : "ws-keywords-hint"
                      }
                      errored={Boolean(fieldErrors.keywords)}
                    />
                    <FieldError id="ws-keywords-err" message={fieldErrors.keywords} />
                  </section>
                </>
              ) : (
                <>
                  <div className="md:col-span-1" {...(fieldErrors.categories ? { "data-invalid-field": "" } : {})}>
                    <InputLabel htmlFor="ws-categories">
                      Categories <span className="text-brand-red">*</span>
                    </InputLabel>
                    <p className="mb-3 text-xs text-gray-500">
                      Hold Ctrl (Windows) or Cmd (Mac) to select multiple categories.
                    </p>
                    <select
                      id="ws-categories"
                      multiple
                      aria-invalid={Boolean(fieldErrors.categories)}
                      aria-describedby={fieldErrors.categories ? "ws-categories-err" : undefined}
                      value={categoryCodes}
                      onChange={(e) => {
                        setCategoryCodes(Array.from(e.target.selectedOptions).map((opt) => opt.value));
                        clearFieldError("categories");
                      }}
                      className={fieldClassErrored(multiSelectClassName, Boolean(fieldErrors.categories))}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} className="rounded-sm py-2 text-sm">
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <FieldError id="ws-categories-err" message={fieldErrors.categories} />
                  </div>

                  <div className="md:col-span-1" {...(fieldErrors.services ? { "data-invalid-field": "" } : {})}>
                    <InputLabel htmlFor="ws-services-search-default">
                      Services offered <span className="text-brand-red">*</span>
                    </InputLabel>
                    <p className="mb-3 text-xs text-gray-500">
                      Search and pick services — multi-select with a clearer layout than a plain list box.
                    </p>
                    <SearchableMultiSelect
                      id="ws-services-search-default"
                      options={offerings.map((o) => ({ id: o.id, label: o.name }))}
                      value={serviceOfferingIds}
                      onChange={(next) => {
                        setServiceOfferingIds(next);
                        clearFieldError("services");
                      }}
                      placeholder="Search services…"
                      searchPlaceholder="Filter or add more…"
                      aria-invalid={Boolean(fieldErrors.services)}
                      aria-describedby={fieldErrors.services ? "ws-services-err" : undefined}
                      errored={Boolean(fieldErrors.services)}
                    />
                    <FieldError id="ws-services-err" message={fieldErrors.services} />
                  </div>

                  <div className="md:col-span-2" {...(fieldErrors.keywords ? { "data-invalid-field": "" } : {})}>
                    <InputLabel htmlFor="ws-keywords">
                      Keywords <span className="text-brand-red">*</span>
                    </InputLabel>
                    <p id="ws-keywords-hint-default" className="mb-2 text-xs text-gray-500">
                      Search suggestions from other listings, or add your own phrases — Enter or click &quot;Add&quot;. Up
                      to 10 keywords only.
                    </p>
                    <SearchableKeywordTags
                      id="ws-keywords-default"
                      value={keywordList}
                      onChange={(next) => {
                        setKeywordList(next);
                        clearFieldError("keywords");
                      }}
                      fetchSuggestions={fetchKeywordSuggestions}
                      browseCatalog={keywordBrowseCatalog}
                      placeholder="Search or type keywords to add…"
                      searchPlaceholder="Add more…"
                      aria-invalid={Boolean(fieldErrors.keywords)}
                      aria-describedby={
                        fieldErrors.keywords
                          ? "ws-keywords-err ws-keywords-hint-default"
                          : "ws-keywords-hint-default"
                      }
                      errored={Boolean(fieldErrors.keywords)}
                    />
                    <FieldError id="ws-keywords-err" message={fieldErrors.keywords} />
                  </div>
                </>
              )}
            </>
          ) : null}

          {step === 2 ? (
            <div className="md:col-span-2 space-y-8">
              <StepIntro step={2} uiVariant={uiVariant} />

              <section className="space-y-2">
                <InputLabel>Banner image (optional)</InputLabel>
                <p className="text-xs text-[#6B7280]">Wide hero shown across the top of your listing.</p>
                <div
                  className={`relative flex min-h-[168px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden ${fieldRadius} border-2 border-dashed p-8 text-center transition-all duration-300 ${
                    bannerDragging
                      ? "border-brand-red bg-red-50"
                      : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-brand-red hover:bg-red-50/30"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setBannerDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setBannerDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setBannerDragging(false);
                    if (e.dataTransfer.files?.[0]) handleBannerFileUpload(e.dataTransfer.files[0]);
                  }}
                  onClick={() => bannerFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={bannerFileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleBannerFileUpload(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                  {heroImageUrl ? (
                    <div className="absolute inset-0 h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroImageUrl}
                        alt="Banner preview"
                        className="h-full w-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <span className="flex items-center gap-2 rounded-sm bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                          <UploadSimple weight="bold" aria-hidden /> Click or drag to replace
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red">
                        <UploadSimple className="h-6 w-6" weight="bold" aria-hidden />
                      </div>
                      <p className="mb-1 text-sm font-bold text-[#1c1c1c]">Banner — click or drag one image</p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF — wide ratio works best</p>
                    </>
                  )}
                </div>
              </section>

              <section className="space-y-3" {...(fieldErrors.gallery ? { "data-invalid-field": "" } : {})}>
                <div>
                  <InputLabel htmlFor="ws-gallery-files-trigger">
                    Gallery photos <span className="text-brand-red">*</span>
                  </InputLabel>
                  <p id="ws-gallery-hint" className="mt-1 text-xs text-[#6B7280]">
                    Up to {WORKSPACE_GALLERY_MAX} images (~5 MB each). Select multiple files or drag them here.
                  </p>
                </div>

                {galleryUrls.length > 0 ? (
                  <ul
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                    aria-label="Gallery photo previews"
                  >
                    {galleryUrls.map((url, idx) => (
                      <li
                        key={`${idx}-${url.slice(0, 64)}`}
                        className="group relative aspect-square overflow-hidden rounded-sm border border-[#E5E7EB] bg-[#F9FAFB]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          aria-label={`Remove gallery photo ${idx + 1}`}
                          className="absolute top-1 right-1 flex h-8 w-8 items-center justify-center rounded-sm bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                          onClick={() => removeGalleryAt(idx)}
                        >
                          <Trash className="h-4 w-4" weight="bold" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div
                  className={`relative flex min-h-[140px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden ${fieldRadius} border-2 border-dashed p-6 text-center transition-all duration-300 ${
                    galleryDragging
                      ? "border-brand-red bg-red-50"
                      : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-brand-red hover:bg-red-50/30"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setGalleryDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setGalleryDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setGalleryDragging(false);
                    if (e.dataTransfer.files?.length) void appendGalleryFiles(e.dataTransfer.files);
                  }}
                  onClick={() => galleryFileInputRef.current?.click()}
                >
                  <input
                    id="ws-gallery-files-trigger"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={galleryFileInputRef}
                    aria-describedby="ws-gallery-hint"
                    onChange={(e) => {
                      void appendGalleryFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-brand-red">
                    <Images className="h-5 w-5" weight="bold" aria-hidden />
                  </div>
                  <p className="mb-1 text-sm font-bold text-[#1c1c1c]">Gallery — add multiple images</p>
                  <p className="max-w-md text-xs text-gray-500">
                    Click to browse or drop files here. You can select several photos at once.
                  </p>
                </div>

                <FieldError id="ws-gallery-err" message={fieldErrors.gallery} />
              </section>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="md:col-span-2">
              <StepIntro step={3} uiVariant={uiVariant} />
              <div className={`overflow-hidden ${fieldRadius} border border-gray-200 bg-white shadow-sm`}>
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-5 sm:px-8">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#1c1c1c]">
                    <PaperPlaneRight className="text-brand-red" weight="fill" aria-hidden />
                    Ready to publish
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Review the checklist before your listing goes live on the marketplace.
                  </p>
                </div>
                <div className="p-6 sm:p-8">
                  <ul className="grid gap-6 sm:grid-cols-2">
                    <li className="flex items-start gap-4">
                      {cityId && about.trim() ? (
                        <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                        <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className="text-sm font-semibold text-gray-900">Business details</p>
                         <p className="mt-1 text-xs text-gray-500">City and about are required.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      {categoryCodes.length > 0 ? (
                         <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                         <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className="text-sm font-semibold text-gray-900">Categories</p>
                         <p className="mt-1 text-xs text-gray-500">Select at least one category.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      {serviceOfferingIds.length > 0 && keywords.length > 0 ? (
                         <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                         <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className="text-sm font-semibold text-gray-900">Services & keywords</p>
                         <p className="mt-1 text-xs text-gray-500">Pick services and add search keywords.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      {galleryImageUrls.length > 0 ? (
                         <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                         <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className="text-sm font-semibold text-gray-900">Gallery</p>
                         <p className="mt-1 text-xs text-gray-500">Add at least one gallery photo.</p>
                      </div>
                    </li>
                  </ul>
                  
                  <div className={`mt-8 ${fieldRadius} border border-[#4CAF50]/25 bg-[#4CAF50]/10 p-5`}>
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 rounded-full bg-white p-2 shadow-sm ring-1 ring-[#4CAF50]/20">
                        <CheckCircle className="h-6 w-6 text-[#4CAF50]" weight="fill" aria-hidden />
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#1c1c1c]">Marketplace visibility</p>
                        <p className="mt-1 text-sm text-gray-600">
                          When every item above is complete and you save, your listing goes live for customers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => {
              setFieldErrors({});
              setStep((s) => (s > 0 ? ((s - 1) as WizardStepIndex) : s));
            }}
            disabled={step === 0 || saveM.isPending}
            className={
              uiVariant === "onboarding"
                ? "cursor-pointer rounded-sm px-6 py-3 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#1c1c1c] disabled:cursor-not-allowed disabled:opacity-40"
                : "cursor-pointer rounded-sm border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-[#1c1c1c] disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {uiVariant === "onboarding" ? "Back" : "Previous Step"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (step === 3) {
                for (let si = 0; si <= 2; si++) {
                  const errs = validateStepFields(si as WizardStepIndex);
                  if (Object.keys(errs).length > 0) {
                    setFieldErrors(errs);
                    setStep(si as WizardStepIndex);
                    window.setTimeout(() => {
                      document.querySelector("[data-invalid-field]")?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 50);
                    return;
                  }
                }
                setFieldErrors({});
              } else {
                const errs = validateStepFields(step);
                if (Object.keys(errs).length > 0) {
                  setFieldErrors(errs);
                  window.setTimeout(() => {
                    document.querySelector("[data-invalid-field]")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }, 50);
                  return;
                }
                setFieldErrors({});
              }
              saveM.mutate(step, {
                onSuccess: () => {
                  if (step === 3) {
                    router.replace("/workspace");
                    return;
                  }
                  setStep((s) => Math.min(3, s + 1) as WizardStepIndex);
                },
              });
            }}
            disabled={saveM.isPending}
            className={`group ml-auto flex cursor-pointer items-center gap-2 rounded-sm px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none ${
              step === 3 && uiVariant === "onboarding"
                ? "bg-[#4CAF50] hover:bg-emerald-600"
                : "bg-brand-red shadow-brand-red/25 hover:bg-red-700 hover:shadow-brand-red/30"
            }`}
          >
            {saveM.isPending
              ? step === 3 && uiVariant === "onboarding"
                ? "Publishing..."
                : "Saving..."
              : step === 3
                ? uiVariant === "onboarding"
                  ? "Publish"
                  : "Publish Profile"
                : uiVariant === "onboarding"
                  ? "Next step"
                  : "Save & Continue"}
            {!saveM.isPending && step !== 3 && uiVariant === "onboarding" && (
              <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
            {!saveM.isPending && step !== 3 && uiVariant !== "onboarding" && (
              <PaperPlaneRight weight="bold" className="ml-1" />
            )}
            {!saveM.isPending && step === 3 && uiVariant === "onboarding" && (
              <Check weight="bold" className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceBusinessPage() {
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
    <div className="w-full">
      {enabled && profile && citiesQ.data && categoriesQ.data && offeringsQ.data ? (
        <WorkspaceBusinessWizard
          key={`${profile.cityId ?? "none"}-${profile.published}-${profile.completion.isComplete}`}
          token={token!}
          profile={profile}
          cities={citiesQ.data}
          categories={categoriesQ.data}
          offerings={offeringsQ.data}
          keywordBrowseCatalog={keywordCatalogQ.data ?? []}
          accountUser={user}
          uiVariant="onboarding"
        />
      ) : (
        <div className="mt-12 flex h-64 flex-col items-center justify-center rounded-sm border border-gray-200 bg-white shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-red" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-gray-400">Loading wizard…</p>
        </div>
      )}
    </div>
  );
}
