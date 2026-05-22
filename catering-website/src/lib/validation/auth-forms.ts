import type { WebsiteMessages } from "@/i18n/website.messages";
import { z } from "zod";

type AuthValidation = WebsiteMessages["auth"]["validation"];

/** +CC — allows "91", "+91", "0091", "00 91"; max 4 digits after + (e.g. +1684). */
export function normalizeDialCode(raw: string): string {
  let t = raw.trim().replace(/\s/g, "");
  if (!t) return t;
  if (t.startsWith("00") && t.length > 2) {
    t = `+${t.slice(2)}`;
  }
  if (/^\d{1,4}$/.test(t)) {
    t = `+${t}`;
  }
  return t;
}

/** National number: digits only. */
export function normalizeNationalPhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function createLoginFormSchema(v: AuthValidation) {
  return z.object({
    email: z.string().trim().min(1, v.enterEmail).email(v.validEmail).max(255, v.emailTooLong),
    password: z.string().min(1, v.enterPassword),
  });
}

export function createRegisterFormSchema(v: AuthValidation) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, v.nameMin2)
        .max(120, v.nameMax120)
        .refine((s) => /\S/.test(s), v.enterFullName),
      email: z
        .string()
        .trim()
        .min(1, v.enterWorkEmail)
        .email(v.validEmail)
        .max(255, v.emailTooLong),
      businessName: z
        .string()
        .trim()
        .min(2, v.businessNameMin2)
        .max(120, v.businessNameTooLong)
        .refine((s) => /\S/.test(s), v.enterBusinessName),
      phoneCountryCode: z
        .string()
        .trim()
        .min(1, v.enterCountryCode)
        .transform(normalizeDialCode)
        .pipe(z.string().regex(/^\+\d{1,4}$/, v.dialCodeFormat)),
      phoneNumber: z
        .string()
        .trim()
        .min(1, v.enterPhone)
        .transform(normalizeNationalPhone)
        .pipe(z.string().min(6, v.phoneMin6).max(14, v.phoneMax14)),
      password: z.string().min(8, v.passwordMin8).max(128, v.passwordMax128),
    });
}

export function createVerifyOtpFormSchema(v: AuthValidation) {
  return z.object({
    email: z.string().trim().min(1, v.enterEmail).email(v.validEmail).max(255, v.emailTooLong),
    code: z.string().trim().regex(/^\d{6}$/, v.enterOtp),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginFormSchema>>;
export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterFormSchema>>;
export type VerifyOtpFormValues = z.infer<ReturnType<typeof createVerifyOtpFormSchema>>;

export function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const flat = err.flatten().fieldErrors;
  const out: Record<string, string> = {};
  for (const key of Object.keys(flat)) {
    const msgs = flat[key as keyof typeof flat];
    if (msgs?.[0]) out[key] = msgs[0];
  }
  return out;
}
