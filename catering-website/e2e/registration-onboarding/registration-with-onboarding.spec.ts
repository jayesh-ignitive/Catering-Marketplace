import { expect, test } from "@playwright/test";
import {
  fillOtpCode,
  fillRegistrationForm,
  submitRegistration,
  uniqueRegistrationPayload,
  waitForOnboardingWizard,
} from "./helpers";

test.describe("Registration with onboarding", () => {
  test("register page shows partner onboarding shell", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Tell us about your business" })
    ).toBeVisible();
    await expect(page.locator("#reg-business")).toBeVisible();
    await expect(page.locator("#reg-email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue — verify email next/i })
    ).toBeVisible();
  });

  test("validation blocks empty submit on register", async ({ page }) => {
    await page.goto("/register");
    await submitRegistration(page);
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator("#reg-business-error")).toBeVisible();
  });

  test("creates account, verifies OTP, and opens workspace onboarding wizard", async ({
    page,
  }) => {
    const payload = uniqueRegistrationPayload();

    await page.goto("/register");
    await fillRegistrationForm(page, payload);
    await submitRegistration(page);

    await page.waitForURL(/\/verify-otp/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Verification" })).toBeVisible();
    await expect(page.locator("#otp-email")).toHaveValue(payload.email);

    await fillOtpCode(page);
    await waitForOnboardingWizard(page);

    await expect(page.getByText("Business info", { exact: true })).toBeVisible();
    await expect(page.getByText("Grow your catering business with us")).toBeVisible();
    await expect(page.locator("#ws-about")).toBeVisible();
    await expect(page.getByRole("button", { name: "Next step" })).toBeVisible();
  });
});
