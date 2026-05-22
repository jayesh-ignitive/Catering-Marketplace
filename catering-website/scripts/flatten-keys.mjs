import { readFileSync, writeFileSync } from "fs";

function parseMessages(file) {
  const src = readFileSync(file, "utf8");
  const start = src.indexOf("= {");
  const end = src.lastIndexOf("} as const");
  const objStr = src.slice(start + 2, end + 1);
  return new Function("return " + objStr)();
}

function flatten(obj, prefix = "") {
  const keys = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") keys[p] = v;
    else Object.assign(keys, flatten(v, p));
  }
  return keys;
}

const website = parseMessages("src/i18n/website.messages.ts");
const workspace = parseMessages("src/i18n/workspace.messages.ts");
const wk = flatten(website);
const ws = flatten(workspace);
console.log("website keys:", Object.keys(wk).length);
console.log("workspace keys:", Object.keys(ws).length);
writeFileSync("tmp-keys.json", JSON.stringify({ website: wk, workspace: ws }, null, 2));
