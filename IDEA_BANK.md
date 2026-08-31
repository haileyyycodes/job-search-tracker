# Idea Bank

Nice-to-have ideas we don't want to lose. Not committed work — just parking lot.

---

## Rich-text / formatted job descriptions

**Status:** idea only · captured 2026-08-30

**What:** When pasting a job description into the Log/Edit application dialog, keep
the source formatting (headings, bold, lists) instead of flattening to plain text.
Render it formatted on the application detail view (currently
`ApplicationDetailView.tsx` shows it as a `white-space: pre-wrap` text node).

**Why it's only nice-to-have:** plain text with preserved line breaks is already
readable. This is polish, and it drags in a real security surface (see below), so
it's not worth doing casually.

### Approach options

| Option | Stores | Fidelity | Risk |
|---|---|---|---|
| A. Sanitized HTML | HTML string | High | Highest — every render is `dangerouslySetInnerHTML` |
| B. Markdown | Markdown text | Good (headings/bold/lists/links) | Lower — stored value is inert text; risk only in render path |
| C. Structural-only | Plain text (unchanged) | Heuristic — detect `#`, `-`, blank-line paragraphs at render | None new; won't match arbitrary postings |

Paste flow for A/B: read `clipboardData.getData("text/html")`; for B, convert
that HTML → Markdown before storing.

**Leaning toward B (Markdown + sanitized renderer):** gets the formatting, keeps
the stored value inert and human-readable, fits the two-panel dialog (Markdown
source left, live preview).

### Security concerns this introduces

Today there is **zero HTML-injection surface** — no `dangerouslySetInnerHTML`
anywhere, `jobDescription` is an escaped text node. Rendering pasted markup changes that.

1. **Stored XSS.** Pasted `text/html` from LinkedIn/Greenhouse/Workday/etc. is
   attacker-influenced. Unsanitized → `<img src=x onerror>`, `<svg onload>`,
   inline `on*` handlers, `javascript:` links. Persisted, re-fires every view.
2. **CSP doesn't save us.**
   - Web (`apps/web/next.config.ts`): `script-src` has `'unsafe-inline'`, so
     injected handlers execute. Exfiltration *is* well contained
     (`connect-src 'self'`, `img-src 'self' data:`, `base-uri 'self'`).
   - Electron (`apps/desktop/src/main.ts`): **no CSP set on the session at all**
     despite the next.config comment implying otherwise. Injected script can
     `fetch()` / beacon anywhere.
3. **Blast radius.** Renderer reaches the whole local DB via
   `window.electronAPI.invoke` (allow-listed IPC bridge in `preload.ts`). Bridge
   is well-built and Electron defaults (`contextIsolation`, `sandbox`,
   `nodeIntegration:false`) hold → no trivial RCE, but the exposed CRUD is every
   application / contact / note / salary / pitch.
4. **Tracking pixels (accidental, near-certain).** Posting HTML often carries
   `<img>` beacons; rendering them leaks when/how often you view an application.
   Web CSP blocks external `img-src`; Electron doesn't.
5. **CSS / `<base>` injection.** `<style>` or `style=` in the paste can restyle or
   overlay the whole app; `<base href>` rewrites relative URLs.
6. **DoS / bloat.** Giant paste bloats the row and janks the view; travels with
   any future export/backup/sync.

### If we do it — mitigations

- Sanitize with an allowlist, **on input and on render** (defense in depth):
  allow `h1–h4, p, ul/ol/li, strong/em, a, br, blockquote, code, pre`; strip all
  `style`/`class`/`on*` and non-http(s) URLs; force `<a rel="noopener noreferrer">`.
- Use **DOMPurify** for that. The "no external libraries" rule
  (`feedback_custom_components_only`) is about UI libs; hand-rolled HTML
  sanitization is a footgun. If bespoke is non-negotiable, do Option B so our code
  only renders a known-safe subset and never trusts raw HTML.
- Add a real CSP to the Electron `session.defaultSession`, matching web.
- Explicitly set `contextIsolation` / `sandbox` / `nodeIntegration:false` in
  `main.ts` instead of relying on defaults.
- Tighten web `script-src` — drop `'unsafe-inline'` (nonce/hash the Next
  bootstrap). That's the actual fix; makes residual injection a non-event.
- Cap stored length. Build a paste-test corpus (Word / Google Docs / LinkedIn
  soup + OWASP XSS vectors).

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

### Architecture note (this is the real blocker)

App is local-first: sql.js in the browser, Electron desktop, static export — **no
server**, and the web CSP is `connect-src 'self'`, so the browser build cannot
fetch third-party endpoints at all. Options:

- **Electron main process** does the fetching (Node `fetch`, no CSP), exposes
  results over a new IPC channel. Desktop-only feature.
- **Add a small backend / serverless proxy.** Changes the deployment story.
- **User-initiated only:** a "check now" button that opens the resolved careers
  URL in a browser tab — no fetching, no storage, minimal value.

### Sketch if we build it

- Company gains optional `atsProvider` + `atsSlug` (or `careersUrl`); a resolver
  guesses these from `website` and lets the user correct.
- New `open_positions` table: `company_id, title, location, url, posted_at,
  first_seen, last_seen, dismissed`. Migration across memory / wasm / electron
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
- **Untrusted content:** posting titles/descriptions are third-party text — same
  render-sanitization rules as the rich-text idea above if we ever show more than
  a plain title + link.
- **Scope creep:** this is a mini job board. Keep it to "roles at *my* companies,"
  not general search.

---

## Electron desktop hardening

**Status:** idea only · captured 2026-08-30

**What:** Tighten the Electron shell so a renderer-side content-injection bug
can't reach out or read what it shouldn't.

- **CSP on the session.** `apps/desktop/src/main.ts` sets *no* CSP on
  `session.defaultSession` today (the web build's CSP in `next.config.ts` is
  Vercel-header-only and doesn't apply to the static export Electron loads). Add
  `session.defaultSession.webRequest.onHeadersReceived` (or a
  `Content-Security-Policy` meta in the exported HTML) matching the web policy:
  `default-src 'self'`, `connect-src 'self'`, `img-src 'self' data:`,
  `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`.
- **Pin `webPreferences`** in `createWindow()` instead of relying on Electron
  defaults: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`,
  `webSecurity: true`. The preload bridge (`preload.ts`) is already
  channel-allowlisted; this closes the rest.

**Why it matters:** caps the blast radius of any untrusted content the renderer
handles — pasted job descriptions (see the rich-text idea) and stored resume
files. Resume files are only ever handed back as a download and never opened
in-app, so this isn't urgent, but it's the right backstop.

**Why not now:** adding a CSP to the desktop build risks breaking it if a
directive is wrong (the static export uses inline scripts/styles that need
`'unsafe-inline'`), and it's orthogonal to file storage. Worth its own change +
a desktop smoke test.
