export type PhoneCountryOption = {
  iso2: string;
  name: string;
  /** Numeric dial code without leading + */
  dial: string;
};

/** Regional indicator symbols → flag emoji (e.g. IN → 🇮🇳). */
export function flagEmoji(iso2: string): string {
  const u = iso2.toUpperCase();
  if (u.length !== 2 || !/^[A-Z]{2}$/.test(u)) return "";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + u.charCodeAt(0) - 65, A + u.charCodeAt(1) - 65);
}

/** Dial string for API: +91, +1, +44, … */
export function dialCodeFromOption(opt: PhoneCountryOption): string {
  return `+${opt.dial}`;
}

const POPULAR_FIRST = new Set([
  "IN",
  "US",
  "GB",
  "AE",
  "CA",
  "AU",
  "SG",
  "NZ",
  "IE",
  "ZA",
]);

/** Curated list for signup; dial lengths 1–4 digits (matches backend). */
const RAW: PhoneCountryOption[] = [
  { iso2: "IN", name: "India", dial: "91" },
  { iso2: "US", name: "United States", dial: "1" },
  { iso2: "GB", name: "United Kingdom", dial: "44" },
  { iso2: "AE", name: "United Arab Emirates", dial: "971" },
  { iso2: "CA", name: "Canada", dial: "1" },
  { iso2: "AU", name: "Australia", dial: "61" },
  { iso2: "SG", name: "Singapore", dial: "65" },
  { iso2: "NZ", name: "New Zealand", dial: "64" },
  { iso2: "IE", name: "Ireland", dial: "353" },
  { iso2: "ZA", name: "South Africa", dial: "27" },
  { iso2: "AT", name: "Austria", dial: "43" },
  { iso2: "BE", name: "Belgium", dial: "32" },
  { iso2: "BR", name: "Brazil", dial: "55" },
  { iso2: "BG", name: "Bulgaria", dial: "359" },
  { iso2: "CN", name: "China", dial: "86" },
  { iso2: "HR", name: "Croatia", dial: "385" },
  { iso2: "CY", name: "Cyprus", dial: "357" },
  { iso2: "CZ", name: "Czech Republic", dial: "420" },
  { iso2: "DK", name: "Denmark", dial: "45" },
  { iso2: "EG", name: "Egypt", dial: "20" },
  { iso2: "FI", name: "Finland", dial: "358" },
  { iso2: "FR", name: "France", dial: "33" },
  { iso2: "DE", name: "Germany", dial: "49" },
  { iso2: "GR", name: "Greece", dial: "30" },
  { iso2: "HK", name: "Hong Kong", dial: "852" },
  { iso2: "HU", name: "Hungary", dial: "36" },
  { iso2: "IS", name: "Iceland", dial: "354" },
  { iso2: "ID", name: "Indonesia", dial: "62" },
  { iso2: "IL", name: "Israel", dial: "972" },
  { iso2: "IT", name: "Italy", dial: "39" },
  { iso2: "JP", name: "Japan", dial: "81" },
  { iso2: "KE", name: "Kenya", dial: "254" },
  { iso2: "KW", name: "Kuwait", dial: "965" },
  { iso2: "MY", name: "Malaysia", dial: "60" },
  { iso2: "MX", name: "Mexico", dial: "52" },
  { iso2: "NL", name: "Netherlands", dial: "31" },
  { iso2: "NO", name: "Norway", dial: "47" },
  { iso2: "PH", name: "Philippines", dial: "63" },
  { iso2: "PL", name: "Poland", dial: "48" },
  { iso2: "PT", name: "Portugal", dial: "351" },
  { iso2: "QA", name: "Qatar", dial: "974" },
  { iso2: "RO", name: "Romania", dial: "40" },
  { iso2: "SA", name: "Saudi Arabia", dial: "966" },
  { iso2: "RS", name: "Serbia", dial: "381" },
  { iso2: "SK", name: "Slovakia", dial: "421" },
  { iso2: "SI", name: "Slovenia", dial: "386" },
  { iso2: "KR", name: "South Korea", dial: "82" },
  { iso2: "ES", name: "Spain", dial: "34" },
  { iso2: "SE", name: "Sweden", dial: "46" },
  { iso2: "CH", name: "Switzerland", dial: "41" },
  { iso2: "TW", name: "Taiwan", dial: "886" },
  { iso2: "TH", name: "Thailand", dial: "66" },
  { iso2: "TR", name: "Turkey", dial: "90" },
  { iso2: "UA", name: "Ukraine", dial: "380" },
  { iso2: "VN", name: "Vietnam", dial: "84" },
];

function sortKey(o: PhoneCountryOption): [number, string] {
  const p = POPULAR_FIRST.has(o.iso2) ? 0 : 1;
  return [p, o.name];
}

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [...RAW].sort((a, b) => {
  const [pa, na] = sortKey(a);
  const [pb, nb] = sortKey(b);
  if (pa !== pb) return pa - pb;
  return na.localeCompare(nb);
});

export function findCountryByIso2(iso2: string): PhoneCountryOption | undefined {
  return PHONE_COUNTRY_OPTIONS.find((c) => c.iso2 === iso2.toUpperCase());
}

/**
 * Short label for the country `<select>` (matches compact flag + code UX).
 * Shared dial codes (e.g. +1) include ISO so US vs CA stays clear.
 */
export function dialSelectLabel(
  c: PhoneCountryOption,
  all: PhoneCountryOption[] = PHONE_COUNTRY_OPTIONS,
): string {
  const peers = all.filter((x) => x.dial === c.dial);
  if (peers.length === 1) return `+${c.dial}`;
  return `+${c.dial} ${c.iso2}`;
}

export const DEFAULT_SIGNUP_COUNTRY_ISO2 = "IN";
