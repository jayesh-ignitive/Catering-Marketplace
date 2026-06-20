"use client";

import { useI18n } from "@/context/LocaleContext";
import type { WebsiteMessages } from "@/i18n/website.messages";
import {
  ArrowLeft,
  Calendar,
  Fire,
  Hamburger,
  Heart,
  IceCream,
  MapPin,
  CookingPot,
  SealCheck,
  ShareNetwork,
  Star,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchMarketplaceCaterer,
  formatMarketplaceCapacityRange,
  formatMarketplacePriceFromInr,
  postCatererReview,
  postContact,
  type MarketplaceDetail,
} from "@/lib/catering-api";
import { serviceCategoriesQueryOptions } from "@/lib/catalog-queries";
import {
  buildCatererInquiryMessage,
  createCatererInquiryFormSchema,
  createCatererReviewFormSchema,
  formatFullPhone,
} from "@/lib/validation/caterer-forms";
import { zodFieldErrors } from "@/lib/validation/auth-forms";
import { RemoteContentImage } from "@/components/common/RemoteContentImage";
import {
  DEFAULT_SIGNUP_COUNTRY_ISO2,
  PhoneCountryInput,
  dialCodeFromOption,
  findCountryByIso2,
} from "@/components/common/PhoneCountryInput";
import { getCatererCardBadge } from "@/lib/caterer-listing-utils";
import { CatererDetailGallery } from "@/components/caterers/CatererDetailGallery";
import { trans } from "@/i18n";

const nf = new Intl.NumberFormat("en-IN");

type DetailTab = "about" | "menu" | "gallery" | "reviews";

const SPECIALTY_ICONS = [Fire, CookingPot, Hamburger, IceCream] as const;

function locationDisplay(d: MarketplaceDetail, msg: WebsiteMessages["caterers"]["detail"]): string {
  if (d.streetAddress?.trim()) {
    return [d.streetAddress, d.city].filter(Boolean).join(", ");
  }
  return [d.city, d.state, d.country].filter(Boolean).join(", ") || msg.locationOnRequest;
}

function fieldInputClass(hasError: boolean, compact = false): string {
  return [
    compact
      ? "mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-red"
      : "w-full rounded-xl border bg-gray-50 px-4 py-3 outline-none focus:border-brand-red",
    hasError ? "border-red-300" : compact ? "border-gray-100" : "border-gray-100",
  ].join(" ");
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs font-medium text-brand-red" role="alert">
      {message}
    </p>
  );
}

