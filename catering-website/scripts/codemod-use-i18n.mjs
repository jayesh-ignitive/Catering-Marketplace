/**
 * Adds useI18n() to client components that import static message catalogs.
 * Run: node scripts/codemod-use-i18n.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { globSync } from "glob";
import { join } from "path";

const root = join(import.meta.dirname, "..", "src");
const skip = new Set([
  "i18n",
  "context/LocaleContext.tsx",
  "lib/validation",
]);

const files = globSync("**/*.{tsx,ts}", { cwd: root, absolute: true }).filter((f) => {
  const rel = f.replace(root + "\\", "").replace(root + "/", "");
  return !skip.has(rel.split(/[/\\]/)[0]) && !rel.includes("i18n/") && !rel.includes("catalogs/");
});

for (const file of files) {
  let src = readFileSync(file, "utf8");
  if (!src.includes("websiteMessages as w") && !src.includes("workspaceMessages as ws")) continue;
  if (src.includes("useI18n()") || src.includes("const { w") && src.includes("useI18n")) continue;

  const usesW = src.includes("websiteMessages as w");
  const usesWs = src.includes("workspaceMessages as ws");

  src = src.replace(
    /import\s*\{([^}]*)\}\s*from\s*["']@\/i18n["'];?\n/g,
    (match, imports) => {
      let imp = imports;
      imp = imp.replace(/\s*websiteMessages\s+as\s+w\s*,?/g, "");
      imp = imp.replace(/\s*workspaceMessages\s+as\s+ws\s*,?/g, "");
      imp = imp.replace(/,\s*,/g, ",").replace(/{\s*,/g, "{").replace(/,\s*}/g, "}");
      const parts = imp.split(",").map((s) => s.trim()).filter(Boolean);
      if (!parts.includes("useI18n")) parts.push("useI18n");
      if (!parts.includes("trans") && src.includes("trans(")) parts.unshift("trans");
      return `import { ${parts.join(", ")} } from "@/i18n";\nimport { useI18n } from "@/context/LocaleContext";\n`;
    },
  );

  if (!src.includes('"use client"') && !src.includes("'use client'")) {
    src = `"use client";\n\n${src}`;
  }

  const hookLine = usesW && usesWs ? "  const { w, ws, trans } = useI18n();" : usesW ? "  const { w, trans } = useI18n();" : "  const { ws, trans } = useI18n();";

  const fnMatch = src.match(/export function (\w+)\([^)]*\)[^{]*\{/);
  if (fnMatch) {
    const insertAt = fnMatch.index + fnMatch[0].length;
    if (!src.slice(insertAt, insertAt + 80).includes("useI18n")) {
      src = src.slice(0, insertAt) + `\n${hookLine}\n` + src.slice(insertAt);
    }
  } else {
    const defaultMatch = src.match(/export default function (\w+)\([^)]*\)[^{]*\{/);
    if (defaultMatch) {
      const insertAt = defaultMatch.index + defaultMatch[0].length;
      if (!src.slice(insertAt, insertAt + 80).includes("useI18n")) {
        src = src.slice(0, insertAt) + `\n${hookLine}\n` + src.slice(insertAt);
      }
    }
  }

  writeFileSync(file, src);
  console.log("Updated", file);
}
