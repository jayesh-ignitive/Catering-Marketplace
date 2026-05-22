import type { AppLocale } from "./locale";
import { websiteMessages } from "./website.messages";
import type { WebsiteMessages } from "./website.messages";
import { websiteMessagesGu } from "./website.messages.gu";
import { websiteMessagesHi } from "./website.messages.hi";
import { workspaceMessages } from "./workspace.messages";
import type { WorkspaceMessages } from "./workspace.messages";
import { workspaceMessagesGu } from "./workspace.messages.gu";
import { workspaceMessagesHi } from "./workspace.messages.hi";

const websiteByLocale: Record<AppLocale, WebsiteMessages> = {
  en: websiteMessages,
  hi: websiteMessagesHi,
  gu: websiteMessagesGu,
};

const workspaceByLocale: Record<AppLocale, WorkspaceMessages> = {
  en: workspaceMessages,
  hi: workspaceMessagesHi,
  gu: workspaceMessagesGu,
};

export function getWebsiteMessages(locale: AppLocale): WebsiteMessages {
  return websiteByLocale[locale] ?? websiteMessages;
}

export function getWorkspaceMessages(locale: AppLocale): WorkspaceMessages {
  return workspaceByLocale[locale] ?? workspaceMessages;
}