function WriteReviewForm({ slug }: { slug: string }) {
  const { w, trans } = useI18n();
  const msg = w.caterers.detail;
  const qc = useQueryClient();
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorCountryIso, setAuthorCountryIso] = useState(DEFAULT_SIGNUP_COUNTRY_ISO2);
  const [authorPhoneNumber, setAuthorPhoneNumber] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reviewSchema = useMemo(
    () =>
      createCatererReviewFormSchema({
        ...w.contact.validation,
        ...w.auth.validation,
        ...msg.validation,
      }),
    [w.contact.validation, w.auth.validation, msg.validation]
  );

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const authorPhoneCountryCode = dialCodeFromOption(
    findCountryByIso2(authorCountryIso) ?? findCountryByIso2(DEFAULT_SIGNUP_COUNTRY_ISO2)!
  );

  const clearPhoneErrors = () => {
    setErrors((prev) => {
      if (!prev.authorPhoneCountryCode && !prev.authorPhoneNumber) return prev;
      const next = { ...prev };
      delete next.authorPhoneCountryCode;
      delete next.authorPhoneNumber;
      return next;
    });
  };

  const m = useMutation({
    mutationFn: (values: {
      authorName: string;
      authorEmail: string;
      authorPhone: string;
      rating: number;
      title?: string;
      comment: string;
    }) =>
      postCatererReview(slug, {
        authorName: values.authorName,
        authorEmail: values.authorEmail,
        authorPhone: values.authorPhone,
        rating: values.rating,
        title: values.title || undefined,
        comment: values.comment,
      }),
    onSuccess: () => {
      toast.success(msg.reviewPosted);
      setAuthorName("");
      setAuthorEmail("");
      setAuthorCountryIso(DEFAULT_SIGNUP_COUNTRY_ISO2);
      setAuthorPhoneNumber("");
      setTitle("");
      setComment("");
      setRating(5);
      setErrors({});
      void qc.invalidateQueries({ queryKey: ["marketplace", "caterer", slug] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = reviewSchema.safeParse({
      authorName,
      authorEmail,
      authorPhoneCountryCode,
      authorPhoneNumber,
      rating,
      title,
      comment,
    });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    m.mutate({
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail,
      authorPhone: formatFullPhone(parsed.data.authorPhoneCountryCode, parsed.data.authorPhoneNumber),
      rating: parsed.data.rating,
      title: parsed.data.title || undefined,
      comment: parsed.data.comment,
    });
  };

  return (
    <form
      noValidate
      className="mt-8 rounded-2xl border border-gray-100 bg-gray-50/80 p-6"
      onSubmit={onSubmit}
    >
      <h3 className="font-heading text-base font-bold text-brand-dark">{msg.writeReview}</h3>
      <p className="mt-1 text-xs text-gray-500">{msg.writeReviewHint}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
          {msg.yourName}
          <input
            maxLength={120}
            value={authorName}
            onChange={(e) => {
              setAuthorName(e.target.value);
              clearError("authorName");
            }}
            aria-invalid={Boolean(errors.authorName)}
            className={fieldInputClass(Boolean(errors.authorName), true)}
            placeholder={msg.yourNamePlaceholder}
          />
          <FieldError message={errors.authorName} />
        </label>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
          {msg.yourEmail}
          <input
            type="email"
            maxLength={255}
            value={authorEmail}
            onChange={(e) => {
              setAuthorEmail(e.target.value);
              clearError("authorEmail");
            }}
            aria-invalid={Boolean(errors.authorEmail)}
            className={fieldInputClass(Boolean(errors.authorEmail), true)}
            placeholder={msg.yourEmailPlaceholder}
          />
          <FieldError message={errors.authorEmail} />
        </label>
        <div className="block text-xs font-bold uppercase tracking-wider text-gray-500 sm:col-span-2">
          {msg.phone}
          <div className="mt-2 sm:max-w-sm">
            <PhoneCountryInput
              idPrefix="review-phone"
              countryIso={authorCountryIso}
              onCountryIsoChange={(iso) => {
                setAuthorCountryIso(iso);
                clearPhoneErrors();
              }}
              phoneNumber={authorPhoneNumber}
              onPhoneNumberChange={(digits) => {
                setAuthorPhoneNumber(digits);
                clearPhoneErrors();
              }}
              countryCodeAria={trans(msg.countryCodeAria, {
                country: findCountryByIso2(authorCountryIso)?.name ?? "India",
              })}
              phonePlaceholder={msg.phonePlaceholder}
              hasError={Boolean(errors.authorPhoneCountryCode || errors.authorPhoneNumber)}
              variant="white"
            />
            <FieldError message={errors.authorPhoneCountryCode || errors.authorPhoneNumber} />
          </div>
        </div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
          {msg.rating}
          <select
            value={rating}
            onChange={(e) => {
              setRating(Number(e.target.value));
              clearError("rating");
            }}
            aria-invalid={Boolean(errors.rating)}
            className={fieldInputClass(Boolean(errors.rating), true)}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {trans(msg.stars, { n })}
              </option>
            ))}
          </select>
          <FieldError message={errors.rating} />
        </label>
      </div>
      <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-gray-500">
        {msg.shortTitleOptional}
        <input
          maxLength={200}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearError("title");
          }}
          aria-invalid={Boolean(errors.title)}
          className={fieldInputClass(Boolean(errors.title), true)}
        />
        <FieldError message={errors.title} />
      </label>
      <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-gray-500">
        {msg.yourReview}
        <textarea
          maxLength={2000}
          rows={4}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            clearError("comment");
          }}
          aria-invalid={Boolean(errors.comment)}
          className={`${fieldInputClass(Boolean(errors.comment), true)} resize-y`}
        />
        <FieldError message={errors.comment} />
      </label>
      <button
        type="submit"
        disabled={m.isPending}
        className="mt-5 cursor-pointer rounded-2xl bg-brand-red px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {m.isPending ? msg.posting : msg.postReview}
      </button>
    </form>
  );
}

