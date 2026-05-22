import { applyLocaleOverrides } from "./merge-messages";
import { websiteMessages } from "./website.messages";
import type { WebsiteMessages } from "./website.messages";
import { WEBSITE_HI_OVERRIDES } from "./catalogs/website-hi-overrides";
import { HOME_HI_OVERRIDES } from "./locales/home.locale";
import { WEBSITE_UI_HI_OVERRIDES } from "./locales/website-ui.locale";

export const websiteMessagesHi: WebsiteMessages = applyLocaleOverrides(
  applyLocaleOverrides(
    applyLocaleOverrides(websiteMessages, WEBSITE_HI_OVERRIDES),
    HOME_HI_OVERRIDES,
  ),
  WEBSITE_UI_HI_OVERRIDES,
);
