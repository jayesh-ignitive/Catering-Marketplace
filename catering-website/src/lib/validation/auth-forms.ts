import { z } from "zod";

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

/** Matches backend LoginDto expectations. */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address")
    .email("Enter a valid email address")
    .max(255, "Email is too long"),
  password: z.string().min(1, "Enter your password"),
});

/** Matches backend RegisterDto. */
export const registerFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must be at most 120 characters")
      .refine((s) => /\S/.test(s), "Enter your full name"),
    email: z
      .string()
      .trim()
      .min(1, "Enter your work email")
      .email("Enter a valid email address")
      .max(255, "Email is too long"),
    businessName: z
      .string()
      .trim()
      .min(2, "Business name must be at least 2 characters")
      .max(120, "Business name is too long")
      .refine((s) => /\S/.test(s), "Enter your business name"),
    phoneCountryCode: z
      .string()
      .trim()
      .min(1, "Enter your country code")
      .transform(normalizeDialCode)
      .pipe(
        z
          .string()
          .regex(/^\+\d{1,4}$/, "Use 1–4 digits after + (e.g. +1, +91, +44). You can type 91 without +.")
      ),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Enter your phone number")
      .transform(normalizeNationalPhone)
      .pipe(
        z
          .string()
          .min(6, "Enter at least 6 digits for the local number")
          .max(14, "That number is too long (max 14 digits)")
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
  });

export const verifyOtpFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address")
    .email("Enter a valid email address")
    .max(255, "Email is too long"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type VerifyOtpFormValues = z.infer<typeof verifyOtpFormSchema>;

export function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const flat = err.flatten().fieldErrors;
  const out: Record<string, string> = {};
  for (const key of Object.keys(flat)) {
    const msgs = flat[key as keyof typeof flat];
    if (msgs?.[0]) out[key] = msgs[0];
  }
  return out;
}
