import { applyLocaleOverrides } from "./merge-messages";
import { workspaceMessages } from "./workspace.messages";
import type { WorkspaceMessages } from "./workspace.messages";
import { WORKSPACE_GU_OVERRIDES } from "./catalogs/workspace-gu-overrides";
import { WORKSPACE_UI_GU_OVERRIDES } from "./locales/workspace-ui.locale";

export const workspaceMessagesGu: WorkspaceMessages = applyLocaleOverrides(
  applyLocaleOverrides(workspaceMessages, WORKSPACE_GU_OVERRIDES),
  WORKSPACE_UI_GU_OVERRIDES,
);
