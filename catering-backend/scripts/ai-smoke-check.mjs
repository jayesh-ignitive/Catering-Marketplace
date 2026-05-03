/**
 * Agent/CI smoke test — no database writes, no auth.
 * Run while API is up: npm run ai-smoke
 *
 * Env: API_BASE (default http://localhost:4000)
 */
const API_BASE = (process.env.API_BASE ?? "http://localhost:4000").replace(/\/$/, "");

async function fetchJson(path) {
  const url = `${API_BASE}${path}`;
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    const code = e?.cause?.code ?? e?.code;
    const hint =
      code === "ECONNREFUSED"
        ? `Nothing listening at ${API_BASE}. Start the API: cd catering-backend && npm run start:dev`
        : String(e?.message ?? e);
    return { url, ok: false, status: 0, json: null, preview: "", fetchError: hint };
  }
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { url, ok: res.ok, status: res.status, json, preview: text.slice(0, 160), fetchError: null };
}

function fail(msg, detail) {
  console.error(`\n❌ ${msg}`);
  if (detail != null) console.error(detail);
  process.exitCode = 1;
}

async function main() {
  console.log(`API smoke checks → ${API_BASE}\n`);

  const h = await fetchJson("/api/health");
  if (h.fetchError) {
    fail("Cannot reach API", h.fetchError);
    return;
  }
  if (!h.ok || h.json?.ok !== true || h.json?.service !== "catering-backend") {
    fail("Health check failed", { url: h.url, status: h.status, body: h.preview });
    return;
  }
  console.log(`✓ GET /api/health → ${h.status}`);

  const cities = await fetchJson("/api/marketplace/cities");
  if (!cities.ok || !Array.isArray(cities.json)) {
    fail("Marketplace cities failed (need DB + migrations)", {
      url: cities.url,
      status: cities.status,
      body: cities.preview,
    });
    return;
  }
  console.log(`✓ GET /api/marketplace/cities → ${cities.status} (${cities.json.length} rows)`);

  const listings = await fetchJson("/api/marketplace/caterers?page=1&limit=5");
  if (!listings.ok || !listings.json || !Array.isArray(listings.json.items)) {
    fail("Marketplace caterers list failed", {
      url: listings.url,
      status: listings.status,
      body: listings.preview,
    });
    return;
  }
  console.log(`✓ GET /api/marketplace/caterers → ${listings.status} (total=${listings.json.total})`);

  const offerings = await fetchJson("/api/marketplace/service-offerings");
  if (!offerings.ok || !Array.isArray(offerings.json)) {
    fail("Service offerings failed", { url: offerings.url, status: offerings.status, body: offerings.preview });
    return;
  }
  console.log(`✓ GET /api/marketplace/service-offerings → ${offerings.status} (${offerings.json.length} rows)`);

  console.log("\nAll API smoke checks passed.\n");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
