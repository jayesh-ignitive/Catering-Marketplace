/**
 * Adds useI18n() to client components that import static message catalogs.
 * Run: node scripts/codemod-use-i18n-fs.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "..", "src");
const skipDirs = new Set(["i18n", "catalogs"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!skipDirs.has(name)) walk(p, out);
    } else if (/\.(tsx|ts)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(root).filter((f) => !f.includes(`${join("lib", "validation")}`));

for (const file of files) {
  let src = readFileSync(file, "utf8");
  if (!src.includes("websiteMessages as w") && !src.includes("workspaceMessages as ws")) continue;
  if (src.includes("useI18n()") || (src.includes("const { w") && src.includes("useI18n"))) continue;

  const usesW = src.includes("websiteMessages as w");
  const usesWs = src.includes("workspaceMessages as ws");

  src = src.replace(
    /import\s*\{([^}]*)\}\s*from\s*["']@\/i18n["'];?\n/g,
    (match, imports) => {
      let imp = imports;
      imp = imp.replace(/\s*websiteMessages\s+as\s+w\s*,?/g, "");
      imp = imp.replace(/\s*workspaceMessages\s+as\s+ws\s*,?/g, "");
      imp = imp.replace(/,\s*,/g, ",").replace(/{\s*,/g, "{").replace(/,\s*}/g, "}");
      const parts = imp
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (src.includes("trans(") && !parts.includes("trans")) parts.unshift("trans");
      const i18nImport = parts.length ? `import { ${parts.join(", ")} } from "@/i18n";\n` : "";
      return `${i18nImport}import { useI18n } from "@/context/LocaleContext";\n`;
    },
  );

  if (!src.includes('"use client"') && !src.includes("'use client'")) {
    src = `"use client";\n\n${src}`;
  }

  const hookLine =
    usesW && usesWs
      ? "  const { w, ws, trans } = useI18n();"
      : usesW
        ? usesWs
          ? ""
          : "  const { w, trans } = useI18n();"
        : "  const { ws, trans } = useI18n();";

  const fnMatch = src.match(/export function (\w+)\([^)]*\)[^{]*\{/);
  if (fnMatch && hookLine) {
    const insertAt = fnMatch.index + fnMatch[0].length;
    if (!src.slice(insertAt, insertAt + 80).includes("useI18n")) {
      src = src.slice(0, insertAt) + `\n${hookLine}\n` + src.slice(insertAt);
    }
  } else {
    const defaultMatch = src.match(/export default function (\w+)\([^)]*\)[^{]*\{/);
    if (defaultMatch && hookLine) {
      const insertAt = defaultMatch.index + defaultMatch[0].length;
      if (!src.slice(insertAt, insertAt + 80).includes("useI18n")) {
        src = src.slice(0, insertAt) + `\n${hookLine}\n` + src.slice(insertAt);
      }
    }
  }

  writeFileSync(file, src);
  console.log("Updated", file);
}
