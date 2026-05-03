# Testing this platform with an AI assistant

Use this document as **instructions you paste into Cursor (Agent)** or another AI tool. The AI should **run the commands below in your terminal** and report pass/fail.

## Prerequisites (human once)

1. **MySQL** running; database created and **migrations** applied (`catering-backend`: `npm run migration:run`).
2. Two terminals:
   - **API:** `cd catering-backend && npm run start:dev` → typically port **4000**.
   - **Website:** `cd catering-website && npm run dev` → note the URL Next prints (often **3000**).

Optional env overrides:

- API: `set API_BASE=http://localhost:4000` (PowerShell: `$env:API_BASE="..."`).
- Site: `set SITE_URL=http://localhost:3000` if your Next app is not on 3000.

## Prompt you can paste to an AI

> Run automated smoke tests for my catering repo at `c:/xampp/htdocs/catering`.
>
> 1. With the Nest API running on port 4000, execute: `cd catering-backend && npm run ai-smoke`. Interpret every ✓ or ❌ and explain failures (e.g. DB down, wrong port).
>
> 2. With the Next dev server running, execute: `cd catering-website && npm run ai-smoke`. If my site uses another port, set `SITE_URL` first then rerun.
>
> 3. Summarize whether the platform is reachable end-to-end and what to fix if anything failed.

## What the scripts check

| Script | Location | Checks |
|--------|----------|--------|
| `npm run ai-smoke` | `catering-backend` | `/api/health`, `/api/marketplace/cities`, `/api/marketplace/caterers`, `/api/marketplace/service-offerings` |
| `npm run ai-smoke` | `catering-website` | HTML responses for `/`, `/caterers`, `/login`, `/register`, `/contact`, `/privacy`, `/terms` |

These tests **do not** log in or mutate data. For workspace wizard flows (banner required, publish), test manually in the browser or add Playwright later.

## Cursor Agent tip

In Cursor, prefer **Agent mode** so the model can run shell commands without asking you to copy-paste each line.
