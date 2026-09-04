# Job Tracker

Local-first job application tracker. One codebase, two runtimes:

- **`apps/web`** run locally — real persistent SQLite (`better-sqlite3`) behind a `/api/db` route, for daily personal use
- **`apps/web`** deployed to Vercel as a portfolio demo — in-memory SQLite via `sql.js`, resets on refresh
- **`packages/shared`** — the UI, business logic, and `DataSource` interface both runtimes consume unchanged

See [`docs/local-first-architecture.md`](docs/local-first-architecture.md) for the full design.

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Your data persists to a real SQLite file at `~/.job-tracker/job-tracker.db` (override with `JOB_TRACKER_DB_PATH`) across restarts — nothing resets on refresh.

`npm run build && npm start` runs the same persistent setup from a production build.

### Troubleshooting: the app loads but shows no data

If your companies, contacts, and networking events have all vanished at once, the database is fine — the app failed to load it. `openDatabase()` in [`apps/web/src/server/sqlite/schema.ts`](apps/web/src/server/sqlite/schema.ts) runs the full schema only on a brand-new file; every existing file gets `migrate()` instead, which must add any table introduced later. When a table it needs is missing, the boot-time `Promise.all` of list queries rejects as a whole and every view stays empty. `migrate()` runs on every server start and is idempotent, so restarting after pulling the fix backfills the missing tables without touching existing rows.

## Deploying the demo

The Vercel deployment sets `NEXT_PUBLIC_DEMO_MODE=true`, which switches the app to the in-memory `WasmDataSource` (seeded fake data, resets on every refresh) instead of the persistent SQLite backend — see [`packages/shared/src/lib/dataSource/select.ts`](packages/shared/src/lib/dataSource/select.ts).

## Commands

Run from the repo root, across all workspaces:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
