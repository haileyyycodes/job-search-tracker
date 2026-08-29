# Application Tracker: local-first architecture + portfolio demo

**Status:** planned, ready to build
**Goal:** Move the Application Tracker off `localStorage` onto a real local SQLite file in an Electron desktop app, while keeping a browser-based demo for the portfolio — one shared codebase, two runtimes.

This replaces an earlier draft of this doc that assumed a Postgres/Supabase backend on Vercel needed migrating away from. That backend never existed — the app has only ever persisted to the browser's `localStorage` (see `src/lib/usePersistedState.ts`). There is no live data to migrate and no server to decommission; this is a from-`localStorage` plan, not a from-Postgres one.

---

## 1. The core decision

Two audiences, two runtimes, one shared codebase:

| | Real app (you) | Portfolio demo (recruiters) |
|---|---|---|
| Runtime | Electron desktop app | Browser, deployed on Vercel |
| Storage | Local SQLite file via `better-sqlite3` | In-browser SQLite via `sql.js` (WASM), in-memory |
| Persistence | Permanent, on your machine | Resets on every refresh (seeded demo data) — this is a feature, not a bug |
| First run | Empty database — no seed data | Pre-populated with seed data from `src/lib/data.ts` |
| Data access | IPC to Electron main process | Direct in-tab calls |

Cross-device sync for your own data (Tailscale + file sync, or Turso later) is a separate, optional problem — not needed for v1, not addressed here.

---

## 2. Repo layout: npm workspaces monorepo

`better-sqlite3` is a native module the Electron main process needs and the web build must never see — installing it at the repo root would make Vercel try to compile a native binding it never imports. The repo splits into workspaces:

```
apps/web/        Next.js app, deployed to Vercel (today's app, minus localStorage)
apps/desktop/     Electron main + preload process, better-sqlite3, IPC handlers
packages/shared/  UI components, business logic, DataSource interface, WasmDataSource, MemoryDataSource
```

Only `apps/desktop` depends on `better-sqlite3`. Only `packages/shared` (dynamically) depends on `sql.js`.

**To-do:**
- [ ] Set up npm workspaces (`package.json` `workspaces` field)
- [ ] Move `src/` into `packages/shared` and `apps/web`, split by what's UI/logic vs. Next.js app-shell
- [ ] Re-point `tsconfig.json` paths, `vitest.config.ts`, and `eslint.config.mjs` at the new structure

---

## 3. Architecture: the `DataSource` boundary

All UI (components, views, business/status logic) is written once and depends only on a `DataSource` interface. It never knows or cares which implementation is behind it.

```
Shared UI + business logic (packages/shared)
        |
  DataSource interface
    /       |        \
ElectronDataSource  WasmDataSource  MemoryDataSource
(IPC to main,       (sql.js, in-      (plain JS objects,
 better-sqlite3)     browser, WASM)    for tests)
    |                     |                |
apps/desktop          apps/web         vitest suite
(local .db file)      (seeded, resets)
```

### Interface covers every entity, not just Application

The earlier draft's interface sketch only listed `Application`/`Interview`/`FollowUp`/`StatusChange`. The real surface, matching `src/lib/types.ts` and everything `useTrackerData.ts` currently owns:

```typescript
interface DataSource {
  getApplications(): Promise<Application[]>;
  createApplication(app: NewApplication): Promise<Application>;
  updateApplicationStatus(id: number, status: ApplicationStatus, at: string): Promise<void>;
  editApplication(app: Application): Promise<void>;
  deleteApplication(id: number): Promise<void>;

  logInterview(appId: number, interview: NewInterview): Promise<void>;
  editInterview(appId: number, interviewId: number, updates: NewInterview): Promise<void>;
  deleteInterview(appId: number, interviewId: number): Promise<void>;

  logFollowUp(appId: number, followUp: NewFollowUp): Promise<void>;
  deleteFollowUp(appId: number, followUpId: number): Promise<void>;

  getCompanies(): Promise<Company[]>;
  createCompany(company: NewCompany): Promise<Company>;
  editCompany(company: Company): Promise<void>;
  deleteCompany(id: number): Promise<void>;
  toggleTarget(id: number): Promise<void>;

  getContacts(): Promise<Contact[]>;
  createContact(contact: NewContact): Promise<Contact>;
  editContact(contact: Contact): Promise<void>;
  deleteContact(id: number): Promise<void>;

  getNetworkingEvents(): Promise<NetworkingEvent[]>;
  addNetworkingEvent(event: NewNetworkingEvent): Promise<NetworkingEvent>;
  deleteNetworkingEvent(id: number): Promise<void>;

  getGoals(): Promise<Goals>;
  setGoals(goals: Goals): Promise<void>;

  getInterviewCategories(): Promise<string[]>;
  addInterviewCategory(category: string): Promise<void>;
}
```

