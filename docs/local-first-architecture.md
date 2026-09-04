# Application Tracker: local-first architecture + portfolio demo

**Status:** implemented
**Goal:** Persist the Application Tracker to a real local SQLite file when run on your own machine, while keeping a browser-based demo for the portfolio — one shared codebase, two runtimes, no separate desktop app to build or install.

This app was originally an Electron desktop app wrapping a static Next.js export, so the local runtime could talk to `better-sqlite3` in Electron's main process over IPC. That's been removed: `apps/web` already runs as a real Next.js server (not a static export) everywhere except the Vercel demo build, so the local runtime now talks to `better-sqlite3` through a normal Next.js API route instead. Same persistence, same schema, one fewer thing to package and update.

---

## 1. The core decision

Two audiences, one runtime (`apps/web`), a boot-time fork in storage:

| | Real app (you, local) | Portfolio demo (recruiters, Vercel) |
|---|---|---|
| Storage | Local SQLite file via `better-sqlite3`, behind `/api/db` | In-browser SQLite via `sql.js` (WASM), in-memory |
| Persistence | Permanent, on your machine (`~/.job-tracker/job-tracker.db`) | Resets on every refresh (seeded demo data) — this is a feature, not a bug |
| First run | Empty database — no seed data | Pre-populated with seed data from `src/lib/data.ts` |
| Data access | `fetch` to `/api/db` (same origin) | Direct in-tab calls |
| Selected by | Default (no `NEXT_PUBLIC_DEMO_MODE`) | `NEXT_PUBLIC_DEMO_MODE=true` set in Vercel's project env vars |

Cross-device sync for your own data (Tailscale + file sync, or Turso later) is a separate, optional problem — not addressed here.

---

## 2. Repo layout: npm workspaces monorepo

`better-sqlite3` is a native module. It's a dependency of `apps/web` only (needed by its `/api/db` route) — `packages/shared` stays free of it, same as it stays free of `sql.js` outside a dynamic import.

```
apps/web/        Next.js app — UI, /api/db route, server/sqlite (better-sqlite3)
packages/shared/  UI components, business logic, DataSource interface, WasmDataSource,
                  HttpDataSource, MemoryDataSource
```

---

## 3. Architecture: the `DataSource` boundary

All UI (components, views, business/status logic) is written once and depends only on a `DataSource` interface. It never knows or cares which implementation is behind it.

```
Shared UI + business logic (packages/shared)
        |
  DataSource interface
    /       |        \
HttpDataSource   WasmDataSource   MemoryDataSource
(fetch to        (sql.js, in-      (plain JS objects,
 /api/db)         browser, WASM)    for tests)
    |                     |                |
apps/web's           apps/web         vitest suite
/api/db route        (demo build)
+ server/sqlite
(local .db file)
```

### Selecting the implementation (one place, at boot)

```typescript
// packages/shared/src/lib/dataSource/select.ts
export async function selectDataSource(): Promise<DataSource> {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    const { HttpDataSource } = await import("./httpDataSource");
    return new HttpDataSource();
  }
  const { WasmDataSource } = await import("./wasmDataSource");
  return new WasmDataSource();
}
```

`WasmDataSource` is loaded via dynamic `import()` so its ~1.5MB sql.js WASM binary never ships to a build that doesn't need it.

**Discipline rule:** never let a component reach past `DataSource` for a platform-specific API without adding it to the interface first — even when it's slower. A shortcut here silently breaks one runtime or the other.

---

## 4. Schema: fully normalized, not JSON blobs

`Interview`, `FollowUp`, and `StatusHistoryEntry` are real tables with foreign keys, shared by every SQL-backed implementation (`server/sqlite/schema.ts` and `WasmDataSource` both import the same `SCHEMA_SQL`):

```
applications(id INTEGER PK, company_id, role, status, ...)
interviews(id INTEGER PK, application_id FK, type, date, ...)
follow_ups(id INTEGER PK, application_id FK, date, contact_id, notes)
status_history(id INTEGER PK, application_id FK, status, at)
companies(id INTEGER PK, name, is_target, status, industry, website, notes)
company_locations(id INTEGER PK, company_id FK, city, state)
contacts(id INTEGER PK, name, email, phone, linkedin_url, website, company_id FK, role, notes)
networking_events(id INTEGER PK, type, date, application_id FK, notes)
networking_event_contacts(networking_event_id FK, contact_id FK)
goals(id INTEGER PK, salary_min, salary_max, applications_per_week_target, target_offer_date)
interview_categories(id INTEGER PK, name)
user_profile(id INTEGER PK, name)
interview_prep_questions(id INTEGER PK, category, section, question, answer, starred)
elevator_pitch_versions(id INTEGER PK, ..., source_question_id FK)
```

**Composition happens inside each `DataSource` implementation.** `getApplications()` does the joins and returns the same nested `Application` shape (with `.interviews`, `.followUps`, `.statusHistory` arrays) that every component consumes — `useTrackerData.ts` and the component tree need zero shape changes when the backing store changes.

`server/sqlite/schema.ts`'s `migrate()` is the additive-fixup path for DB files created before a given table/column existed — see the README's troubleshooting section for what happens when it's missing something.

---

## 5. Async architecture: full load on boot, optimistic cache in `useTrackerData.ts`

