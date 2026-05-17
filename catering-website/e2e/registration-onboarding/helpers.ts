import type { Page } from "@playwright/test";

/** Dev/staging OTP — see catering-backend `.env.example` (REGISTRATION_OTP_CODE / local bypass). */
export const DEV_OTP_CODE = process.env.E2E_OTP_CODE ?? "123456";

export type RegistrationPayload = {
  businessName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export function uniqueRegistrationPayload(
  prefix = "e2e-reg"
): RegistrationPayload {
  const stamp = Date.now();
  const slug = `${prefix}-${stamp}`;
  return {
    businessName: `E2E Catering ${stamp}`,
    fullName: "E2E Test Caterer",
    email: `${slug}@yopmail.com`,
    phoneNumber: "9876543210",
    password: "TestPass123!",
  };
}

export async function fillRegistrationForm(
  page: Page,
  data: RegistrationPayload
): Promise<void> {
  await page.locator("#reg-business").fill(data.businessName);
  await page.locator("#reg-name").fill(data.fullName);
  await page.locator("#reg-phone").fill(data.phoneNumber);
  await page.locator("#reg-email").fill(data.email);
  await page.locator("#reg-password").fill(data.password);
}

export async function submitRegistration(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Continue — verify email next/i }).click();
}

export async function fillOtpCode(page: Page, code = DEV_OTP_CODE): Promise<void> {
  const digits = code.replace(/\D/g, "").padStart(6, "0").slice(0, 6);
  for (let i = 0; i < 6; i++) {
    await page.getByLabel(`Digit ${i + 1} of 6`).fill(digits[i]!);
  }
}

export async function waitForOnboardingWizard(page: Page): Promise<void> {
  await page.waitForURL(/\/workspace\/onboarding/, { timeout: 60_000 });
  await page.getByRole("navigation", { name: "Progress" }).waitFor({ state: "visible" });
  await page.getByRole("heading", {
    name: "Tell us about your catering service",
  }).waitFor({ state: "visible" });
}