Every `DataSource` implementation migrates together — no interim state where some entities are on `DataSource` and others still on `localStorage`.

### Selecting the implementation (one place, at boot)

```javascript
const dataSource = window.electronAPI
  ? new ElectronDataSource()
  : (await import("./WasmDataSource")).createWasmDataSource();
```

`WasmDataSource` is loaded via dynamic `import()` so its sql.js WASM binary is never bundled into the Electron static export.

**Discipline rule:** never let a component reach past `DataSource` for a platform-specific API (native file dialogs, OS notifications, etc.) without adding it to the interface first — even when it's slower. A shortcut here silently breaks the web build.

---

## 4. Schema: fully normalized, not JSON blobs

Today, `Interview`, `FollowUp`, and `StatusHistoryEntry` live as nested arrays inside each in-memory `Application` object. In SQLite they become real tables with foreign keys:

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
```

**Composition happens inside each `DataSource` implementation.** `getApplications()` does the joins and returns the same nested `Application` shape (with `.interviews`, `.followUps`, `.statusHistory` arrays) that every component already consumes. `useTrackerData.ts` and the component tree need zero shape changes — only the persistence layer underneath changes.

### Primary keys: INTEGER AUTOINCREMENT

Every `id: string` field in `types.ts` becomes `id: number`. This touches seed data, every component that reads/compares/constructs an id, and route handling (see §6).

**To-do:**
- [ ] Write `CREATE TABLE` statements — shared between `ElectronDataSource`'s Electron-main-process schema and `WasmDataSource`'s in-browser schema (same SQL dialect, same schema file, imported by both)
- [ ] Update `types.ts`: every `id` and every `*Id` foreign-key field becomes `number`
- [ ] Update `src/lib/data.ts` seed data to use numeric ids
- [ ] Write a `salvage`-equivalent for the new shapes (schema validation is still useful even without `localStorage`, e.g. validating rows coming back over IPC)

---

## 5. Async architecture: optimistic cache in `useTrackerData.ts`

`DataSource` methods are `Promise`-based (required for Electron IPC and for `sql.js`'s WASM init). Today's `useTrackerData.ts` is fully synchronous via `usePersistedState`. Making every mutation `await`-then-refetch would introduce a visible delay on every click that doesn't exist today.

Instead, `useTrackerData.ts` keeps an in-memory cache (React state, same shape as today's snapshot):

1. Mutation called → cache updates immediately, component re-renders instantly (same feel as today)
2. `DataSource` call fires in the background
3. On success: no-op (cache already correct)
4. On failure: roll back the cache change, surface an error

This is more logic inside `useTrackerData.ts` than today's thin `usePersistedState` wrapper, but it's the only layer that changes — no component below it needs to know mutations are now async underneath.

**To-do:**
- [ ] Design the optimistic-update/rollback pattern once, reuse it for every mutation method
- [ ] Decide how failures surface in the UI (toast? inline error? silent retry?)

---

## 6. Electron + Next.js: static export

Next.js `output: 'export'` produces a static HTML/JS/CSS bundle loaded via `file://` inside Electron's `BrowserWindow`. No bundled Node server process to manage — appropriate here since nothing in the app uses server components, API routes, or middleware today (verified: none exist).

### The dynamic-route problem, and its fix

Static export requires every dynamic route segment (`applications/[id]`, `companies/[id]`, `contacts/[id]`) to be enumerable at build time via `generateStaticParams()`. But these ids only exist in the runtime SQLite file — there's no way to know them at build time, and on `file://` a path like `/applications/42/` simply doesn't exist as a file.

**Fix:** switch these three routes from path params to query params — `/applications?id=42` instead of `/applications/42`. One static `applications.html` handles every id via `useSearchParams()` instead of `useParams()`. Applies to both the Electron build and the Vercel demo, since it's the same shared codebase and same route files.

**To-do:**
- [ ] `next.config.ts`: add `output: 'export'` (for the Electron build target; the Vercel deploy can keep its normal build)
- [ ] Rewrite `applications/[id]/page.tsx` → `applications/page.tsx` reading `useSearchParams()`; same for `companies` and `contacts`
- [ ] Update every `router.push(`/applications/${id}`)` / `<Link href={...}>` call site to the query-param form
- [ ] Confirm no other Next.js server-only feature creeps in later (this constraint needs to hold going forward)

---

## 7. `ElectronDataSource` (apps/desktop)

- Renderer process cannot touch the filesystem directly — SQL runs in the **main process** via `better-sqlite3`.
- Renderer's `ElectronDataSource` is a thin wrapper: every method calls `ipcRenderer.invoke('applications:list')` etc. It never imports `better-sqlite3` directly, so the native module never leaks into any bundle the web build touches.
- Dev mode: same code path, same database file as the packaged build (`app.getPath("userData")/job-tracker.db`) — no separate dev path, so there's only ever one real database on disk.
- First launch: schema created, database starts **empty** (no seed data — this is your real job search).

