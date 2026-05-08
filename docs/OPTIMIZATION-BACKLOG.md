# Catering platform — optimization backlog

This document captures performance, scalability, reliability, and operational optimizations suggested for the **catering-website** (Next.js 16) and **catering-backend** (NestJS 11, TypeORM, MySQL, multi-tenant DBs). Use it as a working backlog; reorder by your release goals.

## How to read this

| Priority | Meaning |
|----------|---------|
| **P0** | Material risk (security, outages, data) or large perceived latency on core flows |
| **P1** | Clear win with moderate effort; improves cost or UX at scale |
| **P2** | Nice-to-have polish, developer experience, or future-proofing |

Each item notes **impact** (what improves) and **effort** (roughly: S = days, M = up to ~2 weeks, L = longer).

---

## 1. Frontend (`catering-website`)

| ID | Item | Priority | Impact | Effort |
|----|------|----------|--------|--------|
| F1 | **HTTP caching for public API reads** — `catering-api.ts` uses `cache: "no-store"` for fetches. Public catalog and marketplace list/detail responses that rarely need instant freshness should use `next/cache` (`revalidate`, `tags`) or route-level `revalidate` so pages can be static/ISR where appropriate. | P1 | Lower origin load, faster TTFB, better CDN use | M |
| F2 | **`next/image` coverage** — Ensure hero/gallery URLs from R2 or other hosts are listed in `next.config.ts` `images.remotePatterns` (currently includes Unsplash/ui-avatars only). Missing patterns force unoptimized `<img>` or build/runtime issues. | P1 | LCP, bandwidth, layout stability | S |
| F3 | **Bundle size** — Audit heavy client deps (`leaflet`/`react-leaflet` is already dynamically imported on profile pages — keep that pattern). Review `@phosphor-icons/react` vs tree-shaken imports; avoid importing entire icon packs on critical paths. | P2 | Faster JS parse on mobile | S–M |
| F4 | **React Query defaults** — Tune `staleTime`/`gcTime` for workspace vs public routes so authenticated screens refetch appropriately without hammering the API. | P2 | Fewer duplicate requests | S |
| F5 | **Production server entry** — `server.js` custom server loads dotenv correctly; ensure production (`start:server`) documents alignment with `next build` env for `NEXT_PUBLIC_*`. Consider documenting one canonical way to run prod (PM2 vs platform). | P2 | Fewer misconfig incidents | S |

---

## 2. Backend API (`catering-backend`)

| ID | Item | Priority | Impact | Effort |
|----|------|----------|--------|--------|
| B1 | **Response compression** — Enable gzip/br compression (e.g. compression middleware or reverse proxy) for JSON-heavy marketplace responses. | P1 | Bandwidth, mobile latency | S |
| B2 | **Rate limiting** — Add limits on login, OTP/resend, contact form, upload, and marketplace search to reduce abuse and accidental overload. (`@nestjs/throttler` or edge/WAF). | P0 | Security, stability | M |
| B3 | **Security headers** — Add Helmet or equivalent + consistent `Trust Proxy` if behind nginx/load balancer. | P1 | Hardening | S |
| B4 | **Marketplace list query shape** — `listPublished` builds a large query with many `leftJoinAndSelect`s for categories, cuisines, keywords, etc. Consider a **card projection** (fewer columns/joins) for list endpoints and reserve full graph for detail view; optionally split keyword/category enrichment. | P1 | DB CPU, memory, query time at scale | M–L |
| B5 | **Duplicate count + row queries** — Listing runs separate count and data queries (appropriate), but ensure filters stay index-aligned and avoid redundant work (shared filter builder, explain analyze in staging). | P1 | Predictable latency | M |
| B6 | **Process scaling** — PM2 config uses `instances: 1`, `exec_mode: fork`. For CPU-bound traffic, evaluate cluster mode or horizontal replicas behind a load balancer (stateless JWT helps). | P2 | Throughput | M |
| B7 | **Global validation pipe** — Already strict (`whitelist`, `forbidNonWhitelisted`). Keep DTOs aligned with max lengths to bound payload sizes on writes. | — | Maintenance | S |

---

## 3. Database & multi-tenant

| ID | Item | Priority | Impact | Effort |
|----|------|----------|--------|--------|
| D1 | **Indexes for marketplace filters** — Verify composite/partial indexes match filters: `published`, city joins, `price_band`, keyword slug EXISTS paths, text search if used. Run `EXPLAIN` on production-like data volumes. | P0 | List/search latency | M |
| D2 | **Tenant `DataSource` cache** — `TenantConnectionService` caches `DataSource` per tenant indefinitely. Under many tenants, add **LRU + max size**, idle teardown, or external pool strategy to cap connections and memory. | P1 | Connection exhaustion, memory | M |
| D3 | **Connection pool tuning** — TypeORM/MySQL pool limits per process × replicas × tenant DS instances can multiply quickly; document and cap `extra` pool settings for main and tenant DBs. | P1 | Stability under load | M |
| D4 | **Catalog vs marketplace data** — Public catalog listings in `CatalogService` are in-memory demo data; marketplace uses real DB. Long-term, unify or clearly separate “marketing placeholders” vs live counts to avoid confusion and double maintenance. | P2 | Product clarity, fewer bugs | L |

---

## 4. Media & uploads

| ID | Item | Priority | Impact | Effort |
|----|------|----------|--------|--------|
| M1 | **Image pipeline** — Uploads cap at 5 MB (`upload.controller.ts`). Add server-side resize/WebP variants for hero/gallery to reduce storage and page weight (keep originals if needed for print). | P1 | Cost, LCP | M–L |
| M2 | **CDN cache headers** — For R2/public URLs, set aggressive cache on immutable hashed assets; shorter TTL for profile images that change. | P1 | Repeat views | S–M |
| M3 | **Legacy vs keyed URLs** — Migrations mention longtext URLs; ensure public URL resolution is consistent and avoids loading huge `data:` URLs in listings. | P2 | Payload size | M |

---

## 5. Observability & operations

| ID | Item | Priority | Impact | Effort |
|----|------|----------|--------|--------|
| O1 | **Structured logging** — Request id, tenant id, user id on logs; log levels by environment. | P1 | Faster incidents | M |
| O2 | **Metrics & alerts** — Latency histograms for `/api/marketplace/caterers`, auth, upload; error rate; DB pool saturation. | P1 | Proactive scaling | M |
| O3 | **Load / smoke tests** — Extend existing `ai-smoke` scripts toward sustained load on marketplace list and detail. | P2 | Regression safety | M |

---

## 6. Suggested sequencing

1. **Sprint A (foundation):** B2 (rate limits), D1 (indexes + EXPLAIN), F2 (image domains).
2. **Sprint B (throughput):** B4/B5 (marketplace query slimming), B1 (compression), F1 (caching strategy for public fetches).
3. **Sprint C (scale & cost):** D2/D3 (tenant pools), M1/M2 (images + CDN), O1/O2 (observability).

---

## Document maintenance

- Review after major schema or routing changes.
- Tick items in your issue tracker and link PRs here if you keep this file as the master list.

*Generated from repository review; adjust priorities against real traffic and SLAs.*
