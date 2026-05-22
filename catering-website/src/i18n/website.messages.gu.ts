import { applyLocaleOverrides } from "./merge-messages";
import { websiteMessages } from "./website.messages";
import type { WebsiteMessages } from "./website.messages";
import { WEBSITE_GU_OVERRIDES } from "./catalogs/website-gu-overrides";
import { HOME_GU_OVERRIDES } from "./locales/home.locale";
import { WEBSITE_UI_GU_OVERRIDES } from "./locales/website-ui.locale";

export const websiteMessagesGu: WebsiteMessages = applyLocaleOverrides(
  applyLocaleOverrides(
    applyLocaleOverrides(websiteMessages, WEBSITE_GU_OVERRIDES),
    HOME_GU_OVERRIDES,
  ),
  WEBSITE_UI_GU_OVERRIDES,
);
