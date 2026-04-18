import { z } from "zod";

/** Matches backend CreateStaffDto. */
export const createStaffFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be at most 120 characters")
    .refine((s) => /\S/.test(s), "Enter the staff member's full name"),
  email: z
    .string()
    .trim()
    .min(1, "Enter an email address")
    .email("Enter a valid email address")
    .max(255, "Email is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

/** Matches backend UpdateStaffDto; empty password means leave unchanged. */
export const editStaffFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must be at most 120 characters")
      .refine((s) => /\S/.test(s), "Enter the staff member's full name"),
    email: z
      .string()
      .trim()
      .min(1, "Enter an email address")
      .email("Enter a valid email address")
      .max(255, "Email is too long"),
    password: z.string().max(128, "Password is too long"),
  })
  .refine((d) => d.password.length === 0 || d.password.length >= 8, {
    message: "Password must be at least 8 characters",
    path: ["password"],
  });

export type CreateStaffFormValues = z.infer<typeof createStaffFormSchema>;
export type EditStaffFormValues = z.infer<typeof editStaffFormSchema>;
