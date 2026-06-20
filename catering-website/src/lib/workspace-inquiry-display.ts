import { parseCatererInquiryMessage } from "@/lib/validation/caterer-forms";
import { dateLocaleFor } from "@/i18n/format";
import type { AppLocale } from "@/i18n/locale";

export function isGenericAvailabilitySubject(subject: string): boolean {
  return subject.trim().toLowerCase().startsWith("availability:");
}

/** Caterer workspace — hide redundant "Availability: {business}" subject lines. */
export function inquiryDisplayTitle(
  name: string,
  subject: string,
  fallback = "Customer enquiry",
): string {
  const trimmedName = name.trim();
  if (trimmedName) return trimmedName;
  if (!isGenericAvailabilitySubject(subject)) return subject.trim();
  return fallback;
}

export function inquiryReplySubject(
  name: string,
  subject: string,
  labels?: { from?: string; generic?: string },
): string {
  if (!isGenericAvailabilitySubject(subject)) return subject.trim();
  const trimmedName = name.trim();
  const fromTemplate = labels?.from ?? "Re: Enquiry from {name}";
  const generic = labels?.generic ?? "Re: Your catering enquiry";
  if (trimmedName) {
    return fromTemplate.replace("{name}", trimmedName);
  }
  return generic;
}

export function inquiryCustomerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export type InquiryEventMeta = {
  eventDate: string | null;
  category: string | null;
  guests: string | null;
};

export function inquiryEventMetaFromMessage(message: string): InquiryEventMeta {
  const parsed = parseCatererInquiryMessage(message);
  return {
    eventDate: parsed.eventDate,
    category: parsed.category,
    guests: parsed.guests,
  };
}

export function formatInquiryWhen(iso: string, locale?: AppLocale): string {
  return new Date(iso).toLocaleString(locale ? dateLocaleFor(locale) : undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatInquiryWhenLong(iso: string, locale?: AppLocale): string {
  return new Date(iso).toLocaleString(locale ? dateLocaleFor(locale) : undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function formatInquiryWhenShort(iso: string, locale?: AppLocale): string {
  return new Date(iso).toLocaleString(locale ? dateLocaleFor(locale) : undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Compact event date for list chips. */
export function formatInquiryEventDateShort(value: string, locale?: AppLocale): string {
  const t = value.trim();
  if (!t || t === "—") return t;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(`${t}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(locale ? dateLocaleFor(locale) : undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return t;
}

/** Human-readable event date from form value (ISO or free text). */
export function formatInquiryEventDate(value: string, locale?: AppLocale): string {
  const t = value.trim();
  if (!t || t === "—") return t;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(`${t}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(locale ? dateLocaleFor(locale) : undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }
  return t;
}

/** Guest count with sensible suffix. */
export function formatInquiryGuests(
  value: string,
  guestsLabel?: (count: number) => string,
): string {
  const t = value.trim();
  if (!t || t === "—") return t;
  if (/guest/i.test(t)) return t;
  const n = Number(t.replace(/,/g, ""));
  if (Number.isFinite(n) && n > 0) {
    return guestsLabel ? guestsLabel(n) : `${n.toLocaleString()} guests`;
  }
  return t;
}
