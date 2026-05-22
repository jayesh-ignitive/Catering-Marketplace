import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "..", "src");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== "i18n" && name !== "catalogs") walk(p, out);
    } else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

for (const file of walk(root)) {
  let src = readFileSync(file, "utf8");
  if (!src.includes("websiteMessages as w") && !src.includes("workspaceMessages as ws")) continue;

  const needsTrans = src.includes("trans(");
  src = src.replace(
    /import\s*\{[^}]*\}\s*from\s*["']@\/i18n["'];?\r?\n/g,
    needsTrans ? 'import { trans } from "@/i18n";\r\n' : "",
  );

  if (!src.includes('from "@/context/LocaleContext"')) {
    const firstImport = src.match(/^("use client";\r?\n\r?\n)?import /m);
    const insertAt = firstImport ? firstImport.index + (firstImport[1]?.length ?? 0) : 0;
    src =
      src.slice(0, insertAt) +
      'import { useI18n } from "@/context/LocaleContext";\r\n' +
      src.slice(insertAt);
  }

  if (!src.includes('"use client"') && src.includes("useI18n()")) {
    src = `"use client";\r\n\r\n${src}`;
  }

  writeFileSync(file, src);
  console.log("Fixed", file);
}
