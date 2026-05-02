"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { patchAccountProfile, type AuthUser } from "@/lib/auth-api";
import {
  type CatererWorkspaceProfile,
  fetchMarketplaceKeywordSuggestions,
  type MarketplaceKeywordRef,
  patchWorkspaceCatererProfileStep,
  publishWorkspaceCatererProfile,
  type PatchWorkspaceProfileStep0Body,
  type PatchWorkspaceProfileStep1Body,
  uploadCateringImage,
} from "@/lib/catering-api";
import {
  Briefcase,
  ForkKnife,
  Images,
  Image as ImageIcon,
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
import {
  ABOUT_MIN_LEN,
  fieldRadius,
  inputClassName,
  MAX_GALLERY_UPLOAD_BYTES,
  multiSelectClassName,
  textareaClassName,
  WORKSPACE_GALLERY_MAX,
  workspaceCardTitleClass,
  workspaceHintTextClass,
  workspaceLabelTextClass,
} from "./constants";
import { ChoiceChip, FieldError, InputLabel, ToggleChip } from "./form-primitives";
import { OnboardingStyleStepper } from "./OnboardingStyleStepper";
import { StepIntro } from "./StepIntro";
import {
  EXPERIENCE_PRESETS,
  fieldClassErrored,
  firstIncompleteStep,
  GUEST_CAPACITY_PRESETS,
  inferExperiencePresetFromYears,
  inferGuestPresetFromNumbers,
  inferPricePresetFromProfile,
  isValidGallerySource,
  parsePriceBand,
  parseStreetParts,
  PRICE_PER_GUEST_PRESETS,
} from "./utils";
import type { ProfileEditorTabId, WizardStepIndex } from "./wizard-metadata";
import {
  PROFILE_TAB_ORDER,
  tabIdToStep,
  WIZARD_STEPS,
} from "./wizard-metadata";

export function WorkspaceBusinessWizard({
  token,
  profile,
  cities,
  categories,
  offerings,
  keywordBrowseCatalog,
  accountUser,
  uiVariant = "default",
  layout = "wizard",
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
  /** `tabs` — workspace editor (business / services / gallery); `wizard` — full onboarding flow */
  layout?: "wizard" | "tabs";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { refreshUser } = useAuth();
  const profileTab = useMemo<ProfileEditorTabId>(() => {
    const t = searchParams.get("tab");
    return t === "business" || t === "services" || t === "gallery" ? t : "business";
  }, [searchParams]);

  /** Profile tabs: white shell only (`admin-profile.html`); fields match onboarding everywhere */
  const isProfileTabs = layout === "tabs";
  /** Same services-step UX as onboarding (guest tiers, chips, etc.), including `/workspace/profile?tab=services` */
  const richServicesStepUi = uiVariant === "onboarding" || layout === "tabs";
  const fieldInput = inputClassName;
  const fieldTextarea = textareaClassName;
  const fieldMulti = multiSelectClassName;
  const surfaceRound = fieldRadius;

  const [step, setStep] = useState<WizardStepIndex>(firstIncompleteStep(profile));

  const displayStep: WizardStepIndex =
    layout === "tabs" ? (tabIdToStep(profileTab) as WizardStepIndex) : step;
  const [businessName, setBusinessName] = useState(accountUser?.businessName ?? "");
  const [contactFullName, setContactFullName] = useState(accountUser?.fullName ?? "");
  const [cityId, setCityId] = useState(profile.cityId ?? "");

  /* eslint-disable react-hooks/set-state-in-effect -- mirror account name fields when AuthContext user updates (refreshUser) */
  useEffect(() => {
    if (!accountUser) return;
    setBusinessName(accountUser.businessName ?? "");
    setContactFullName(accountUser.fullName);
  }, [accountUser]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
      const servicesLikeOnboarding = uiVariant === "onboarding" || layout === "tabs";
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

        /** Guest capacity, experience & price are on services step (onboarding + profile tabs) */
        const skipCapacityDetail = servicesLikeOnboarding;
        const skipYearsDetail = servicesLikeOnboarding;
        const skipPriceFromFormat = servicesLikeOnboarding;

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
          !servicesLikeOnboarding ||
          (Boolean(guestPresetId) && guestPresetId !== "cap-custom");

        if (servicesLikeOnboarding) {
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
          !servicesLikeOnboarding ||
          (Boolean(experiencePresetId) && experiencePresetId !== "exp-custom");
        const skipPriceFmtStep1 =
          !servicesLikeOnboarding ||
          (Boolean(pricePresetId) && pricePresetId !== "price-custom");

        if (servicesLikeOnboarding) {
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
      layout,
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

        if (uiVariant !== "onboarding" && layout !== "tabs") {
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
        if (uiVariant === "onboarding" || layout === "tabs") {
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
        return [...slice, ...prev];
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
          : layout === "tabs"
            ? "w-full min-w-0"
            : `mt-6 overflow-hidden ${fieldRadius} border border-gray-200 bg-white shadow-sm`
      }
    >
      {/* Stepper (full wizard only) */}
      {layout === "wizard" && uiVariant === "onboarding" ? (
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
      ) : layout === "wizard" ? (
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
      ) : null}

      {layout === "tabs" ? (
        <div role="tablist" aria-label="Listing sections" className="ws-listing-tab-strip">
          {PROFILE_TAB_ORDER.map((tabId) => {
            const label =
              tabId === "business"
                ? "Business"
                : tabId === "services"
                  ? "Services & Keywords"
                  : "Gallery";
            const active = profileTab === tabId;
            return (
              <Link
                key={tabId}
                role="tab"
                aria-selected={active}
                href={`/workspace/profile?tab=${tabId}`}
                scroll={false}
                className={`ws-listing-tab-link ${active ? "ws-listing-tab-link--active" : "ws-listing-tab-link--idle"}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div
        className={
          isProfileTabs ? "pb-20" : uiVariant === "onboarding" ? "pb-4" : "p-6 sm:p-10 lg:p-12"
        }
      >
        <div className={isProfileTabs ? "ws-listing-card" : ""}>
          {isProfileTabs && profileTab === "business" ? (
            <div className="mb-6 flex items-center gap-3">
              <span className="ws-listing-section-icon" aria-hidden>
                <Briefcase weight="fill" className="h-4 w-4" />
              </span>
              <h3 className={`font-heading text-xl font-semibold tracking-tight text-[#374151]`}>
                Business Information
              </h3>
            </div>
          ) : null}
          {isProfileTabs && profileTab === "services" ? (
            <div className="mb-6 flex items-center gap-3">
              <span className="ws-listing-section-icon" aria-hidden>
                <ForkKnife weight="fill" className="h-4 w-4" />
              </span>
              <h3 className={`font-heading text-xl font-semibold tracking-tight text-[#374151]`}>
                Services & Keywords
              </h3>
            </div>
          ) : null}
          {isProfileTabs && profileTab === "gallery" ? (
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="ws-listing-section-icon" aria-hidden>
                  <ImageIcon weight="fill" className="h-4 w-4" />
                </span>
                <h3 className={`font-heading text-xl font-semibold tracking-tight text-[#374151]`}>
                  Business Gallery
                </h3>
              </div>
              <p className={`mt-2 ${workspaceHintTextClass}`}>
                Upload photos of your food, setup, and previous events.
              </p>
            </div>
          ) : null}

          <div
            className={`grid md:grid-cols-2 ${
              isProfileTabs || uiVariant === "onboarding"
                ? "gap-x-8 gap-y-5"
                : "gap-x-10 gap-y-8"
            }`}
          >
          {displayStep === 0 ? (
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
                      className={fieldClassErrored(fieldInput, Boolean(fieldErrors.businessName))}
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
                      className={fieldClassErrored(fieldInput, Boolean(fieldErrors.contactFullName))}
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
                  <span className={`font-normal ${workspaceHintTextClass}`}>(optional)</span>
                </InputLabel>
                <input
                  value={streetLine}
                  onChange={(e) => setStreetLine(e.target.value)}
                  placeholder="e.g. Unit 3, Link Road"
                  className={fieldInput}
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
                    fieldErrors.pincode
                      ? "ws-pincode-err"
                      : uiVariant === "onboarding"
                        ? "ws-pincode-hint"
                        : undefined
                  }
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    clearFieldError("pincode");
                  }}
                  placeholder="e.g. 400001"
                  className={fieldClassErrored(fieldInput, Boolean(fieldErrors.pincode))}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                />
                {fieldErrors.pincode ? (
                  <FieldError id="ws-pincode-err" message={fieldErrors.pincode} />
                ) : uiVariant === "onboarding" ? (
                  <p id="ws-pincode-hint" className={`mt-1 ${workspaceHintTextClass}`}>
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
                  className={fieldInput}
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
                  className={fieldClassErrored(fieldTextarea, Boolean(fieldErrors.about))}
                />
                <FieldError id="ws-about-err" message={fieldErrors.about} />
              </div>

              {uiVariant !== "onboarding" && layout !== "tabs" ? (
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
                      fieldInput,
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
                      fieldInput,
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
                  className={fieldClassErrored(fieldInput, Boolean(fieldErrors.yearsInBusiness))}
                />
                <FieldError id="ws-years-err" message={fieldErrors.yearsInBusiness} />
              </div>
              <div>
                <InputLabel htmlFor="ws-price-band">Price band</InputLabel>
                <select
                  id="ws-price-band"
                  value={priceBand}
                  onChange={(e) => setPriceBand(e.target.value)}
                  className={fieldInput}
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
                  className={fieldClassErrored(fieldInput, Boolean(fieldErrors.priceFrom))}
                />
                <FieldError id="ws-price-from-err" message={fieldErrors.priceFrom} />
              </div>
              </>
              ) : null}
            </>
          ) : null}

          {displayStep === 1 ? (
            <>
              <StepIntro step={1} uiVariant={uiVariant} />

              {richServicesStepUi ? (
                <>
                  <section
                    className="md:col-span-2 space-y-3 border-b border-[#E5E7EB] pb-8"
                    aria-labelledby="ws-q-guests"
                    {...(fieldErrors.guestServe ? { "data-invalid-field": "" } : {})}
                  >
                    <div>
                      <h3 id="ws-q-guests" className={workspaceLabelTextClass}>
                        How many guests can you serve? <span className="text-brand-red">*</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>
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
                              fieldInput,
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
                              fieldInput,
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
                      <h3 id="ws-q-experience" className={workspaceLabelTextClass}>
                        How experienced are you? <span className="text-brand-red">*</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>Rough tenure is fine — customers trust honesty.</p>
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
                          className={fieldClassErrored(fieldInput, Boolean(fieldErrors.yearsInBusiness))}
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
                      <h3 id="ws-q-price-guest" className={workspaceLabelTextClass}>
                        What&apos;s your average price per guest? <span className="text-brand-red">*</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>
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
                              fieldInput,
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
                            className={fieldInput}
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
                      <h3 id="ws-q-categories" className={workspaceLabelTextClass}>
                        What types of catering do you specialize in?{" "}
                        <span className="text-brand-red">*</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>Select all that apply — tap to add or remove.</p>
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
                      <h3 id="ws-q-services" className={workspaceLabelTextClass}>
                        Which services do you actually provide? <span className="text-brand-red">*</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>
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
                      <h3 id="ws-q-keywords" className={workspaceLabelTextClass}>
                        What should people type to find you in search?{" "}
                        <span className="text-brand-red">*</span>
                      </h3>
                      <p id="ws-keywords-hint" className={`mt-1 ${workspaceHintTextClass}`}>
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
                    <p className={`mb-3 mt-1 ${workspaceHintTextClass}`}>
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
                      className={fieldClassErrored(fieldMulti, Boolean(fieldErrors.categories))}
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
                    <p className={`mb-3 mt-1 ${workspaceHintTextClass}`}>
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
                    <p id="ws-keywords-hint-default" className={`mb-2 mt-1 ${workspaceHintTextClass}`}>
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

          {displayStep === 2 ? (
            <div className="md:col-span-2 space-y-8">
              <StepIntro step={2} uiVariant={uiVariant} />

              <section className="space-y-2">
                <InputLabel>Banner image (optional)</InputLabel>
                <p className={`mt-1 ${workspaceHintTextClass}`}>Wide hero shown across the top of your listing.</p>
                <div
                  className={`relative flex min-h-[168px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden ${surfaceRound} border-2 border-dashed p-8 text-center transition-all duration-300 ${
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
                      <p className={`mb-1 ${workspaceLabelTextClass}`}>Banner — click or drag one image</p>
                      <p className={workspaceHintTextClass}>PNG, JPG or GIF — wide ratio works best</p>
                    </>
                  )}
                </div>
              </section>

              <section className="space-y-3" {...(fieldErrors.gallery ? { "data-invalid-field": "" } : {})}>
                <div>
                  <InputLabel htmlFor="ws-gallery-files-trigger">
                    Gallery photos <span className="text-brand-red">*</span>
                  </InputLabel>
                  <p id="ws-gallery-hint" className={`mt-1 ${workspaceHintTextClass}`}>
                    Up to {WORKSPACE_GALLERY_MAX} images (~5 MB each). The first tile adds photos (drag, drop, or click); new shots appear in the same grid. Trash removes a photo.
                  </p>
                </div>

                <ul
                  className="list-none grid grid-cols-2 gap-3 p-0 sm:grid-cols-3 md:grid-cols-4"
                  aria-label="Gallery upload and photo previews"
                >
                  <li className={`relative aspect-square min-h-0 min-w-0 ${surfaceRound}`}>
                    <div
                      className={`absolute inset-0 flex cursor-pointer flex-col items-center justify-center overflow-hidden p-2 text-center transition-all duration-300 sm:p-3 ${surfaceRound} border-2 border-dashed ${
                        galleryDragging
                          ? "border-brand-red bg-red-50"
                          : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-brand-red hover:bg-red-50/30"
                      }`}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setGalleryDragging(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                        setGalleryDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setGalleryDragging(false);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setGalleryDragging(false);
                        if (e.dataTransfer.files?.length) void appendGalleryFiles(e.dataTransfer.files);
                      }}
                      onClick={() => galleryFileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          galleryFileInputRef.current?.click();
                        }
                      }}
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
                      <div className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-red sm:h-10 sm:w-10">
                        <Images className="h-4 w-4 sm:h-5 sm:w-5" weight="bold" aria-hidden />
                      </div>
                      <p className={workspaceCardTitleClass}>Add photos</p>
                      <p className={`mt-0.5 hidden ${workspaceHintTextClass} sm:block`}>Drop or click</p>
                    </div>
                  </li>
                  {galleryUrls.map((url, idx) => (
                    <li
                      key={`${idx}-${url.slice(0, 64)}`}
                      className={`relative aspect-square min-h-0 min-w-0 overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] ${surfaceRound}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label={`Remove gallery photo ${idx + 1}`}
                        className="absolute top-2 right-2 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-brand-red shadow-md ring-1 ring-black/10 transition hover:scale-105 hover:bg-red-50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 active:scale-95"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeGalleryAt(idx);
                        }}
                      >
                        <Trash className="h-5 w-5" weight="bold" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>

                <FieldError id="ws-gallery-err" message={fieldErrors.gallery} />
              </section>
            </div>
          ) : null}

          {displayStep === 3 ? (
            <div className="md:col-span-2">
              <StepIntro step={3} uiVariant={uiVariant} />
              <div className={`overflow-hidden ${fieldRadius} border border-gray-200 bg-white shadow-sm`}>
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-5 sm:px-8">
                  <h3 className={`flex items-center gap-2 ${workspaceLabelTextClass}`}>
                    <PaperPlaneRight className="text-brand-red" weight="fill" aria-hidden />
                    Ready to publish
                  </h3>
                  <p className={`mt-1 ${workspaceHintTextClass}`}>
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
                         <p className={workspaceCardTitleClass}>Business details</p>
                         <p className={`mt-1 ${workspaceHintTextClass}`}>City and about are required.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      {categoryCodes.length > 0 ? (
                         <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                         <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className={workspaceCardTitleClass}>Categories</p>
                         <p className={`mt-1 ${workspaceHintTextClass}`}>Select at least one category.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      {serviceOfferingIds.length > 0 && keywords.length > 0 ? (
                         <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                         <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className={workspaceCardTitleClass}>Services & keywords</p>
                         <p className={`mt-1 ${workspaceHintTextClass}`}>Pick services and add search keywords.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      {galleryImageUrls.length > 0 ? (
                         <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                         <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className={workspaceCardTitleClass}>Gallery</p>
                         <p className={`mt-1 ${workspaceHintTextClass}`}>Add at least one gallery photo.</p>
                      </div>
                    </li>
                  </ul>
                  
                  <div className={`mt-8 ${fieldRadius} border border-[#4CAF50]/25 bg-[#4CAF50]/10 p-5`}>
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 rounded-full bg-white p-2 shadow-sm ring-1 ring-[#4CAF50]/20">
                        <CheckCircle className="h-6 w-6 text-[#4CAF50]" weight="fill" aria-hidden />
                      </div>
                      <div>
                        <p className={workspaceCardTitleClass}>Marketplace visibility</p>
                        <p className={`mt-1 ${workspaceHintTextClass}`}>
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

        {isProfileTabs ? (
          <div className="mt-8 flex justify-end border-t border-gray-50 pt-6">
            <button
              type="button"
              onClick={() => {
                const errs = validateStepFields(displayStep);
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
                saveM.mutate(displayStep);
              }}
              disabled={saveM.isPending}
              className="cursor-pointer rounded-2xl bg-brand-red px-10 py-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(229,57,53,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-red-700 hover:shadow-[0_12px_25px_rgba(229,57,53,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
            >
              {saveM.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        ) : null}
        </div>

        {!isProfileTabs ? (
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
        ) : null}
      </div>
    </div>
  );
}
