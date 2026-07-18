---
name: verify
description: Build, run, and drive the job-search-tracker app to verify changes end-to-end.
---

# Verifying job-search-tracker

Client-only Next.js app; all data lives in localStorage under `harbor:*` keys. There is no backend — verification means driving the UI in a browser.

## Build & launch

```bash
npm run build
PORT=3100 npm run start   # background; ready when curl http://localhost:3100 returns 200
```

`npm run dev` works too but prod `start` also exercises the `headers()` config (CSP etc.) from next.config.ts — check those with `curl -sI http://localhost:3100/`.

## Driving it

Playwright is available via the npx cache (`~/.npm/_npx/*/node_modules/playwright`, import `index.mjs` by absolute path from a scratchpad script — `NODE_PATH` does not work for ESM). Chromium is already downloaded.

Useful entry points:
- Seed state directly: `page.evaluate(() => localStorage.setItem("harbor:applications", JSON.stringify([...])))` then reload. Keys: `harbor:applications`, `harbor:tasks`, `harbor:goals`, `harbor:contacts`, `harbor:networkingEvents`, `harbor:companies`, `harbor:interviewCategories`. Seeded records must match the zod schemas in `src/lib/schemas.ts` or they get dropped on load (by design).
- Detail pages are `/applications/<id>`, `/companies/<id>`, `/contacts/<id>` against the seeded ids.
- Form inputs have no label/for association — select by placeholder (`getByPlaceholder("https://…")`), not `getByLabel`.
- Dialog openers: "+ Add company" (companies page), footer save button is "Save company"; other dialogs follow the same Add/Save naming.

## Gotchas

- Demo data loads whenever a `harbor:*` key is absent or non-array garbage; overwriting a key replaces the demo data entirely.
- Validation warnings from salvage-on-load appear in the browser console (`localStorage "harbor:..." ...`) — capture console messages to assert on them.
