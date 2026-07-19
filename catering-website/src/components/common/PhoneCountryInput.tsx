"use client";

import {
  DEFAULT_SIGNUP_COUNTRY_ISO2,
  PHONE_COUNTRY_OPTIONS,
  dialSelectLabel,
  findCountryByIso2,
  flagEmoji,
} from "@/lib/phone-country-options";

type PhoneCountryInputProps = {
  idPrefix: string;
  countryIso: string;
  onCountryIsoChange: (iso2: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (digits: string) => void;
  countryCodeAria: string;
  phonePlaceholder: string;
  hasError?: boolean;
  /** White inputs on review form; gray on inquiry sidebar */
  variant?: "white" | "gray";
};

export function PhoneCountryInput({
  idPrefix,
  countryIso,
  onCountryIsoChange,
  phoneNumber,
  onPhoneNumberChange,
  countryCodeAria,
  phonePlaceholder,
  hasError = false,
  variant = "gray",
}: PhoneCountryInputProps) {
  const selectedCountry = findCountryByIso2(countryIso) ?? PHONE_COUNTRY_OPTIONS[0]!;
  const shellBg = variant === "white" ? "bg-white" : "bg-gray-50";
  const borderClass = hasError ? "border-red-300" : "border-gray-100";

  return (
    <div
      className={`flex min-w-0 items-stretch overflow-hidden rounded-xl border ${borderClass} ${shellBg}`}
    >
      <div className="flex shrink-0 items-center gap-2 border-r border-gray-200 px-3 py-2.5">
        <span className="text-lg leading-none" title={selectedCountry.name} aria-hidden>
          {flagEmoji(selectedCountry.iso2)}
        </span>
        <div className="relative flex items-center">
          <select
            id={`${idPrefix}-country`}
            aria-label={countryCodeAria}
            value={countryIso}
            onChange={(e) => onCountryIsoChange(e.target.value)}
            className="max-w-[5.5rem] cursor-pointer appearance-none border-0 bg-transparent py-0 pr-4 pl-0 text-sm font-medium tabular-nums text-brand-dark outline-none ring-0 focus:ring-0 sm:max-w-[6.5rem]"
          >
            {PHONE_COUNTRY_OPTIONS.map((c) => (
              <option key={c.iso2} value={c.iso2} title={c.name}>
                {dialSelectLabel(c)}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-gray-400"
            aria-hidden
          >
            ▼
          </span>
        </div>
      </div>
      <input
        id={`${idPrefix}-phone`}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={phonePlaceholder}
        maxLength={14}
        value={phoneNumber}
        onChange={(e) => onPhoneNumberChange(e.target.value.replace(/\D/g, "").slice(0, 14))}
        aria-invalid={hasError}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-brand-dark outline-none ring-0 placeholder:text-gray-400 focus:ring-0"
      />
    </div>
  );
}

export { DEFAULT_SIGNUP_COUNTRY_ISO2, dialCodeFromOption, findCountryByIso2 } from "@/lib/phone-country-options";
