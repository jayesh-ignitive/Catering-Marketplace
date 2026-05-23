/**
 * Regenerate workspace hi/gu catalogs from English + phrase translator.
 * Hand-tuned keys in workspace-ui.locale.ts still win (applied last).
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { translateFlatMap } from "../src/i18n/translate-strings.ts";
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

function toTsRecord(name: string, flat: Record<string, string>): string {
  const lines = Object.entries(flat)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  return `export const ${name}: Record<string, string> = {\n${lines.join("\n")}\n};\n`;
}

const dir = join(import.meta.dirname ?? ".", "..", "src", "i18n", "catalogs");
mkdirSync(dir, { recursive: true });
const flat = flatten(workspaceMessages);

writeFileSync(
  join(dir, "workspace-hi-overrides.ts"),
  toTsRecord("WORKSPACE_HI_OVERRIDES", translateFlatMap(flat, "hi")),
);
writeFileSync(
  join(dir, "workspace-gu-overrides.ts"),
  toTsRecord("WORKSPACE_GU_OVERRIDES", translateFlatMap(flat, "gu")),
);

console.log("workspace catalog keys:", Object.keys(flat).length);
