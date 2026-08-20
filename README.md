# Job Tracker

Local-first job application tracker. One codebase, two runtimes:

- **`apps/desktop`** — Electron app, real SQLite (`better-sqlite3`), for daily personal use
- **`apps/web`** — Next.js app, deployed to Vercel as a portfolio demo (in-memory SQLite via `sql.js`, resets on refresh)
- **`packages/shared`** — the UI, business logic, and `DataSource` interface both runtimes consume unchanged

See [`docs/local-first-architecture.md`](docs/local-first-architecture.md) for the full design.

## Web

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Desktop app

**Develop** — rebuilds from current source every run (no hot reload; re-run after each change):

```bash
cd apps/desktop && npm start
```

**Install** — builds a `.dmg`/`.app` into `apps/desktop/out/`:

```bash
cd apps/desktop && npm run make
```

Open the `.dmg`, drag `Job Tracker.app` into Applications. It's unsigned, so the first launch needs a right-click → **Open** to get past Gatekeeper.

The installed app is a frozen snapshot — it does **not** auto-update. Re-run `npm run make` and reinstall to pick up new changes. Dev and installed builds share the same database (`~/Library/Application Support/Job Tracker/job-tracker.db`), so data carries over either way.

## Commands

Run from the repo root, across all workspaces:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
