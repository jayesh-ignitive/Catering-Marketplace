/**
 * Flattens message trees and writes override template files.
 * Run: npx tsx scripts/gen-locale-overrides.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { websiteMessages } from "../src/i18n/website.messages.ts";
import { workspaceMessages } from "../src/i18n/workspace.messages.ts";

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

function toTsRecord(name: string, flat: Record<string, string>, comment: string): string {
  const lines = Object.entries(flat)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  return `/** ${comment} — English placeholders; replace with Hindi/Gujarati in catalogs. */\nexport const ${name}: Record<string, string> = {\n${lines.join("\n")}\n};\n`;
}

const root = join(import.meta.dirname ?? ".", "..", "src", "i18n", "catalogs");
mkdirSync(root, { recursive: true });
const wFlat = flatten(websiteMessages);
const wsFlat = flatten(workspaceMessages);

writeFileSync(join(root, "website-hi-overrides.ts"), toTsRecord("WEBSITE_HI_OVERRIDES", wFlat, "Hindi"));
writeFileSync(join(root, "website-gu-overrides.ts"), toTsRecord("WEBSITE_GU_OVERRIDES", wFlat, "Gujarati"));
writeFileSync(join(root, "workspace-hi-overrides.ts"), toTsRecord("WORKSPACE_HI_OVERRIDES", wsFlat, "Hindi"));
writeFileSync(join(root, "workspace-gu-overrides.ts"), toTsRecord("WORKSPACE_GU_OVERRIDES", wsFlat, "Gujarati"));

console.log("website keys:", Object.keys(wFlat).length);
console.log("workspace keys:", Object.keys(wsFlat).length);