**To-do:**
- [ ] Define IPC channel names for each `DataSource` method (one per interface method, namespaced e.g. `applications:list`, `applications:create`)
- [ ] Write the main-process handlers wrapping `better-sqlite3`, doing the joins described in §4
- [ ] Preload script exposing only the typed IPC surface to the renderer (`window.electronAPI`), nothing broader

---

## 8. `WasmDataSource` (packages/shared, used by apps/web)

- `sql.js` = SQLite compiled to WebAssembly, real SQLite engine, same SQL dialect/schema as the Electron side (shares the `CREATE TABLE` statements from §4).
- Pure in-memory. Reseeded fresh on every page load — no `db.export()`/`localStorage` persistence. A visitor's edits never linger to confuse the next visitor, and the demo story stays clean.
- Loaded via dynamic `import()` at boot (§3) so its WASM binary never ships in the Electron bundle.

**To-do:**
- [ ] Seed data: port `src/lib/data.ts` into `INSERT` statements matching the normalized schema (mostly mechanical — this data already exists, just needs to lose its string ids and nested-array shape)
- [ ] Add a brief loading state while `initSqlJs()` resolves
- [ ] Confirm bundle size impact is acceptable given it's now split out from the main chunk

---

## 9. Testing: `MemoryDataSource`

A third `DataSource` implementation: plain in-memory JS objects/arrays, `Promise`-returning to match the interface contract, no SQL, no WASM, no native compilation. Used only by the test suite.

**Why not test against real `WasmDataSource`:** every test run would pay sql.js's WASM init cost, and CI would need to reliably bundle/fetch the wasm binary — slower and more fragile than a plain in-memory fake, for no meaningful gain in confidence (the interface contract is what's under test, not SQLite itself).

**To-do:**
- [ ] Implement `MemoryDataSource` alongside the interface definition — it's cheap and doubles as a reference implementation
- [ ] Rewrite `useTrackerData.test.ts` to inject `MemoryDataSource` instead of relying on `jsdom`'s `localStorage`
- [ ] Audit `schemas.test.ts`, `location.test.ts`, etc. for anything else assuming the old string-id/localStorage shape

---

## 10. Electron tooling & distribution

- **Electron Forge** for scaffolding, dev, build, and packaging — official tooling, plain JS template (no opinionated framework layer, since Next.js already produces the static output separately).
- **Unsigned, local-only for v1.** No Apple Developer Program enrollment, no notarization. `npm start` for day-to-day use, or `make` a `.app`/`.dmg` you install once — macOS Gatekeeper's unsigned-app warning is a one-time right-click-to-open nuisance, not a blocker, for an app only you run on your own machine. Revisit only if you ever want to share the built app with someone else.

**To-do:**
- [ ] Scaffold `apps/desktop` with Electron Forge's JavaScript template
- [ ] Wire the static export output from `apps/web`'s build into what Electron's `BrowserWindow` loads
- [ ] `make` config for a local `.dmg`/`.app`, no signing/notarization steps

---

## 11. Suggested build order

1. Set up the npm workspaces split (§2) — do this before writing new code, not after, so nothing has to move twice
2. Define `DataSource` interface + types (§3), including the numeric-id type changes (§4) throughout `types.ts`
3. Build `MemoryDataSource` (§9) alongside the interface — cheapest way to validate the interface shape and unblock rewriting `useTrackerData.ts`
4. Rewrite `useTrackerData.ts` against `DataSource` with the optimistic-cache pattern (§5), tested against `MemoryDataSource`
5. Fix the three dynamic routes to query params (§6) — needed by both runtimes, do it once
6. Build `WasmDataSource` (§8) — validates the real schema/seed data against real SQLite, still fast iteration, no Electron shell needed yet
7. Stand up the Electron shell (§10) and `ElectronDataSource` (§7) against the same interface
8. Wire boot-time selection logic (§3) with the dynamic import
9. Deploy `apps/web` to Vercel, package `apps/desktop` via Electron Forge
10. Write the case study, naming the local-first decision explicitly — the demo is a real SQLite/WASM instance, every click genuinely executes against it, not a mock

---

## 12. Explicitly out of scope for v1

- Cross-device sync for your own data (§1) — Tailscale/Turso, revisit only if single-machine storage becomes a real limitation
- Code signing / notarization (§10) — only relevant if distributing to others
- An AI extraction step (e.g. via Claude) for parsing job postings — nothing like this exists in the codebase today; if it's wanted later, decide then whether it runs in the Electron main process, the renderer, or stays a hosted call, and design it against the same `DataSource` boundary
- Persisting the browser demo across refreshes (§1, §8) — resetting is the intended behavior