`DataSource` methods are `Promise`-based (required for both `fetch` to `/api/db` and `sql.js`'s WASM init). `useTrackerData.ts` holds all tracker state in one module-level external store (`useSyncExternalStore`, not `useState`/Context — every consumer of the hook shares the same snapshot).

**Boot:** `loadAll()` fires all nine `DataSource` getters in parallel via `Promise.all` (applications, companies, contacts, networking events, goals, user profile, interview categories, interview prep questions, elevator pitch versions) and stores the full result. There's no pagination or per-view fetching — every screen reads from this one in-memory snapshot loaded once at startup.

**Why load everything upfront instead of per-view:** this is a single-user local tool with a personal-scale dataset (tens to low hundreds of rows), not a multi-tenant app. Fetching per-view would mean scattered loading states and cache invalidation across screens, in exchange for no real benefit at this scale — and it would work against the actual design goal, which is that every click already has the data it needs. This stops being the right call if the dataset grows far beyond personal-job-search size, or if the app ever became multi-user/multi-device; neither is a current goal (see §9).

**Mutations** apply optimistically against that same store:

1. Mutation called → cache updates immediately, component re-renders instantly
2. `DataSource` call fires in the background
3. On success: no-op (cache already correct)
4. On failure: roll back the cache change, surface an error

This is the only layer that knows mutations are async underneath — no component below it does.

---

## 6. `HttpDataSource` + `apps/web/src/server/sqlite` (local, persistent)

- `apps/web/src/server/sqlite/schema.ts` — `openDatabase(dbPath)`: opens (creating if needed) a SQLite file, enables `PRAGMA foreign_keys = ON`, runs `SCHEMA_SQL` on a brand-new file or `migrate()` on an existing one.
- `apps/web/src/server/sqlite/sqliteDataSource.ts` — `createSqliteDataSource(db)`: the real `DataSource` implementation over `better-sqlite3`. Framework-agnostic — takes a `Database.Database`, nothing Next.js-specific.
- `apps/web/src/server/sqlite/db.ts` — a per-process singleton: opens `process.env.JOB_TRACKER_DB_PATH ?? ~/.job-tracker/job-tracker.db` once, reuses the connection.
- `apps/web/src/app/api/db/route.ts` — one `POST` handler, dispatching by a `{ channel, args }` body through a `CHANNELS` map (one entry per `DataSource` method, namespaced e.g. `applications:list`). `Object.keys(CHANNELS)` is the allow-list; an unrecognized channel is rejected before it reaches `better-sqlite3`.
- `packages/shared/src/lib/dataSource/httpDataSource.ts` — the client side: `HttpDataSource` implements `DataSource` by `fetch`-ing `/api/db` with `{ channel, args }`, one method per channel. `RestrictedDeleteError` crosses the HTTP boundary via a `RESTRICTED_DELETE:` message prefix (a `Response` body only carries a string, not the thrown error's type) — mirrors the old Electron IPC error-marker pattern exactly.

`route.test.ts` guards `CHANNELS`' keys against `HttpDataSource`'s `HTTP_DB_CHANNELS` set — the two lists live on either side of an HTTP boundary TypeScript can't check across, so a rename on only one side would otherwise fail silently as "Unknown channel" at runtime.

First run: schema created, database starts **empty** (no seed data — this is your real job search).

---

## 7. `WasmDataSource` (packages/shared, used by the deployed demo)

- `sql.js` = SQLite compiled to WebAssembly, real SQLite engine, same SQL dialect/schema as the local server side (shares `SCHEMA_SQL` from §4).
- Pure in-memory. Reseeded fresh on every page load — no `db.export()`/`localStorage` persistence. A visitor's edits never linger to confuse the next visitor, and the demo story stays clean.
- Loaded via dynamic `import()` at boot (§3).

---

## 8. Testing: `MemoryDataSource`

A third `DataSource` implementation: plain in-memory JS objects/arrays, `Promise`-returning to match the interface contract, no SQL, no WASM, no native compilation. Used only by the test suite (`useTrackerData.test.ts`).

**Why not test against real `WasmDataSource`:** every test run would pay sql.js's WASM init cost — slower and more fragile than a plain in-memory fake, for no meaningful gain in confidence (the interface contract is what's under test, not SQLite itself).

`packages/shared/src/lib/dataSource/contract.ts`'s `runDataSourceContractTests` is the implementation-agnostic behavior suite — `MemoryDataSource`, `WasmDataSource`, and `createSqliteDataSource` (via `apps/web/src/server/sqlite/sqliteDataSource.contract.test.ts`) each run it against themselves, so cascade/restrict/compose behavior stays identical everywhere.

---

## 9. Explicitly out of scope

- Cross-device sync for your own data (§1) — Tailscale/Turso, revisit only if single-machine storage becomes a real limitation
- An AI extraction step (e.g. via Claude) for parsing job postings — nothing like this exists in the codebase today; the local runtime now has a real Node server behind it (see `apps/web/src/app/api/db`), so a future feature needing outbound `fetch` without CSP constraints (e.g. the auto-pull-open-positions idea in `IDEA_BANK.md`) has a natural home in a new API route instead of needing a desktop shell
- Persisting the browser demo across refreshes (§1, §7) — resetting is the intended behavior
