/**
 * Build hi/gu override catalogs from English message trees.
 * Run: npx tsx scripts/build-locale-messages.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { applyLocaleOverrides } from "../src/i18n/merge-messages.ts";
import { translateFlatMap } from "../src/i18n/translate-strings.ts";
import { websiteMessages } from "../src/i18n/website.messages.ts";
import type { WebsiteMessages } from "../src/i18n/website.messages.ts";
import { workspaceMessages } from "../src/i18n/workspace.messages.ts";
import type { WorkspaceMessages } from "../src/i18n/workspace.messages.ts";

function flatten(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof obj === "string") {
    out[prefix] = obj;
    return out;
  }
  if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      Object.assign(out, flatten(value, path));
    }
  }
  return out;
}

function toTsRecordExport(name: string, flat: Record<string, string>): string {
  const lines = Object.entries(flat)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  return `export const ${name}: Record<string, string> = {\n${lines.join("\n")}\n};\n`;
}

const catalogsDir = join(import.meta.dirname ?? ".", "..", "src", "i18n", "catalogs");
mkdirSync(catalogsDir, { recursive: true });

const wFlat = flatten(websiteMessages);
const wsFlat = flatten(workspaceMessages);

const WEBSITE_HI = translateFlatMap(wFlat, "hi");
const WEBSITE_GU = translateFlatMap(wFlat, "gu");
const WORKSPACE_HI = translateFlatMap(wsFlat, "hi");
const WORKSPACE_GU = translateFlatMap(wsFlat, "gu");

writeFileSync(join(catalogsDir, "website-hi-overrides.ts"), toTsRecordExport("WEBSITE_HI_OVERRIDES", WEBSITE_HI));
writeFileSync(join(catalogsDir, "website-gu-overrides.ts"), toTsRecordExport("WEBSITE_GU_OVERRIDES", WEBSITE_GU));
writeFileSync(join(catalogsDir, "workspace-hi-overrides.ts"), toTsRecordExport("WORKSPACE_HI_OVERRIDES", WORKSPACE_HI));
writeFileSync(join(catalogsDir, "workspace-gu-overrides.ts"), toTsRecordExport("WORKSPACE_GU_OVERRIDES", WORKSPACE_GU));

writeFileSync(
  join(import.meta.dirname ?? ".", "..", "src", "i18n", "website.messages.hi.ts"),
  `import { applyLocaleOverrides } from "./merge-messages";
import { websiteMessages } from "./website.messages";
import type { WebsiteMessages } from "./website.messages";
import { WEBSITE_HI_OVERRIDES } from "./catalogs/website-hi-overrides";

export const websiteMessagesHi: WebsiteMessages = applyLocaleOverrides(
  websiteMessages,
  WEBSITE_HI_OVERRIDES,
);
`,
);

writeFileSync(
  join(import.meta.dirname ?? ".", "..", "src", "i18n", "website.messages.gu.ts"),
  `import { applyLocaleOverrides } from "./merge-messages";
import { websiteMessages } from "./website.messages";
import type { WebsiteMessages } from "./website.messages";
import { WEBSITE_GU_OVERRIDES } from "./catalogs/website-gu-overrides";

export const websiteMessagesGu: WebsiteMessages = applyLocaleOverrides(
  websiteMessages,
  WEBSITE_GU_OVERRIDES,
);
`,
);

writeFileSync(
  join(import.meta.dirname ?? ".", "..", "src", "i18n", "workspace.messages.hi.ts"),
  `import { applyLocaleOverrides } from "./merge-messages";
import { workspaceMessages } from "./workspace.messages";
import type { WorkspaceMessages } from "./workspace.messages";
import { WORKSPACE_HI_OVERRIDES } from "./catalogs/workspace-hi-overrides";

export const workspaceMessagesHi: WorkspaceMessages = applyLocaleOverrides(
  workspaceMessages,
  WORKSPACE_HI_OVERRIDES,
);
`,
);

writeFileSync(
  join(import.meta.dirname ?? ".", "..", "src", "i18n", "workspace.messages.gu.ts"),
  `import { applyLocaleOverrides } from "./merge-messages";
import { workspaceMessages } from "./workspace.messages";
import type { WorkspaceMessages } from "./workspace.messages";
import { WORKSPACE_GU_OVERRIDES } from "./catalogs/workspace-gu-overrides";

export const workspaceMessagesGu: WorkspaceMessages = applyLocaleOverrides(
  workspaceMessages,
  WORKSPACE_GU_OVERRIDES,
);
`,
);

console.log("Built locale catalogs:", {
  website: Object.keys(WEBSITE_HI).length,
  workspace: Object.keys(WORKSPACE_HI).length,
});
