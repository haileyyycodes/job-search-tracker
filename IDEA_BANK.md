# Idea Bank

Nice-to-have ideas we don't want to lose. Not committed work — just parking lot.

---

## Auto-pull open positions from target-list companies

**Status:** idea only · captured 2026-08-30

**What:** For companies flagged `isTarget`, automatically discover their current
open roles and surface them in-app — a "new roles at companies you're watching"
feed, with one-click "Log application" pre-filled from a posting.

**Why it's only nice-to-have:** the core loop (manually logging applications) works
without it. This is a research/sourcing accelerator, and it needs infrastructure
the app doesn't currently have (see architecture note).

### Data-source options

| Source | Coverage | Notes |
|---|---|---|
| Public ATS JSON endpoints | Good for startups/tech | Greenhouse `boards-api.greenhouse.io/v1/boards/{slug}/jobs`, Lever `api.lever.co/v0/postings/{slug}`, Ashby, Workday. Free, structured, no auth. Need to map each company → provider + slug. |
| Third-party jobs aggregator API | Broad | Cost, ToS limits, rate caps, freshness varies. |
| Scrape career pages directly | Any company | Brittle per-site, anti-bot measures, breaks silently. Last resort. |
| Company-provided RSS/JSON feed | Rare | Cheap when it exists. |

Likely a tiered resolver: try known ATS by slug → fall back to a feed → give up
gracefully and just deep-link the careers page.

### Architecture note

The web CSP is `connect-src 'self'`, so the browser build cannot fetch
third-party endpoints directly. But the local runtime already has a real
Next.js server behind it (`apps/web/src/app/api/db`) — a new API route there
can do the fetching with plain Node `fetch` (no CSP) and return results to the
client, no separate desktop shell needed. This wouldn't apply to the deployed
demo build, which stays browser-only by design (§1 of
`docs/local-first-architecture.md`); it'd need to be a local-only feature or
pair with a small hosted proxy if it should also work in the demo.

### Sketch if we build it

- Company gains optional `atsProvider` + `atsSlug` (or `careersUrl`); a resolver
  guesses these from `website` and lets the user correct.
- New `open_positions` table: `company_id, title, location, url, posted_at,
  first_seen, last_seen, dismissed`. Migration across memory / wasm / sqlite
  data sources + contract tests.
- Refresh on a cadence (daily?) or on demand; dedupe by `url`; diff against
  `first_seen` to badge "new".
- UI: count badge on target companies, a feed view, mark-seen / dismiss, and
  "Log application" prefilled (company, role, link, description).

### Concerns

- **Freshness & politeness:** cache, rate-limit, back off; handle slugs that 404.
- **Mapping accuracy:** wrong slug = silently empty or wrong company's jobs. Needs
  a manual override and a "looks wrong?" affordance.
- **Privacy:** outbound requests disclose your target list to those ATS hosts /
  the proxy. Fine for public endpoints, worth noting.
- **ToS:** scraping fallback may violate site terms; ATS public APIs are fine.
- **Untrusted content:** posting titles/descriptions are third-party text — run
  them through the same `richText.ts` sanitizer if we ever show more than a plain
  title + link.
- **Scope creep:** this is a mini job board. Keep it to "roles at *my* companies,"
  not general search.

---

## Tighten `script-src` (drop `'unsafe-inline'`)

**Status:** idea only

The CSP (`apps/web/next.config.ts`) still carries
`script-src … 'unsafe-inline'` for Next's bootstrap. That's the one gap that lets
an injected inline handler run if sanitization ever fails. The real fix is
nonce/hash-ing the Next bootstrap scripts and removing `'unsafe-inline'` — turns
any residual HTML-injection into a non-event. Non-trivial (Next static export +
nonces), hence deferred; DOMPurify on the one render path is the current backstop.
