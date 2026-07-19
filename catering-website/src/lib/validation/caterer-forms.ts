import type { WebsiteMessages } from "@/i18n/website.messages";
import { normalizeDialCode, normalizeNationalPhone } from "@/lib/validation/auth-forms";
import { z } from "zod";

type ContactValidation = WebsiteMessages["contact"]["validation"];
type AuthValidation = WebsiteMessages["auth"]["validation"];
type DetailValidation = WebsiteMessages["caterers"]["detail"]["validation"];

function phoneCountryCodeField(v: AuthValidation) {
  return z
    .string()
    .trim()
    .min(1, v.enterCountryCode)
    .transform(normalizeDialCode)
    .pipe(z.string().regex(/^\+\d{1,4}$/, v.dialCodeFormat));
}

function phoneNumberField(v: AuthValidation) {
  return z
    .string()
    .trim()
    .min(1, v.enterPhone)
    .transform(normalizeNationalPhone)
    .pipe(z.string().min(6, v.phoneMin6).max(14, v.phoneMax14));
}

export function formatFullPhone(countryCode: string, nationalNumber: string): string {
  return `${countryCode} ${nationalNumber}`;
}

function parseLocalDate(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfTodayLocal(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function createCatererReviewFormSchema(v: ContactValidation & AuthValidation & DetailValidation) {
  return z.object({
    authorName: z.string().trim().min(2, v.nameMin2).max(120, v.nameMax120),
    authorEmail: z
      .string()
      .trim()
      .min(1, v.enterEmail)
      .email(v.validEmail)
      .max(255, v.emailTooLong),
    authorPhoneCountryCode: phoneCountryCodeField(v),
    authorPhoneNumber: phoneNumberField(v),
    rating: z.coerce.number().int().min(1, v.ratingRequired).max(5, v.ratingRequired),
    title: z.string().trim().max(200, v.titleMax200),
    comment: z.string().trim().min(10, v.commentMin10).max(2000, v.commentMax2000),
  });
}

export type CatererReviewFormValues = z.infer<ReturnType<typeof createCatererReviewFormSchema>>;

export function createCatererInquiryFormSchema(v: ContactValidation & AuthValidation & DetailValidation) {
  return z.object({
    name: z.string().trim().min(2, v.nameMin2).max(120, v.nameMax120),
    email: z
      .string()
      .trim()
      .min(1, v.enterEmail)
      .email(v.validEmail)
      .max(255, v.emailTooLong),
    phoneCountryCode: phoneCountryCodeField(v),
    phoneNumber: phoneNumberField(v),
    eventDate: z
      .string()
      .trim()
      .superRefine((value, ctx) => {
        if (!value) return;
        const d = parseLocalDate(value);
        if (!d) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.eventDateInvalid });
          return;
        }
        if (d < startOfTodayLocal()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.eventDatePast });
        }
      }),
    guests: z.string().trim(),
    categoryId: z.string().trim(),
  });
}

export type CatererInquiryFormValues = z.infer<ReturnType<typeof createCatererInquiryFormSchema>>;

export function buildCatererInquiryMessage(
  businessName: string,
  values: { eventDate: string; guests: string; categoryName: string }
): string {
  return [
    `Caterer: ${businessName}`,
    `Event date: ${values.eventDate || "—"}`,
    `Category: ${values.categoryName || "—"}`,
    `Guests: ${values.guests || "—"}`,
  ].join("\n");
}

export type ParsedCatererInquiryMessage = {
  eventDate: string | null;
  category: string | null;
  guests: string | null;
  notes: string | null;
};

/** Extract structured lines from availability inquiry messages. */
export function parseCatererInquiryMessage(message: string): ParsedCatererInquiryMessage {
  const lines = message.split(/\r?\n/);
  let eventDate: string | null = null;
  let category: string | null = null;
  let guests: string | null = null;
  const noteLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("Caterer:")) continue;
    if (trimmed.startsWith("Event date:")) {
      const v = trimmed.slice("Event date:".length).trim();
      eventDate = v && v !== "—" ? v : null;
      continue;
    }
    if (trimmed.startsWith("Category:")) {
      const v = trimmed.slice("Category:".length).trim();
      category = v && v !== "—" ? v : null;
      continue;
    }
    if (trimmed.startsWith("Guests:")) {
      const v = trimmed.slice("Guests:".length).trim();
      guests = v && v !== "—" ? v : null;
      continue;
    }
    noteLines.push(trimmed);
  }

  return {
    eventDate,
    category,
    guests,
    notes: noteLines.length ? noteLines.join("\n") : null,
  };
}
