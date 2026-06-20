"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken, patchAccountProfile, type AuthUser } from "@/lib/auth-api";
import {
  type CatererWorkspaceProfile,
  // fetchMarketplaceKeywordSuggestions,
  // type MarketplaceKeywordRef,
  patchWorkspaceCatererProfileStep,
  patchWorkspaceCatererProfileAddress,
  type PatchWorkspaceProfileAddressBody,
  publishWorkspaceCatererProfile,
  type PatchWorkspaceProfileStep0Body,
  type PatchWorkspaceProfileStep1Body,
  cateringImagePreviewUrl,
  resolveCateringImageDisplayUrl,
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
  Clock,
} from "@phosphor-icons/react";
// import {
//   SearchableKeywordTags,
//   WORKSPACE_KEYWORD_LIMIT,
// } from "@/components/workspace/SearchableKeywordTags";
import { SearchableMultiSelect } from "@/components/workspace/SearchableMultiSelect";
import { buildWorkspaceAddressPersistBody } from "./address-persist";
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
import {
  ChoiceChip,
  FieldError,
  ImageUploadProgressOverlay,
  InputLabel,
  ToggleChip,
} from "./form-primitives";
import { OnboardingStyleStepper } from "./OnboardingStyleStepper";
import { StepIntro } from "./StepIntro";
import {
  fieldClassErrored,
  firstIncompleteStep,
  getExperiencePresets,
  getGuestCapacityPresets,
  getPricePerGuestPresets,
  hasSubmittedWorkspaceProfile,
  inferExperiencePresetFromYears,
  inferGuestPresetFromNumbers,
  inferPricePresetFromProfile,
  initialPriceFromField,
  initialPriceToField,
  resolvePriceFieldsForSave,
  isValidBannerSource,
  isValidGallerySource,
  optionalNonNegativeIntFromField,
  optionalPositiveIntFromField,
  optionalPriceFromField,
  parsePriceBand,
  parseStreetParts,
  matchCatalogCityId,
} from "./utils";
import { useI18n } from "@/context/LocaleContext";
import type { ProfileEditorTabId, WizardStepIndex } from "./wizard-metadata";
import {
  getWizardSteps,
  PROFILE_TAB_ORDER,
  tabIdToStep,
} from "./wizard-metadata";