function InquiryForm({ businessName, tenantId }: { businessName: string; tenantId: string }) {
  const { w, trans, locale } = useI18n();
  const msg = w.caterers.detail;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryIso, setCountryIso] = useState(DEFAULT_SIGNUP_COUNTRY_ISO2);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guests, setGuests] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoriesQ = useQuery(serviceCategoriesQueryOptions(locale));
  const categories = categoriesQ.data ?? [];

  const phoneCountryCode = dialCodeFromOption(
    findCountryByIso2(countryIso) ?? findCountryByIso2(DEFAULT_SIGNUP_COUNTRY_ISO2)!
  );

  const inquirySchema = useMemo(
    () =>
      createCatererInquiryFormSchema({
        ...w.contact.validation,
        ...w.auth.validation,
        ...msg.validation,
      }),
    [w.contact.validation, w.auth.validation, msg.validation]
  );

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearPhoneErrors = () => {
    setErrors((prev) => {
      if (!prev.phoneCountryCode && !prev.phoneNumber) return prev;
      const next = { ...prev };
      delete next.phoneCountryCode;
      delete next.phoneNumber;
      return next;
    });
  };

  const m = useMutation({
    mutationFn: (values: {
      name: string;
      email: string;
      phone: string;
      message: string;
    }) =>
      postContact({
        name: values.name,
        email: values.email,
        phone: values.phone,
        subject: `Availability: ${businessName}`.slice(0, 200),
        message: values.message,
        tenantId,
      }),
    onSuccess: () => {
      toast.success(msg.inquirySent);
      setName("");
      setEmail("");
      setCountryIso(DEFAULT_SIGNUP_COUNTRY_ISO2);
      setPhoneNumber("");
      setEventDate("");
      setGuests("");
      setCategoryId("");
      setErrors({});
    },
    onError: (err: Error) => toast.error(err.message || msg.inquirySomethingWrong),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = inquirySchema.safeParse({
      name,
      email,
      phoneCountryCode,
      phoneNumber,
      eventDate,
      guests,
      categoryId,
    });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    const categoryName = categories.find((c) => c.uuid === parsed.data.categoryId)?.name ?? "";
    setErrors({});
    m.mutate({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: formatFullPhone(parsed.data.phoneCountryCode, parsed.data.phoneNumber),
      message: buildCatererInquiryMessage(businessName, {
        eventDate: parsed.data.eventDate,
        guests: parsed.data.guests,
        categoryName,
      }),
    });
  };

  return (
    <aside className="w-full lg:w-96">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:rounded-3xl sm:shadow-2xl lg:sticky lg:top-24">
        <div className="bg-brand-dark p-4 text-center text-white sm:p-6">
          <h3 className="font-heading text-lg font-bold sm:text-xl">{msg.checkAvailability}</h3>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{msg.freeQuoteToday}</p>
        </div>
        <form id="inquiry" noValidate className="space-y-4 p-5 sm:space-y-5 sm:p-8" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              {msg.yourName}
            </span>
            <input
              maxLength={120}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              aria-invalid={Boolean(errors.name)}
              className={fieldInputClass(Boolean(errors.name))}
              placeholder={msg.yourNamePlaceholder}
            />
            <FieldError message={errors.name} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              {msg.yourEmail}
            </span>
            <input
              type="email"
              maxLength={255}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              aria-invalid={Boolean(errors.email)}
              className={fieldInputClass(Boolean(errors.email))}
              placeholder={msg.yourEmailPlaceholder}
            />
            <FieldError message={errors.email} />
          </label>
          <div className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              {msg.phone}
            </span>
            <PhoneCountryInput
              idPrefix="inquiry-phone"
              countryIso={countryIso}
              onCountryIsoChange={(iso) => {
                setCountryIso(iso);
                clearPhoneErrors();
              }}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={(digits) => {
                setPhoneNumber(digits);
                clearPhoneErrors();
              }}
              countryCodeAria={trans(msg.countryCodeAria, {
                country: findCountryByIso2(countryIso)?.name ?? "India",
              })}
              phonePlaceholder={msg.phonePlaceholder}
              hasError={Boolean(errors.phoneCountryCode || errors.phoneNumber)}
              variant="gray"
            />
            <FieldError message={errors.phoneCountryCode || errors.phoneNumber} />
          </div>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              {msg.eventDate}
            </span>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => {
                setEventDate(e.target.value);
                clearError("eventDate");
              }}
              aria-invalid={Boolean(errors.eventDate)}
              className={fieldInputClass(Boolean(errors.eventDate))}
            />
            <FieldError message={errors.eventDate} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              {msg.guestCount}
            </span>
            <select
              value={guests}
              onChange={(e) => {
                setGuests(e.target.value);
                clearError("guests");
              }}
              aria-invalid={Boolean(errors.guests)}
              className={fieldInputClass(Boolean(errors.guests))}
            >
              <option value="">{msg.selectRange}</option>
              <option>{msg.guests150to300}</option>
              <option>{msg.guests300to500}</option>
              <option>{msg.guests500plus}</option>
            </select>
            <FieldError message={errors.guests} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              {msg.category}
            </span>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                clearError("categoryId");
              }}
              disabled={categoriesQ.isPending && categories.length === 0}
              aria-invalid={Boolean(errors.categoryId)}
              className={fieldInputClass(Boolean(errors.categoryId))}
            >
              <option value="">
                {categoriesQ.isPending && categories.length === 0
                  ? msg.loadingCategories
                  : msg.selectCategory}
              </option>
              {categories.map((cat) => (
                <option key={cat.uuid} value={cat.uuid}>
                  {cat.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.categoryId} />
          </label>
          <button
            type="submit"
            disabled={m.isPending}
            className="w-full cursor-pointer rounded-2xl bg-brand-red py-3 text-base font-bold text-white shadow-xl shadow-red-500/30 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-4 sm:text-lg"
          >
            {m.isPending ? msg.inquirySending : msg.sendInquiry}
          </button>
          <p className="text-center text-[10px] text-gray-400">
            {msg.inquiryTermsPrefix}{" "}
            <Link href="/terms" className="underline">
              {msg.terms}
            </Link>{" "}
            {msg.inquiryTermsAnd}{" "}
            <Link href="/privacy" className="underline">
              {msg.privacyPolicy}
            </Link>
          </p>
        </form>
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 p-6">
          <div className="flex -space-x-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-red text-[10px] font-bold text-white">
              A
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-green text-[10px] font-bold text-white">
              M
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-dark text-[10px] font-bold text-white">
              +5
            </span>
          </div>
          <span className="text-[11px] font-bold uppercase text-gray-500">{msg.trustedByClients}</span>
        </div>
      </div>
    </aside>
  );
}

/** Back + Get Quote overlaid on the top of the hero banner. */
function DetailHeroToolbar() {
  const { w } = useI18n();
  const msg = w.caterers.detail;
  return (
    <div className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/caterers"
          className="flex min-w-0 items-center gap-1.5 rounded-lg bg-black/35 px-2.5 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-black/50 sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm"
        >
          <ArrowLeft className="size-4 shrink-0 sm:size-5" aria-hidden />
          <span className="truncate">{msg.backToListing}</span>
        </Link>
        <a
          href="#inquiry"
          className="shrink-0 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-black/25 transition hover:bg-red-700 sm:rounded-md sm:px-5 sm:py-2.5 sm:text-sm"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {msg.getQuote}
        </a>
      </div>
    </div>
  );
}

function ProfileBody({ d, slug }: { d: MarketplaceDetail; slug: string }) {
  const { w, trans } = useI18n();
  const msg = w.caterers.detail;
  const [tab, setTab] = useState<DetailTab>("about");
  const badge = getCatererCardBadge(d);
  const priceLine = formatMarketplacePriceFromInr(d.priceFrom);
  const capacityLine = formatMarketplaceCapacityRange(d.capacityGuestMin, d.capacityGuestMax);
  const specialties = useMemo(() => {
    const fromServices = d.servicesOffered.slice(0, 4);
    if (fromServices.length >= 2) {
      return fromServices.map((name, i) => ({
        name,
        hint: d.keywords[i]?.label ?? msg.popularWithGuests,
        Icon: SPECIALTY_ICONS[i % SPECIALTY_ICONS.length]!,
      }));
    }
    return (d.keywords ?? []).slice(0, 4).map((k, i) => ({
      name: k.label,
      hint: msg.signatureOffering,
      Icon: SPECIALTY_ICONS[i % SPECIALTY_ICONS.length]!,
    }));
  }, [d]);

  const scrollTo = useCallback((id: DetailTab) => {
    setTab(id);
    const el = document.getElementById(`caterer-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "about", label: msg.tabAbout },
    { id: "menu", label: msg.tabMenu },
    { id: "gallery", label: msg.tabGallery },
    { id: "reviews", label: msg.tabReviews },
  ];

  const profileActions = (
    <div className="flex shrink-0 gap-1.5 sm:gap-2">
      <button
        type="button"
        aria-label={msg.shareProfile}
        className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 sm:size-11 sm:rounded-xl"
        onClick={() => {
          const url = window.location.href;
          if (navigator.share) {
            void navigator.share({ title: d.businessName, url });
          } else {
            void navigator.clipboard.writeText(url);
            toast.success(msg.linkCopied);
          }
        }}
      >
        <ShareNetwork className="text-lg sm:text-xl" aria-hidden />
      </button>
      <button
        type="button"
        aria-label={msg.saveFavorites}
        className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 sm:size-11 sm:rounded-xl"
        onClick={() => toast.info(msg.favoritesComingSoon)}
      >
        <Heart className="text-lg sm:text-xl" aria-hidden />
      </button>
    </div>
  );

  return (
    <>
      <section className="bg-gray-50">
        <div className="relative h-36 sm:h-52 md:h-[400px]">
          {d.heroImageUrl ? (
            <RemoteContentImage
              src={d.heroImageUrl}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-dark to-brand-red/50" aria-hidden />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/50" aria-hidden />
          <DetailHeroToolbar />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="-mt-10 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl sm:-mt-14 sm:p-6 md:-mt-24 md:p-8">
            {/* Mobile & tablet: avatar + title row */}
            <div className="flex gap-3 sm:gap-4 md:hidden">
              <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border-[3px] border-white bg-white shadow-lg sm:h-28 sm:w-28 sm:rounded-2xl sm:border-4">
                {d.heroImageUrl ? (
                  <RemoteContentImage
                    src={d.heroImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 72px, 112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-brand-red/10 font-logo text-3xl text-brand-red/40 sm:text-5xl">
                    {d.businessName.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h1 className="font-heading text-lg font-bold leading-snug text-brand-dark sm:text-2xl">
                      {d.businessName}
                    </h1>
                    {badge?.kind === "verified" || badge?.kind === "top-rated" ? (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-green">
                        <SealCheck weight="fill" className="size-3.5" aria-hidden />
                        {badge.kind === "top-rated" ? msg.topRated : msg.verified}
                      </span>
                    ) : null}
                  </div>
                  {profileActions}
                </div>
              </div>
            </div>

            {/* Desktop: horizontal profile card */}
            <div className="hidden items-center gap-8 md:flex">
              <div className="relative -mt-20 h-40 w-40 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl">
                {d.heroImageUrl ? (
                  <RemoteContentImage
                    src={d.heroImageUrl}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-brand-red/10 font-logo text-5xl text-brand-red/40">
                    {d.businessName.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="mb-2 flex flex-row flex-wrap items-center gap-3">
                  <h1 className="font-heading text-3xl font-bold leading-tight text-brand-dark">
                    {d.businessName}
                  </h1>
                  {badge?.kind === "verified" || badge?.kind === "top-rated" ? (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-green">
                      <SealCheck weight="fill" aria-hidden />
                      {badge.kind === "top-rated" ? msg.topRated : msg.verified}
                    </span>
                  ) : null}
                </div>
                {d.tagline ? (
                  <p className="mb-4 text-base font-medium italic text-gray-500">
                    &ldquo;{d.tagline}&rdquo;
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-6 text-sm font-semibold text-gray-600">
                  <span className="flex items-center gap-2">
                    <Star className="text-lg text-brand-yellow" weight="fill" aria-hidden />
                    {d.avgRating.toFixed(1)} ({nf.format(d.reviewCount)} Reviews)
                  </span>
                  <span className="flex max-w-md items-center gap-2">
                    <MapPin className="shrink-0 text-lg text-brand-red" weight="fill" aria-hidden />
                    {locationDisplay(d, msg)}
                  </span>
                  {d.yearsInBusiness != null ? (
                    <span className="flex items-center gap-2">
                      <Calendar className="text-lg text-blue-500" weight="fill" aria-hidden />
                      {trans(msg.yearsExperience, { n: d.yearsInBusiness })}
                    </span>
                  ) : null}
                </div>
              </div>
              {profileActions}
            </div>

            {d.tagline ? (
              <p className="mt-3 text-left text-sm font-medium italic leading-snug text-gray-500 md:hidden">
                &ldquo;{d.tagline}&rdquo;
              </p>
            ) : null}

            <ul className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-xs font-semibold text-gray-600 sm:mt-4 sm:grid-cols-2 sm:gap-3 sm:text-sm md:hidden">
              <li className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <Star className="size-4 shrink-0 text-brand-yellow sm:size-5" weight="fill" aria-hidden />
                <span className="truncate">
                  {d.avgRating.toFixed(1)} · {nf.format(d.reviewCount)} reviews
                </span>
              </li>
              {d.yearsInBusiness != null ? (
                <li className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <Calendar className="size-4 shrink-0 text-blue-500 sm:size-5" weight="fill" aria-hidden />
                  <span className="truncate">{trans(msg.yearsExperienceShort, { n: d.yearsInBusiness })}</span>
                </li>
              ) : null}
              <li className="flex min-w-0 items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 sm:col-span-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-red sm:size-5" weight="fill" aria-hidden />
                <span className="line-clamp-2 leading-snug">{locationDisplay(d, msg)}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 md:pt-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <div className="order-2 flex-1 space-y-8 sm:space-y-12 lg:order-1">
            <div className="no-scrollbar -mx-4 flex overflow-x-auto border-b border-gray-100 px-4 sm:mx-0 sm:px-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => scrollTo(t.id)}
                  className={[
                    "cursor-pointer whitespace-nowrap px-4 py-3 text-sm font-bold transition-colors sm:px-6 sm:py-4",
                    tab === t.id
                      ? "border-b-[3px] border-brand-red text-brand-red"
                      : "text-gray-500 hover:text-brand-red",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <section id="caterer-about">
              <h2 className="mb-6 flex items-center gap-3 font-heading text-2xl font-bold text-brand-dark">
                <span className="h-8 w-1.5 rounded-full bg-brand-red" aria-hidden />
                {msg.aboutTitle}
              </h2>
              <div className="space-y-4 leading-relaxed text-gray-600">
                <p className="whitespace-pre-line">
                  {d.about || trans(msg.aboutPlaceholder, { name: d.businessName })}
                </p>
              </div>
            </section>

            {specialties.length > 0 ? (
              <section id="caterer-menu">
                <h2 className="mb-6 flex items-center gap-3 font-heading text-2xl font-bold text-brand-dark">
                  <span className="h-8 w-1.5 rounded-full bg-brand-green" aria-hidden />
                  {msg.ourSpecialties}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {specialties.map(({ name, hint, Icon }) => (
                    <div
                      key={name}
                      className="flex items-center gap-4 rounded-xl bg-gray-50 p-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                        <Icon className="text-2xl text-brand-red" aria-hidden />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-dark">{name}</h4>
                        <p className="text-xs text-gray-500">{hint}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {(priceLine || capacityLine || d.primaryCategoryName) && (
                  <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="font-heading text-lg font-bold text-brand-dark">Menu &amp; pricing</h3>
                    <dl className="mt-4 space-y-3 text-sm">
                      {d.primaryCategoryName ? (
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">Service focus</dt>
                          <dd className="font-bold text-brand-dark">{d.primaryCategoryName}</dd>
                        </div>
                      ) : null}
                      {priceLine ? (
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">{msg.indicativePrice}</dt>
                          <dd className="font-bold text-brand-dark">{priceLine}</dd>
                        </div>
                      ) : null}
                      {capacityLine ? (
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500">{msg.guestCapacity}</dt>
                          <dd className="font-bold text-brand-dark">{capacityLine}</dd>
                        </div>
                      ) : null}
                    </dl>
                    {(d.cuisines ?? []).length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(d.cuisines ?? []).map((c) => (
                          <span
                            key={c}
                            className="rounded-lg bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            ) : (priceLine || capacityLine || d.primaryCategoryName) ? (
              <section id="caterer-menu">
                <h2 className="mb-6 flex items-center gap-3 font-heading text-2xl font-bold text-brand-dark">
                  <span className="h-8 w-1.5 rounded-full bg-brand-green" aria-hidden />
                  {msg.menuPricingTitle}
                </h2>
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <dl className="space-y-3 text-sm">
                    {d.primaryCategoryName ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">{msg.serviceFocus}</dt>
                        <dd className="font-bold text-brand-dark">{d.primaryCategoryName}</dd>
                      </div>
                    ) : null}
                    {priceLine ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">{msg.indicativePrice}</dt>
                        <dd className="font-bold text-brand-dark">{priceLine}</dd>
                      </div>
                    ) : null}
                    {capacityLine ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-500">{msg.guestCapacity}</dt>
                        <dd className="font-bold text-brand-dark">{capacityLine}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </section>
            ) : null}

            {d.galleryImages.length > 0 ? (
              <section id="caterer-gallery">
                <CatererDetailGallery images={d.galleryImages} businessName={d.businessName} />
              </section>
            ) : null}

            <section id="caterer-reviews">
              <h2 className="mb-6 flex items-center gap-3 font-heading text-2xl font-bold text-brand-dark">
                <span className="h-8 w-1.5 rounded-full bg-brand-yellow" aria-hidden />
                {msg.tabReviews}
              </h2>
              {d.reviews.length === 0 ? (
                <p className="text-sm text-gray-500">{msg.noReviewsYet}</p>
              ) : (
                <ul className="space-y-6">
                  {d.reviews.map((r) => (
                    <li key={r.id} className="border-b border-gray-100 pb-6 last:border-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-brand-dark">{r.authorName}</span>
                        <span className="text-brand-yellow text-sm" aria-hidden>
                          {"★".repeat(r.rating)}
                        </span>
                        <time dateTime={r.createdAt} className="text-xs text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </time>
                      </div>
                      {r.title ? <p className="mt-2 font-semibold text-brand-dark">{r.title}</p> : null}
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
              <WriteReviewForm slug={slug} />
            </section>
          </div>

          <div className="order-1 lg:order-2">
            <InquiryForm businessName={d.businessName} tenantId={d.tenantId} />
          </div>
        </div>
      </main>
    </>
  );
}

export function CatererDetailView() {
  const { w, trans } = useI18n();
  const msg = w.caterers.detail;

  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const q = useQuery({
    queryKey: ["marketplace", "caterer", slug],
    queryFn: () => fetchMarketplaceCaterer(slug),
    enabled: Boolean(slug),
  });

  if (!slug) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center text-gray-600">{msg.invalidProfileLink}</div>
    );
  }

  if (q.isPending) {
    return (
      <div className="min-h-screen bg-white">
        <div className="relative h-36 animate-pulse bg-gray-200 sm:h-52 md:h-[400px]" />
        <div className="mx-auto -mt-10 h-36 max-w-7xl animate-pulse rounded-2xl bg-gray-100 px-4 sm:h-44" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">{msg.profileNotFound}</h1>
        <p className="mt-3 text-gray-500">{msg.profileNotFoundBody}</p>
        <Link
          href="/caterers"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-red px-6 py-3 text-sm font-bold text-white hover:bg-red-700"
        >
          {msg.browseAllCaterers}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ProfileBody d={q.data} slug={slug} />
    </div>
  );
}
