import type { WebsiteMessages } from "@/i18n/website.messages";
import { z } from "zod";

type ContactValidation = WebsiteMessages["contact"]["validation"];

export function createContactFormSchema(v: ContactValidation) {
  return z.object({
    name: z.string().trim().min(2, v.nameMin2).max(120, v.nameMax120),
    email: z
      .string()
      .trim()
      .min(1, v.enterEmail)
      .email(v.validEmail)
      .max(255, v.emailTooLong),
    phone: z.string().trim().max(32, v.phoneTooLong),
    subject: z.string().trim().min(3, v.subjectMin3).max(200, v.subjectMax200),
    message: z.string().trim().min(10, v.messageMin10).max(5000, v.messageMax5000),
  });
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactFormSchema>>;