const WorkspaceAddressMapPicker = dynamic(
  () =>
    import("./WorkspaceAddressMapPicker").then((m) => ({
      default: m.WorkspaceAddressMapPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[280px] w-full animate-pulse rounded-lg bg-stone-100 ring-1 ring-stone-200/80 md:col-span-2"
        aria-hidden
      />
    ),
  }
);

export function WorkspaceBusinessWizard({
  token,
  profile,
  cities,
  categories,
  offerings,
  // keywordBrowseCatalog,
  accountUser,
  uiVariant = "default",
  layout = "wizard",
}: {
  token: string;
  profile: CatererWorkspaceProfile;
  cities: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  offerings: { id: string; name: string }[];
  /** Keywords UI disabled — catalog fetch commented out in workspace pages. */
  // keywordBrowseCatalog: MarketplaceKeywordRef[];
  accountUser: AuthUser | null;
  uiVariant?: "default" | "onboarding";
  /** `tabs` — workspace editor (business / services / gallery); `wizard` — full onboarding flow */
  layout?: "wizard" | "tabs";
}) {
  const { ws, trans } = useI18n();
  const wv = ws.wizard.validation;
  const wu = ws.wizard.upload;
  const wp = ws.wizard.presets;
  const wizardSteps = useMemo(() => getWizardSteps(ws), [ws]);
  const guestCapacityPresets = useMemo(() => getGuestCapacityPresets(ws), [ws]);
  const experiencePresets = useMemo(() => getExperiencePresets(ws), [ws]);
  const pricePerGuestPresets = useMemo(() => getPricePerGuestPresets(ws, trans), [ws, trans]);

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
  const profileSubmitted = hasSubmittedWorkspaceProfile(profile);
  const isOnboardingWizard = layout === "wizard" && uiVariant === "onboarding";
  const maxOnboardingStep: WizardStepIndex = profileSubmitted ? 2 : 3;
  const fieldInput = inputClassName;
  const fieldTextarea = textareaClassName;
  const fieldMulti = multiSelectClassName;
  const surfaceRound = fieldRadius;

  const [step, setStep] = useState<WizardStepIndex>(firstIncompleteStep(profile));

  useEffect(() => {
    if (!isOnboardingWizard || !profileSubmitted) return;
    router.replace("/workspace");
  }, [isOnboardingWizard, profileSubmitted, router]);

  useEffect(() => {
    if (!isOnboardingWizard || !profileSubmitted) return;
    if (step > maxOnboardingStep) {
      setStep(maxOnboardingStep);
    }
  }, [isOnboardingWizard, profileSubmitted, step, maxOnboardingStep]);

  const displayStep: WizardStepIndex =
    layout === "tabs" ? (tabIdToStep(profileTab) as WizardStepIndex) : step;
  const [businessName, setBusinessName] = useState(accountUser?.businessName ?? "");
  const [contactFullName, setContactFullName] = useState(accountUser?.fullName ?? "");
  const [cityId, setCityId] = useState(profile.cityId ?? "");
  const [cityName, setCityName] = useState(profile.cityName ?? "");

  /* eslint-disable react-hooks/set-state-in-effect -- mirror account name fields when AuthContext user updates (refreshUser) */
  useEffect(() => {
    if (!accountUser) return;
    setBusinessName(accountUser.businessName ?? "");
    setContactFullName(accountUser.fullName);
  }, [accountUser]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const streetParts = parseStreetParts(profile.streetAddress);
  const [addressLine1, setAddressLine1] = useState(
    () => profile.addressLine1 ?? profile.streetAddress ?? streetParts.line ?? ""
  );
  const [addressLine2, setAddressLine2] = useState(profile.addressLine2 ?? "");
  const [pincode, setPincode] = useState(profile.pincode ?? streetParts.pin);
  const [addressState, setAddressState] = useState(profile.state ?? "");
  const [addressCountry, setAddressCountry] = useState(profile.country ?? "");
  const [latitude, setLatitude] = useState<number | null>(profile.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(profile.longitude ?? null);
  const [tagline, setTagline] = useState(profile.tagline ?? "");
  const [about, setAbout] = useState(profile.about ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(profile.heroImageUrl ?? "");
  const [priceBand, setPriceBand] = useState(profile.priceBand ?? "");
  const [priceFrom, setPriceFrom] = useState(() =>
    initialPriceFromField(profile.priceBand, profile.priceFrom ?? null, profile.priceTo ?? null, ws)
  );
  const [priceTo, setPriceTo] = useState(() =>
    initialPriceToField(profile.priceBand, profile.priceFrom ?? null, profile.priceTo ?? null, ws)
  );
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
    inferGuestPresetFromNumbers(profile.capacityGuestMin ?? null, profile.capacityGuestMax ?? null, ws)
  );
  const [experiencePresetId, setExperiencePresetId] = useState(() =>
    inferExperiencePresetFromYears(profile.yearsInBusiness ?? null, ws)
  );
  const [pricePresetId, setPricePresetId] = useState(() =>
    inferPricePresetFromProfile(
      profile.priceBand,
      profile.priceFrom ?? null,
      profile.priceTo ?? null,
      ws
    )
  );
  const [categoryCodes, setCategoryCodes] = useState<string[]>(profile.categoryCodes ?? []);
  const [serviceOfferingIds, setServiceOfferingIds] = useState<string[]>(profile.serviceOfferingIds ?? []);
  // const [keywordList, setKeywordList] = useState<string[]>(() =>
  //   (profile.keywords ?? []).map((k) => k.trim()).filter(Boolean)
  // );
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() =>
    (profile.galleryImageUrls ?? [])
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, WORKSPACE_GALLERY_MAX)
  );

  const [bannerDragging, setBannerDragging] = useState(false);
  const [galleryDragging, setGalleryDragging] = useState(false);
  const [bannerUploadProgress, setBannerUploadProgress] = useState<number | null>(null);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{
    percent: number;
    label: string;
  } | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // const keywords = useMemo(
  //   () => keywordList.map((x) => x.trim()).filter(Boolean),
  //   [keywordList]
  // );

  // const fetchKeywordSuggestions = useCallback(
  //   (term: string) => fetchMarketplaceKeywordSuggestions(term),
  //   []
  // );
  const galleryImageUrls = useMemo(
    () => galleryUrls.map((x) => x.trim()).filter(Boolean),
    [galleryUrls]
  );

  const galleryDisplayUrls = useMemo(
    () => galleryImageUrls.map(resolveCateringImageDisplayUrl),
    [galleryImageUrls]
  );

  const bannerDisplayUrl = useMemo(
    () => resolveCateringImageDisplayUrl(heroImageUrl),
    [heroImageUrl]
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
            e.businessName = wv.businessName;
          }
          if (contactFullName.trim().length < 2) {
            e.contactFullName = wv.contactFullName;
          }
        }
        if (!cityName.trim()) {
          e.cityName = wv.cityName;
        }
        const needsAddressFields = uiVariant === "onboarding" || layout === "tabs";
        if (needsAddressFields && !addressLine1.trim()) {
          e.addressLine1 = wv.addressLine1;
        }
        if (needsAddressFields && pincodeDigits.length !== 6) {
          e.pincode = wv.pincode;
        }
        const needsMapLocation = needsAddressFields;
        if (
          needsMapLocation &&
          (latitude == null ||
            longitude == null ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude))
        ) {
          e.location = wv.location;
        }
        const aboutTrim = about.trim();
        if (!aboutTrim) {
          e.about = wv.aboutRequired;
        } else if (aboutTrim.length < ABOUT_MIN_LEN) {
          e.about = trans(wv.aboutMinLength, { min: ABOUT_MIN_LEN });
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
            e.capacityGuestMin = wv.capacityGuestMin;
          }
          if (
            capMaxRaw !== "" &&
            (!Number.isFinite(capMax) || capMax < 1 || !Number.isInteger(capMax))
          ) {
            e.capacityGuestMax = wv.capacityGuestMax;
          }
          if (
            Number.isFinite(capMin) &&
            Number.isFinite(capMax) &&
            !e.capacityGuestMin &&
            !e.capacityGuestMax &&
            capMin > capMax
          ) {
            e.capacityRange = wv.capacityRange;
          }
        }

        const pf = priceFrom.trim();
        if (pf !== "" && !skipPriceFromFormat) {
          const n = Number(pf);
          if (!Number.isFinite(n) || n < 0) {
            e.priceFrom = wv.priceFrom;
          }
        }

        if (!skipYearsDetail) {
          const y = yearsInBusiness.trim();
          if (y !== "") {
            const ny = Number(y);
            if (!Number.isFinite(ny) || ny < 0 || ny > 120 || !Number.isInteger(ny)) {
              e.yearsInBusiness = wv.yearsInBusiness;
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
            e.guestServe = wv.guestServe;
          } else if (guestPresetId === "cap-custom") {
            if (!capMin1 || !capMax1) {
              e.guestServe = wv.guestServeCustom;
            }
          }
        }

        if (!skipGuestsCapacityDetail) {
          if (
            capMin1 !== "" &&
            (!Number.isFinite(capMinN) || capMinN < 1 || !Number.isInteger(capMinN))
          ) {
            e.capacityGuestMin = wv.capacityGuestMin;
          }
          if (
            capMax1 !== "" &&
            (!Number.isFinite(capMaxN) || capMaxN < 1 || !Number.isInteger(capMaxN))
          ) {
            e.capacityGuestMax = wv.capacityGuestMax;
          }
          if (
            Number.isFinite(capMinN) &&
            Number.isFinite(capMaxN) &&
            !e.capacityGuestMin &&
            !e.capacityGuestMax &&
            capMinN > capMaxN
          ) {
            e.capacityRange = wv.capacityRange;
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
            e.experience = wv.experience;
          } else if (experiencePresetId === "exp-custom" && !yearsInBusiness.trim()) {
            e.experience = wv.experienceCustom;
          }

          if (!pricePresetId) {
            e.priceTier = wv.priceTier;
          } else if (pricePresetId === "price-custom") {
            if (!priceFrom.trim() || !priceTo.trim()) {
              e.priceTier = wv.priceTierCustom;
            }
          }
        }

        const pfStep1 = priceFrom.trim();
        const ptStep1 = priceTo.trim();
        if (pricePresetId === "price-custom") {
          if (pfStep1 !== "" && !skipPriceFmtStep1) {
            const n = Number(pfStep1);
            if (!Number.isFinite(n) || n < 0) {
              e.priceFrom = wv.priceFrom;
            }
          }
          if (ptStep1 !== "" && !skipPriceFmtStep1) {
            const n = Number(ptStep1);
            if (!Number.isFinite(n) || n < 0) {
              e.priceTo = wv.priceTo;
            }
          }
          const minN = pfStep1 === "" ? NaN : Number(pfStep1);
          const maxN = ptStep1 === "" ? NaN : Number(ptStep1);
          if (
            Number.isFinite(minN) &&
            Number.isFinite(maxN) &&
            !e.priceFrom &&
            !e.priceTo &&
            minN > maxN
          ) {
            e.priceRange = wv.priceRange;
          }
        } else if (pfStep1 !== "" && !skipPriceFmtStep1) {
          const n = Number(pfStep1);
          if (!Number.isFinite(n) || n < 0) {
            e.priceFrom = wv.priceFrom;
          }
        }

        if (!skipExpNumericStep1) {
          const y = yearsInBusiness.trim();
          if (y !== "") {
            const ny = Number(y);
            if (!Number.isFinite(ny) || ny < 0 || ny > 120 || !Number.isInteger(ny)) {
              e.yearsInBusiness = wv.yearsInBusiness;
            }
          }
        }

        if (categoryCodes.length === 0) {
          e.categories = wv.categories;
        }
        if (serviceOfferingIds.length === 0) {
          e.services = wv.services;
        }
        // Keywords UI disabled — skip validation.
        // if (keywords.length === 0) {
        //   e.keywords = wv.keywords;
        // } else if (keywords.length > WORKSPACE_KEYWORD_LIMIT) {
        //   e.keywords = trans(ws.wizard.errors.keywordsMax, { limit: WORKSPACE_KEYWORD_LIMIT });
        // }
      } else if (s === 2) {
        const heroTrim = heroImageUrl.trim();
        if (!heroTrim) {
          e.banner = wv.bannerRequired;
        } else if (!isValidBannerSource(heroImageUrl)) {
          e.banner = wv.bannerInvalid;
        }
        if (galleryImageUrls.length === 0) {
          e.gallery = wv.galleryRequired;
        } else if (galleryImageUrls.length > WORKSPACE_GALLERY_MAX) {
          e.gallery = trans(ws.wizard.errors.galleryMax, { max: WORKSPACE_GALLERY_MAX });
        } else {
          const badIdx = galleryImageUrls.findIndex((url) => !isValidGallerySource(url));
          if (badIdx !== -1) {
            e.gallery = trans(wv.galleryPhotoInvalid, { index: badIdx + 1 });
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
      cityName,
      addressLine1,
      contactFullName,
      galleryImageUrls,
      heroImageUrl,
      // keywords,
      pincodeDigits,
      latitude,
      longitude,
      priceFrom,
      priceTo,
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
      const accessToken = getStoredToken() ?? token;
      if (!accessToken) {
        throw new Error(wv.sessionExpired);
      }

      if (accountUser && saveStep === 0) {
        await patchAccountProfile(accessToken, {
          fullName: contactFullName.trim(),
          businessName: businessName.trim(),
        });
      }

      if (saveStep === 3) {
        return publishWorkspaceCatererProfile(accessToken);
      }

      const line1Trimmed = addressLine1.trim();
      const line2Trimmed = addressLine2.trim();
      const pinTrimmed = pincode.replace(/\D/g, "").slice(0, 6);

      if (saveStep === 0) {
        const body: PatchWorkspaceProfileStep0Body = {
          about: about.trim(),
        };
        if (cityId.trim()) body.cityId = cityId.trim();
        if (cityName.trim()) body.cityName = cityName.trim();
        if (line1Trimmed) body.addressLine1 = line1Trimmed;
        if (line2Trimmed) body.addressLine2 = line2Trimmed;
        if (pinTrimmed.length === 6) body.pincode = pinTrimmed;
        if (addressState.trim()) body.state = addressState.trim();
        if (addressCountry.trim()) body.country = addressCountry.trim();
        if (latitude != null && longitude != null) {
          body.latitude = latitude;
          body.longitude = longitude;
        }
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

        return patchWorkspaceCatererProfileStep(accessToken, 0, body);
      }

      if (saveStep === 1) {
        const body: PatchWorkspaceProfileStep1Body = {
          categoryCodes,
          serviceOfferingIds,
          keywords: [], // Keywords UI disabled
        };
        if (uiVariant === "onboarding" || layout === "tabs") {
          const capMin = optionalPositiveIntFromField(capacityGuestMin);
          const capMax = optionalPositiveIntFromField(capacityGuestMax);
          const years = optionalNonNegativeIntFromField(yearsInBusiness);
          const { priceFrom: pf, priceTo: pt } = resolvePriceFieldsForSave(
            pricePresetId,
            priceFrom,
            priceTo,
            ws
          );
          if (capMin != null) body.capacityGuestMin = capMin;
          if (capMax != null) body.capacityGuestMax = capMax;
          if (years != null) body.yearsInBusiness = years;
          const pb = parsePriceBand(priceBand);
          if (pb) body.priceBand = pb;
          if (pf != null) body.priceFrom = pf;
          if (pt !== undefined) body.priceTo = pt;
        }
        return patchWorkspaceCatererProfileStep(accessToken, 1, body);
      }

      return patchWorkspaceCatererProfileStep(accessToken, 2, {
        galleryImageUrls,
        heroImageUrl,
      });
    },
    onSuccess: async (updated) => {
      if (updated?.cityId) setCityId(updated.cityId);
      await refreshUser();
      void qc.invalidateQueries({ queryKey: ["workspace", "profile", token] });
      void qc.invalidateQueries({ queryKey: ["marketplace", "workspace-cities"] });
      if (layout === "tabs") {
        toast.success(ws.common.saveSuccess);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addressSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistAddressM = useMutation({
    mutationFn: async (body: PatchWorkspaceProfileAddressBody) => {
      const accessToken = getStoredToken() ?? token;
      if (!accessToken) {
        throw new Error(wv.sessionExpired);
      }
      return patchWorkspaceCatererProfileAddress(accessToken, body);
    },
    onSuccess: (updated) => {
      if (updated.cityId) setCityId(updated.cityId);
      void qc.invalidateQueries({ queryKey: ["workspace", "profile", token] });
      void qc.invalidateQueries({ queryKey: ["marketplace", "workspace-cities"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const scheduleAddressPersist = useCallback(
    (body: PatchWorkspaceProfileAddressBody) => {
      if (addressSaveTimerRef.current) {
        clearTimeout(addressSaveTimerRef.current);
      }
      addressSaveTimerRef.current = setTimeout(() => {
        persistAddressM.mutate(body);
      }, 500);
    },
    [persistAddressM],
  );

  useEffect(
    () => () => {
      if (addressSaveTimerRef.current) {
        clearTimeout(addressSaveTimerRef.current);
      }
    },
    [],
  );

  const persistAddressFields = useCallback(
    (
      patch: Partial<{
        latitude: number | null;
        longitude: number | null;
        addressLine1: string;
        addressLine2: string;
        cityName: string;
        state: string;
        country: string;
        pincode: string;
        cityId: string;
      }> = {},
      options?: { immediate?: boolean },
    ) => {
      const lat = patch.latitude ?? latitude;
      const lng = patch.longitude ?? longitude;
      if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }
      const body = buildWorkspaceAddressPersistBody({
        latitude: lat,
        longitude: lng,
        addressLine1: patch.addressLine1 ?? addressLine1,
        addressLine2: patch.addressLine2 ?? addressLine2,
        cityName: patch.cityName ?? cityName,
        state: patch.state ?? addressState,
        country: patch.country ?? addressCountry,
        pincode: patch.pincode ?? pincode,
        cityId: patch.cityId ?? cityId,
      });
      if (options?.immediate) {
        if (addressSaveTimerRef.current) {
          clearTimeout(addressSaveTimerRef.current);
          addressSaveTimerRef.current = null;
        }
        persistAddressM.mutate(body);
        return;
      }
      scheduleAddressPersist(body);
    },
    [
      latitude,
      longitude,
      addressLine1,
      addressLine2,
      cityName,
      addressState,
      addressCountry,
      pincode,
      cityId,
      scheduleAddressPersist,
      persistAddressM,
    ],
  );

  const handleBannerFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size === 0) {
      return;
    }
    if (file.size > MAX_GALLERY_UPLOAD_BYTES) {
      toast.error(wu.imageTooLarge);
      return;
    }
    const accessToken = getStoredToken() ?? token;
    if (!accessToken) {
      toast.error(wu.sessionExpired);
      return;
    }
    if (bannerUploadProgress !== null) {
      return;
    }
    setBannerUploadProgress(0);
    try {
      const uploaded = await uploadCateringImage(accessToken, file, "banner", {
        onProgress: setBannerUploadProgress,
      });
      setHeroImageUrl(cateringImagePreviewUrl(uploaded));
      clearFieldError("banner");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : wu.couldNotUploadBanner);
    } finally {
      setBannerUploadProgress(null);
    }
  };

  const appendGalleryFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files?.length || galleryUploadProgress !== null) return;
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) {
        return;
      }

      const accessToken = getStoredToken() ?? token;
      if (!accessToken) {
        toast.error(wu.sessionExpired);
        return;
      }

      const accepted: string[] = [];
      const total = list.length;
      try {
        for (let i = 0; i < list.length; i++) {
          const file = list[i]!;
          if (file.size > MAX_GALLERY_UPLOAD_BYTES) {
            toast.error(trans(wu.fileTooLarge, { name: file.name }));
            continue;
          }
          const label =
            total > 1
              ? trans(wu.uploadingPhotoN, { current: i + 1, total })
              : wu.uploadingPhoto;
          setGalleryUploadProgress({ percent: 0, label });
          try {
            const uploaded = await uploadCateringImage(accessToken, file, "gallery", {
              onProgress: (percent) => {
                setGalleryUploadProgress({ percent, label });
              },
            });
            accepted.push(cateringImagePreviewUrl(uploaded));
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : trans(wu.couldNotUploadFile, { name: file.name })
            );
          }
        }
      } finally {
        setGalleryUploadProgress(null);
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
    [clearFieldError, galleryUploadProgress, token]
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
            : `mt-6 overflow-visible ${fieldRadius} border border-gray-200 bg-white shadow-sm`
      }
    >
      {/* Stepper (full wizard only) */}
      {layout === "wizard" && uiVariant === "onboarding" ? (
        <nav aria-label={ws.wizard.aria.progress} className="mb-2">
          <OnboardingStyleStepper
            step={step}
            showSubmitStep={!profileSubmitted}
            navigationDisabled={saveM.isPending}
            onSelectCompletedStep={(target) => {
              setFieldErrors({});
              setStep(target);
            }}
          />
        </nav>
      ) : layout === "wizard" ? (
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-8 sm:px-12 sm:py-10">
          <nav aria-label={ws.wizard.aria.progress}>
            <ol role="list" className="flex items-center justify-between">
              {wizardSteps.map((stepItem, idx) => {
                const active = idx === step;
                const done = idx < step;
                const Icon = stepItem.icon;
                return (
                  <li
                    key={stepItem.label}
                    className={`relative flex-1 ${idx !== 0 ? "pl-2" : ""} ${idx !== wizardSteps.length - 1 ? "pr-2" : "flex-none"}`}
                  >
                    {idx !== wizardSteps.length - 1 && (
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
        <div role="tablist" aria-label={ws.wizard.aria.listingSections} className="ws-listing-tab-strip">
          {PROFILE_TAB_ORDER.map((tabId) => {
            const label =
              tabId === "business"
                ? ws.wizard.profileTabs.business
                : tabId === "services"
                  ? ws.wizard.profileTabs.servicesKeywords
                  : ws.wizard.profileTabs.gallery;
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
                {ws.wizard.sections.businessInfo}
              </h3>
            </div>
          ) : null}
          {isProfileTabs && profileTab === "services" ? (
            <div className="mb-6 flex items-center gap-3">
              <span className="ws-listing-section-icon" aria-hidden>
                <ForkKnife weight="fill" className="h-4 w-4" />
              </span>
              <h3 className={`font-heading text-xl font-semibold tracking-tight text-[#374151]`}>
                {ws.wizard.sections.servicesKeywords}
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
                  {ws.wizard.sections.businessGallery}
                </h3>
              </div>
              <p className={`mt-2 ${workspaceHintTextClass}`}>
                {ws.wizard.sections.galleryHint}
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
                      {ws.wizard.fields.businessName} <span className="text-brand-red">{ws.common.required}</span>
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
                      placeholder={ws.wizard.placeholders.businessName}
                      maxLength={120}
                    />
                    <FieldError id="ws-business-name-err" message={fieldErrors.businessName} />
                  </div>
                  <div
                    className="md:col-span-2"
                    {...(fieldErrors.contactFullName ? { "data-invalid-field": "" } : {})}
                  >
                    <InputLabel htmlFor="ws-contact-name">
                      {ws.wizard.fields.contactPerson} <span className="text-brand-red">{ws.common.required}</span>
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
                      placeholder={ws.wizard.placeholders.contactName}
                      maxLength={120}
                    />
                    <FieldError id="ws-contact-name-err" message={fieldErrors.contactFullName} />
                  </div>
                </>
              ) : null}

              <div
                className="relative z-[60] overflow-visible md:col-span-2"
                {...(fieldErrors.addressLine1 || fieldErrors.location ? { "data-invalid-field": "" } : {})}
              >
                <WorkspaceAddressMapPicker
                  latitude={latitude}
                  longitude={longitude}
                  addressLine1={addressLine1}
                  addressLine2={addressLine2}
                  pincode={pincode}
                  resolvedCity={cityName}
                  resolvedState={addressState}
                  resolvedCountry={addressCountry}
                  requestDeviceLocation={uiVariant === "onboarding" && latitude == null && longitude == null}
                  required={uiVariant === "onboarding" || layout === "tabs"}
                  labels={{
                    addressLine1: ws.wizard.fields.addressLine1,
                    addressLine1Hint: ws.wizard.fields.addressLine1Hint,
                    searchPlaceholder: ws.wizard.placeholders.addressLine1Search,
                    openMap: ws.wizard.fields.openMap,
                    closeMap: ws.wizard.fields.closeMap,
                    saveMapLocation: ws.wizard.fields.saveMapLocation,
                    cancelMap: ws.wizard.fields.cancelMap,
                    mapModalTitle: ws.wizard.fields.mapModalTitle,
                    mapModalHint: ws.wizard.fields.mapModalHint,
                    mapInteractHint: ws.wizard.fields.mapInteractHint,
                    shareLocationTitle: ws.wizard.fields.shareLocationTitle,
                    shareLocationHint: ws.wizard.fields.shareLocationHint,
                    shareLocationButton: ws.wizard.fields.shareLocationButton,
                    shareLocationRequesting: ws.wizard.fields.shareLocationRequesting,
                    shareLocationDenied: ws.wizard.fields.shareLocationDenied,
                    shareLocationUnavailable: ws.wizard.fields.shareLocationUnavailable,
                    shareLocationDismiss: ws.wizard.fields.shareLocationDismiss,
                    mapsNotConfigured: wv.mapsNotConfigured,
                    mapsLoadError: wv.mapsLoadError,
                    mapsApiEnableHint: wv.mapsApiEnableHint,
                    mapsApiTargetBlocked: wv.mapsApiTargetBlocked,
                    mapsRefererNotAllowed: wv.mapsRefererNotAllowed,
                    mapsInvalidKey: wv.mapsInvalidKey,
                    mapsApiNotActivated: wv.mapsApiNotActivated,
                    mapsBilling: wv.mapsBilling,
                  }}
                  invalid={Boolean(fieldErrors.addressLine1 || fieldErrors.location)}
                  onChange={(v) => {
                    const matchedCityId = matchCatalogCityId(cities, v.city, v.district);
                    const nextCityName = v.city.trim() || cityName;
                    const nextState = v.state.trim() || addressState;
                    const nextCountry = v.country.trim() || addressCountry;
                    const coordsChanged =
                      v.latitude !== latitude || v.longitude !== longitude;

                    setLatitude(v.latitude);
                    setLongitude(v.longitude);
                    setAddressLine1(v.addressLine1);
                    setAddressLine2(v.addressLine2);
                    setPincode(v.pincode ?? pincode);
                    setCityName(nextCityName);
                    setAddressState(nextState);
                    setAddressCountry(nextCountry);
                    if (matchedCityId) {
                      setCityId(matchedCityId);
                    }

                    clearFieldError("location");
                    clearFieldError("pincode");
                    clearFieldError("cityName");
                    clearFieldError("addressLine1");

                    persistAddressFields(
                      {
                        latitude: v.latitude,
                        longitude: v.longitude,
                        addressLine1: v.addressLine1,
                        addressLine2: v.addressLine2,
                        cityName: nextCityName,
                        pincode: v.pincode ?? pincode,
                        state: nextState,
                        country: nextCountry,
                        cityId: matchedCityId ?? "",
                      },
                      { immediate: coordsChanged },
                    );
                  }}
                />
                <FieldError id="ws-address-line-1-err" message={fieldErrors.addressLine1} />
                <FieldError id="ws-location-err" message={fieldErrors.location} />
              </div>
              <div className="md:col-span-2">
                <InputLabel htmlFor="ws-address-line-2">
                  {ws.wizard.fields.addressLine2}{" "}
                  <span className={`font-normal ${workspaceHintTextClass}`}>{ws.common.optional}</span>
                </InputLabel>
                <input
                  id="ws-address-line-2"
                  aria-describedby="ws-address-line-2-hint"
                  value={addressLine2}
                  onChange={(e) => {
                    const next = e.target.value;
                    setAddressLine2(next);
                    clearFieldError("addressLine1");
                    persistAddressFields({
                      addressLine2: next,
                      latitude,
                      longitude,
                    });
                  }}
                  placeholder={ws.wizard.placeholders.addressLine2}
                  className={fieldInput}
                  autoComplete="address-line2"
                />
                <p id="ws-address-line-2-hint" className={`mt-1 ${workspaceHintTextClass}`}>
                  {ws.wizard.fields.addressLine2Hint}
                </p>
              </div>
              <div {...(fieldErrors.cityName ? { "data-invalid-field": "" } : {})}>
                <InputLabel htmlFor="ws-city-name">
                  {ws.wizard.fields.city} <span className="text-brand-red">{ws.common.required}</span>
                </InputLabel>
                <input
                  id="ws-city-name"
                  readOnly
                  aria-readonly
                  aria-invalid={Boolean(fieldErrors.cityName)}
                  aria-describedby={fieldErrors.cityName ? "ws-city-name-err" : undefined}
                  value={cityName}
                  placeholder={ws.wizard.placeholders.cityFromMap}
                  className={`${fieldClassErrored(fieldInput, Boolean(fieldErrors.cityName))} bg-[#fafafa] text-[#616161]`}
                />
                <FieldError id="ws-city-name-err" message={fieldErrors.cityName} />
              </div>
              <div>
                <InputLabel htmlFor="ws-state">{ws.wizard.fields.state}</InputLabel>
                <input
                  id="ws-state"
                  readOnly
                  aria-readonly
                  value={addressState}
                  placeholder={ws.wizard.placeholders.stateFromMap}
                  className={`${fieldInput} bg-[#fafafa] text-[#616161]`}
                />
              </div>
              <div>
                <InputLabel htmlFor="ws-country">{ws.wizard.fields.country}</InputLabel>
                <input
                  id="ws-country"
                  readOnly
                  aria-readonly
                  value={addressCountry}
                  placeholder={ws.wizard.placeholders.countryFromMap}
                  className={`${fieldInput} bg-[#fafafa] text-[#616161]`}
                />
              </div>
              <div {...(fieldErrors.pincode ? { "data-invalid-field": "" } : {})}>
                <InputLabel htmlFor="ws-pincode">
                  {ws.wizard.fields.pincode}{" "}
                  {uiVariant === "onboarding" || layout === "tabs" ? (
                    <span className="text-brand-red">{ws.common.required}</span>
                  ) : null}
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
                    const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPincode(next);
                    clearFieldError("pincode");
                    persistAddressFields({ pincode: next });
                  }}
                  placeholder={ws.wizard.placeholders.pincode}
                  className={fieldClassErrored(fieldInput, Boolean(fieldErrors.pincode))}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                />
                {fieldErrors.pincode ? (
                  <FieldError id="ws-pincode-err" message={fieldErrors.pincode} />
                ) : uiVariant === "onboarding" || layout === "tabs" ? (
                  <p id="ws-pincode-hint" className={`mt-1 ${workspaceHintTextClass}`}>
                    {ws.wizard.fields.pincodeHint}
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <InputLabel>{ws.wizard.fields.tagline}</InputLabel>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder={ws.wizard.placeholders.tagline}
                  className={fieldInput}
                />
              </div>
              <div className="md:col-span-2" {...(fieldErrors.about ? { "data-invalid-field": "" } : {})}>
                <InputLabel htmlFor="ws-about">
                  {ws.wizard.fields.about} <span className="text-brand-red">{ws.common.required}</span>
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
                  placeholder={ws.wizard.placeholders.about}
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
                  <InputLabel htmlFor="ws-cap-min">{ws.wizard.fields.minCapacity}</InputLabel>
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
                    placeholder={ws.wizard.placeholders.capacityMin}
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
                  <InputLabel htmlFor="ws-cap-max">{ws.wizard.fields.maxCapacity}</InputLabel>
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
                    placeholder={ws.wizard.placeholders.capacityMax}
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
                <InputLabel htmlFor="ws-years">{ws.wizard.fields.yearsInBusiness}</InputLabel>
                <input
                  id="ws-years"
                  type="number"
                  min={0}
                  aria-invalid={Boolean(fieldErrors.yearsInBusiness)}
                  aria-describedby={fieldErrors.yearsInBusiness ? "ws-years-err" : undefined}
                  placeholder={ws.wizard.placeholders.years}
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
                <InputLabel htmlFor="ws-price-band">{ws.wizard.fields.priceBand}</InputLabel>
                <select
                  id="ws-price-band"
                  value={priceBand}
                  onChange={(e) => setPriceBand(e.target.value)}
                  className={fieldInput}
                >
                  <option value="">{ws.wizard.priceBand.select}</option>
                  <option value="budget">{ws.wizard.priceBand.budgetFriendly}</option>
                  <option value="mid">{ws.wizard.priceBand.midRange}</option>
                  <option value="premium">{ws.wizard.priceBand.premiumLuxury}</option>
                  <option value="custom">{ws.wizard.priceBand.customPricing}</option>
                </select>
              </div>
              <div {...(fieldErrors.priceFrom ? { "data-invalid-field": "" } : {})}>
                <InputLabel htmlFor="ws-price-from">{ws.wizard.fields.priceFrom}</InputLabel>
                <input
                  id="ws-price-from"
                  type="number"
                  min={0}
                  aria-invalid={Boolean(fieldErrors.priceFrom)}
                  aria-describedby={fieldErrors.priceFrom ? "ws-price-from-err" : undefined}
                  placeholder={ws.wizard.placeholders.priceFrom}
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
                        {ws.wizard.questions.guestCapacity}{" "}
                        <span className="text-brand-red">{ws.common.required}</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>{ws.wizard.hints.guestRange}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {guestCapacityPresets.map((p) => (
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
                        title={wp.customRange}
                        subtitle={wp.customRangeSubtitle}
                      />
                    </div>
                    {guestPresetId === "cap-custom" ? (
                      <div className="grid max-w-xl grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                        <div>
                          <InputLabel htmlFor="ws-cap-min-onb">{ws.wizard.fields.minimumGuests}</InputLabel>
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
                            placeholder={ws.wizard.placeholders.capacityMin}
                          />
                          <FieldError message={fieldErrors.capacityGuestMin} />
                        </div>
                        <div>
                          <InputLabel htmlFor="ws-cap-max-onb">{ws.wizard.fields.maximumGuests}</InputLabel>
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
                            placeholder={ws.wizard.placeholders.capacityMaxOnb}
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
                        {ws.wizard.questions.experience}{" "}
                        <span className="text-brand-red">{ws.common.required}</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>{ws.wizard.questions.experienceHint}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {experiencePresets.map((p) => (
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
                        title={wp.custom}
                        subtitle={wp.customSubtitle}
                      />
                    </div>
                    {experiencePresetId === "exp-custom" ? (
                      <div className="max-w-xs pt-2">
                        <InputLabel htmlFor="ws-years-onb">{ws.wizard.fields.yearsInBusiness}</InputLabel>
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
                          placeholder={ws.wizard.placeholders.years}
                        />
                        <FieldError id="ws-years-onb-err" message={fieldErrors.yearsInBusiness} />
                      </div>
                    ) : null}
                    <FieldError id="ws-experience-err" message={fieldErrors.experience} />
                  </section>

                  <section
                    className="md:col-span-2 space-y-3 border-b border-[#E5E7EB] pb-8"
                    aria-labelledby="ws-q-price-guest"
                    {...(fieldErrors.priceTier || fieldErrors.priceFrom || fieldErrors.priceTo || fieldErrors.priceRange ? { "data-invalid-field": "" } : {})}
                  >
                    <div>
                      <h3 id="ws-q-price-guest" className={workspaceLabelTextClass}>
                        {ws.wizard.questions.pricePerGuest}{" "}
                        <span className="text-brand-red">{ws.common.required}</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>{ws.wizard.hints.priceRate}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {pricePerGuestPresets.map((p) => (
                        <ChoiceChip
                          key={p.id}
                          selected={pricePresetId === p.id}
                          onClick={() => {
                            setPricePresetId(p.id);
                            setPriceBand(p.band);
                            setPriceFrom(String(p.priceHint));
                            setPriceTo(p.priceToHint != null ? String(p.priceToHint) : "");
                            clearFieldError("priceTier");
                            clearFieldError("priceFrom");
                            clearFieldError("priceTo");
                            clearFieldError("priceRange");
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
                          clearFieldError("priceTo");
                          clearFieldError("priceRange");
                        }}
                        title={wp.enterRate}
                        subtitle={wp.enterRateSubtitle}
                      />
                    </div>
                    {pricePresetId === "price-custom" ? (
                      <div className="grid max-w-2xl grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                        <div>
                          <InputLabel htmlFor="ws-price-from-onb">
                            {ws.wizard.fields.minimumPricePerGuest}
                          </InputLabel>
                          <input
                            id="ws-price-from-onb"
                            type="number"
                            min={0}
                            value={priceFrom}
                            onChange={(e) => {
                              setPriceFrom(e.target.value);
                              setPricePresetId("price-custom");
                              setPriceBand("custom");
                              clearFieldError("priceTier");
                              clearFieldError("priceFrom");
                              clearFieldError("priceRange");
                            }}
                            className={fieldClassErrored(
                              fieldInput,
                              Boolean(fieldErrors.priceFrom || fieldErrors.priceTier || fieldErrors.priceRange)
                            )}
                            placeholder={ws.wizard.placeholders.priceFromOnb}
                          />
                          <FieldError id="ws-price-from-onb-err" message={fieldErrors.priceFrom} />
                        </div>
                        <div>
                          <InputLabel htmlFor="ws-price-to-onb">
                            {ws.wizard.fields.maximumPricePerGuest}
                          </InputLabel>
                          <input
                            id="ws-price-to-onb"
                            type="number"
                            min={0}
                            value={priceTo}
                            onChange={(e) => {
                              setPriceTo(e.target.value);
                              setPricePresetId("price-custom");
                              setPriceBand("custom");
                              clearFieldError("priceTier");
                              clearFieldError("priceTo");
                              clearFieldError("priceRange");
                            }}
                            className={fieldClassErrored(
                              fieldInput,
                              Boolean(fieldErrors.priceTo || fieldErrors.priceTier || fieldErrors.priceRange)
                            )}
                            placeholder={ws.wizard.placeholders.priceToOnb}
                          />
                          <FieldError id="ws-price-to-onb-err" message={fieldErrors.priceTo} />
                        </div>
                        <FieldError id="ws-price-range-err" message={fieldErrors.priceRange} />
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
                        {ws.wizard.questions.categories}{" "}
                        <span className="text-brand-red">{ws.common.required}</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>{ws.wizard.questions.categoriesHint}</p>
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
                        {ws.wizard.questions.services}{" "}
                        <span className="text-brand-red">{ws.common.required}</span>
                      </h3>
                      <p className={`mt-1 ${workspaceHintTextClass}`}>{ws.wizard.hints.servicesMultiSelect}</p>
                    </div>
                    <SearchableMultiSelect
                      id="ws-services-search"
                      options={offerings.map((o) => ({ id: o.id, label: o.name }))}
                      value={serviceOfferingIds}
                      onChange={(next) => {
                        setServiceOfferingIds(next);
                        clearFieldError("services");
                      }}
                      placeholder={ws.wizard.placeholders.searchServices}
                      searchPlaceholder={ws.wizard.placeholders.searchServicesFilter}
                      aria-invalid={Boolean(fieldErrors.services)}
                      aria-describedby={fieldErrors.services ? "ws-services-err" : undefined}
                      errored={Boolean(fieldErrors.services)}
                    />
                    <FieldError id="ws-services-err" message={fieldErrors.services} />
                  </section>

                  {/* Keywords UI disabled — "What should people type to find you in search?" */}
                  {/*
                  <section
                    className="md:col-span-2 space-y-3"
                    aria-labelledby="ws-q-keywords"
                    {...(fieldErrors.keywords ? { "data-invalid-field": "" } : {})}
                  >
                    ...
                  </section>
                  */}
                </>
              ) : (
                <>
                  <div className="md:col-span-1" {...(fieldErrors.categories ? { "data-invalid-field": "" } : {})}>
                    <InputLabel htmlFor="ws-categories">
                      {ws.wizard.fields.categories} <span className="text-brand-red">{ws.common.required}</span>
                    </InputLabel>
                    <p className={`mb-3 mt-1 ${workspaceHintTextClass}`}>
                      {ws.wizard.hints.categoriesMultiSelect}
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
                      {ws.wizard.fields.servicesOffered}{" "}
                      <span className="text-brand-red">{ws.common.required}</span>
                    </InputLabel>
                    <p className={`mb-3 mt-1 ${workspaceHintTextClass}`}>{ws.wizard.hints.servicesDefault}</p>
                    <SearchableMultiSelect
                      id="ws-services-search-default"
                      options={offerings.map((o) => ({ id: o.id, label: o.name }))}
                      value={serviceOfferingIds}
                      onChange={(next) => {
                        setServiceOfferingIds(next);
                        clearFieldError("services");
                      }}
                      placeholder={ws.wizard.placeholders.searchServices}
                      searchPlaceholder={ws.wizard.placeholders.searchServicesFilterShort}
                      aria-invalid={Boolean(fieldErrors.services)}
                      aria-describedby={fieldErrors.services ? "ws-services-err" : undefined}
                      errored={Boolean(fieldErrors.services)}
                    />
                    <FieldError id="ws-services-err" message={fieldErrors.services} />
                  </div>

                  {/* Keywords UI disabled — "What should people type to find you in search?" */}
                  {/*
                  <div className="md:col-span-2" {...(fieldErrors.keywords ? { "data-invalid-field": "" } : {})}>
                    ...
                  </div>
                  */}
                </>
              )}
            </>
          ) : null}

          {displayStep === 2 ? (
            <div className="md:col-span-2 space-y-8">
              <StepIntro step={2} uiVariant={uiVariant} />

              <section
                className="space-y-2"
                {...(fieldErrors.banner ? { "data-invalid-field": "" } : {})}
              >
                <InputLabel>
                  {ws.wizard.fields.bannerImage} <span className="text-brand-red">{ws.common.required}</span>
                </InputLabel>
                <p
                  id="ws-banner-hint"
                  className={`mt-1 ${workspaceHintTextClass}`}
                >
                  {ws.wizard.hints.bannerWide}
                </p>
                <div
                  className={`relative flex min-h-[168px] w-full flex-col items-center justify-center overflow-hidden ${surfaceRound} border-2 border-dashed p-8 text-center transition-all duration-300 ${fieldClassErrored("", Boolean(fieldErrors.banner))} ${
                    bannerUploadProgress !== null
                      ? "cursor-wait border-brand-red/60 bg-[#F9FAFB]"
                      : bannerDragging
                        ? "cursor-pointer border-brand-red bg-red-50"
                        : "cursor-pointer border-[#E5E7EB] bg-[#F9FAFB] hover:border-brand-red hover:bg-red-50/30"
                  }`}
                  aria-invalid={Boolean(fieldErrors.banner)}
                  aria-busy={bannerUploadProgress !== null}
                  aria-describedby={
                    fieldErrors.banner ? "ws-banner-err ws-banner-hint" : "ws-banner-hint"
                  }
                  onDragOver={(e) => {
                    if (bannerUploadProgress !== null) return;
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
                    if (bannerUploadProgress !== null) return;
                    if (e.dataTransfer.files?.[0]) handleBannerFileUpload(e.dataTransfer.files[0]);
                  }}
                  onClick={() => {
                    if (bannerUploadProgress !== null) return;
                    bannerFileInputRef.current?.click();
                  }}
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
                        src={bannerDisplayUrl}
                        alt={ws.wizard.aria.bannerPreview}
                        className="h-full w-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <span className="flex items-center gap-2 rounded-sm bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                          <UploadSimple weight="bold" aria-hidden /> {ws.wizard.gallery.clickOrDragReplace}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-brand-red">
                        <UploadSimple className="h-6 w-6" weight="bold" aria-hidden />
                      </div>
                      <p className={`mb-1 ${workspaceLabelTextClass}`}>{ws.wizard.gallery.bannerLabel}</p>
                      <p className={workspaceHintTextClass}>{ws.wizard.gallery.bannerHint}</p>
                    </>
                  )}
                  {bannerUploadProgress !== null ? (
                    <ImageUploadProgressOverlay
                      percent={bannerUploadProgress}
                      label={ws.wizard.gallery.uploadingBanner}
                    />
                  ) : null}
                </div>
                <FieldError id="ws-banner-err" message={fieldErrors.banner} />
              </section>

              <section className="space-y-3" {...(fieldErrors.gallery ? { "data-invalid-field": "" } : {})}>
                <div>
                  <InputLabel htmlFor="ws-gallery-files-trigger">
                    {ws.wizard.fields.galleryPhotos}{" "}
                    <span className="text-brand-red">{ws.common.required}</span>
                  </InputLabel>
                  <p id="ws-gallery-hint" className={`mt-1 ${workspaceHintTextClass}`}>
                    {trans(ws.wizard.gallery.galleryHelp, { max: WORKSPACE_GALLERY_MAX })}
                  </p>
                </div>

                <ul
                  className="list-none grid grid-cols-2 gap-3 p-0 sm:grid-cols-3 md:grid-cols-4"
                  aria-label={ws.wizard.aria.galleryUpload}
                >
                  <li className={`relative aspect-square min-h-0 min-w-0 ${surfaceRound}`}>
                    <div
                      className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-2 text-center transition-all duration-300 sm:p-3 ${surfaceRound} border-2 border-dashed ${
                        galleryUploadProgress !== null
                          ? "cursor-wait border-brand-red/60 bg-[#F9FAFB]"
                          : galleryDragging
                            ? "cursor-pointer border-brand-red bg-red-50"
                            : "cursor-pointer border-[#E5E7EB] bg-[#F9FAFB] hover:border-brand-red hover:bg-red-50/30"
                      }`}
                      onDragEnter={(e) => {
                        if (galleryUploadProgress !== null) return;
                        e.preventDefault();
                        setGalleryDragging(true);
                      }}
                      onDragOver={(e) => {
                        if (galleryUploadProgress !== null) return;
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
                        if (galleryUploadProgress !== null) return;
                        if (e.dataTransfer.files?.length) void appendGalleryFiles(e.dataTransfer.files);
                      }}
                      onClick={() => {
                        if (galleryUploadProgress !== null) return;
                        galleryFileInputRef.current?.click();
                      }}
                      role="button"
                      tabIndex={galleryUploadProgress !== null ? -1 : 0}
                      aria-busy={galleryUploadProgress !== null}
                      onKeyDown={(e) => {
                        if (galleryUploadProgress !== null) return;
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
                      <p className={workspaceCardTitleClass}>{ws.wizard.gallery.addPhotos}</p>
                      <p className={`mt-0.5 hidden ${workspaceHintTextClass} sm:block`}>
                        {ws.wizard.gallery.dropOrClick}
                      </p>
                      {galleryUploadProgress !== null ? (
                        <ImageUploadProgressOverlay
                          percent={galleryUploadProgress.percent}
                          label={galleryUploadProgress.label}
                        />
                      ) : null}
                    </div>
                  </li>
                  {galleryImageUrls.map((url, idx) => (
                    <li
                      key={`${idx}-${url.slice(0, 64)}`}
                      className={`relative aspect-square min-h-0 min-w-0 overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] ${surfaceRound}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={galleryDisplayUrls[idx] ?? resolveCateringImageDisplayUrl(url)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={trans(ws.wizard.aria.removeGalleryPhoto, { index: idx + 1 })}
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
                    {ws.wizard.submitReview.title}
                  </h3>
                  <p className={`mt-1 ${workspaceHintTextClass}`}>{ws.wizard.submitReview.intro}</p>
                </div>
                <div className="p-6 sm:p-8">
                  <ul className="grid gap-6 sm:grid-cols-2">
                    <li className="flex items-start gap-4">
                      {cityName && about.trim() ? (
                        <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                        <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className={workspaceCardTitleClass}>{ws.wizard.submitReview.businessDetails}</p>
                         <p className={`mt-1 ${workspaceHintTextClass}`}>
                           {ws.wizard.submitReview.businessDetailsHint}
                         </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      {categoryCodes.length > 0 ? (
                         <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                         <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className={workspaceCardTitleClass}>{ws.wizard.submitReview.categories}</p>
                         <p className={`mt-1 ${workspaceHintTextClass}`}>
                           {ws.wizard.submitReview.categoriesHint}
                         </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      {serviceOfferingIds.length > 0 ? (
                         <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                         <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className={workspaceCardTitleClass}>{ws.wizard.fields.services}</p>
                         <p className={`mt-1 ${workspaceHintTextClass}`}>
                           {ws.wizard.submitReview.servicesHint}
                         </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      {galleryImageUrls.length > 0 && isValidBannerSource(heroImageUrl) ? (
                         <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                      ) : (
                         <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-gray-300" weight="fill" />
                      )}
                      <div>
                         <p className={workspaceCardTitleClass}>{ws.wizard.submitReview.bannerGallery}</p>
                         <p className={`mt-1 ${workspaceHintTextClass}`}>
                           {ws.wizard.submitReview.bannerGalleryHint}
                         </p>
                      </div>
                    </li>
                  </ul>

                  <div className={`mt-8 ${fieldRadius} border border-gray-200 bg-gray-50/80 p-5 sm:p-6`}>
                    <p className={workspaceCardTitleClass}>{ws.wizard.submitReview.afterSubmit}</p>
                    <ol className={`mt-4 space-y-4 ${workspaceHintTextClass}`}>
                      <li className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
                          1
                        </span>
                        <span>
                          <span className="font-semibold text-brand-text-dark">
                            {ws.wizard.submitReview.stepYouSubmit}
                          </span>{" "}
                          — {ws.wizard.submitReview.stepYouSubmitDetail}
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
                          2
                        </span>
                        <span>
                          <span className="font-semibold text-brand-text-dark">
                            {ws.wizard.submitReview.stepAdminReview}
                          </span>{" "}
                          — {ws.wizard.submitReview.stepAdminReviewDetail}
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
                          3
                        </span>
                        <span>
                          <span className="font-semibold text-brand-text-dark">
                            {ws.wizard.submitReview.stepGoesLive}
                          </span>{" "}
                          — {ws.wizard.submitReview.stepGoesLiveDetail}
                        </span>
                      </li>
                    </ol>
                  </div>

                  <MarketplaceVisibilityNotice
                    approvalStatus={profile.approvalStatus}
                    published={profile.published}
                  />
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
              {saveM.isPending ? ws.common.saving : ws.common.saveChanges}
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
              {uiVariant === "onboarding" ? ws.common.back : ws.common.previousStep}
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
                      toast.success(ws.wizard.submitReview.successToast);
                      router.replace("/workspace");
                      return;
                    }
                    setStep((s) => Math.min(maxOnboardingStep, s + 1) as WizardStepIndex);
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
                ? step === 3
                  ? ws.common.submittingEllipsis
                  : ws.common.savingEllipsis
                : step === 3
                  ? ws.wizard.buttons.submitForReview
                  : uiVariant === "onboarding"
                    ? ws.common.nextStep
                    : ws.wizard.buttons.saveAndContinue}
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

function marketplaceVisibilityCopy(
  approvalStatus: CatererWorkspaceProfile["approvalStatus"],
  published: boolean,
  ws: import("@/i18n/workspace.messages").WorkspaceMessages,
): { title: string; message: string; tone: "success" | "pending" | "rejected" | "info" } {
  const v = ws.wizard.visibility;
  if (published && approvalStatus === "approved") {
    return { title: v.liveTitle, message: v.liveMessage, tone: "success" };
  }
  if (approvalStatus === "pending_review") {
    return { title: v.pendingTitle, message: v.pendingMessage, tone: "pending" };
  }
  if (approvalStatus === "rejected") {
    return { title: v.rejectedTitle, message: v.rejectedMessage, tone: "rejected" };
  }
  return { title: v.infoTitle, message: v.infoMessage, tone: "info" };
}

function MarketplaceVisibilityNotice({
  approvalStatus,
  published,
}: {
  approvalStatus: CatererWorkspaceProfile["approvalStatus"];
  published: boolean;
}) {
  const { ws } = useI18n();
  const copy = marketplaceVisibilityCopy(approvalStatus, published, ws);
  const boxClass =
    copy.tone === "success"
      ? "border-[#4CAF50]/25 bg-[#4CAF50]/10"
      : copy.tone === "pending"
        ? "border-amber-200 bg-amber-50"
        : copy.tone === "rejected"
          ? "border-rose-200 bg-rose-50"
          : "border-[#4CAF50]/25 bg-[#4CAF50]/10";
  const iconColor =
    copy.tone === "success"
      ? "text-[#4CAF50]"
      : copy.tone === "pending"
        ? "text-amber-600"
        : copy.tone === "rejected"
          ? "text-rose-600"
          : "text-[#4CAF50]";
  const ringClass =
    copy.tone === "success"
      ? "ring-[#4CAF50]/20"
      : copy.tone === "pending"
        ? "ring-amber-200"
        : copy.tone === "rejected"
          ? "ring-rose-200"
          : "ring-[#4CAF50]/20";

  return (
    <div className={`mt-8 ${fieldRadius} border p-5 ${boxClass}`}>
      <div className="flex items-center gap-4">
        <div className={`shrink-0 rounded-full bg-white p-2 shadow-sm ring-1 ${ringClass}`}>
          {copy.tone === "pending" ? (
            <Clock className={`h-6 w-6 ${iconColor}`} weight="fill" aria-hidden />
          ) : copy.tone === "rejected" ? (
            <XCircle className={`h-6 w-6 ${iconColor}`} weight="fill" aria-hidden />
          ) : (
            <CheckCircle className={`h-6 w-6 ${iconColor}`} weight="fill" aria-hidden />
          )}
        </div>
        <div>
          <p className={workspaceCardTitleClass}>{copy.title}</p>
          <p className={`mt-1 ${workspaceHintTextClass}`}>{copy.message}</p>
        </div>
      </div>
    </div>
  );
}
