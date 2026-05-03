/**
 * Agent smoke test — public Next.js routes return HTML.
 * Run while dev server is up: npm run ai-smoke
 *
 * Env: SITE_URL (default http://localhost:3000)
 */
const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const PATHS = [
  "/",
  "/caterers",
  "/login",
  "/register",
  "/contact",
  "/privacy",
  "/terms",
];

async function main() {
  console.log(`Public page smoke → ${SITE_URL}\n`);

  for (const path of PATHS) {
    const url = `${SITE_URL}${path}`;
    let res;
    try {
      res = await fetch(url, {
        redirect: "follow",
        headers: { Accept: "text/html" },
      });
    } catch (e) {
      const code = e?.cause?.code ?? e?.code;
      console.error(
        code === "ECONNREFUSED"
          ? `❌ ${path} — nothing listening at ${SITE_URL}. Run: cd catering-website && npm run dev`
          : `❌ ${path} — ${e?.message ?? e}`
      );
      process.exitCode = 1;
      return;
    }
    const ct = res.headers.get("content-type") ?? "";
    const text = await res.text();
    const looksHtml = ct.includes("text/html") && text.length > 200;

    if (!res.ok || !looksHtml) {
      console.error(`❌ ${path} → ${res.status} (${ct}) len=${text.length}`);
      process.exitCode = 1;
      return;
    }
    console.log(`✓ ${path} → ${res.status}`);
  }

  console.log("\nAll public page smoke checks passed.\n");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
