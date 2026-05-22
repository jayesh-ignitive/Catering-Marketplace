import { applyLocaleOverrides } from "./merge-messages";
import { workspaceMessages } from "./workspace.messages";
import type { WorkspaceMessages } from "./workspace.messages";
import { WORKSPACE_HI_OVERRIDES } from "./catalogs/workspace-hi-overrides";
import { WORKSPACE_UI_HI_OVERRIDES } from "./locales/workspace-ui.locale";

export const workspaceMessagesHi: WorkspaceMessages = applyLocaleOverrides(
  applyLocaleOverrides(workspaceMessages, WORKSPACE_HI_OVERRIDES),
  WORKSPACE_UI_HI_OVERRIDES,
);
