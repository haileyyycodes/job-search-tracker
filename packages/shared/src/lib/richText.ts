/**
 * Rich-text pipeline for the job description and resume fields. Both are stored as
 * **Markdown** (inert, human-editable); this module converts pasted HTML → Markdown
 * on the way in and Markdown → sanitized HTML on the way out.
 *
 * Browser-only: turndown and DOMPurify need a DOM. Imported from React components
 * only, never from server code (e.g. `apps/web/src/server`) — same containment as
 * `resumeUpload.ts` used to have. `markdownToSafeHtml` is only ever called
 * client-side (in a render effect), so no isomorphic/jsdom shim is needed.
 *
 * Security: the stored value is plain Markdown, so there is no persisted markup.
 * The only place HTML exists is the render path, where `marked` output is passed
 * through `DOMPurify` with a tight allowlist (no `img` → no tracking beacons, no
 * `style`, no non-http(s) URLs) before it reaches `dangerouslySetInnerHTML`.
 */
import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";

/** Hard cap on a stored job-description / resume value. */
export const MAX_RICH_TEXT_CHARS = 20000;

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "br",
  "strong",
  "em",
  "del",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "code",
  "pre",
  "hr",
];

let turndown: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!turndown) {
    turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "_",
    });
    // Drop these outright rather than letting their content/attrs leak through.
    turndown.remove(["script", "style", "head", "meta", "link", "iframe", "noscript", "title", "img"]);
    // Strikethrough — not in turndown core, only its GFM plugin.
    turndown.addRule("strikethrough", {
      filter: (node) => ["DEL", "S", "STRIKE"].includes(node.nodeName),
      replacement: (content) => `~~${content}~~`,
    });
  }
  return turndown;
}

const EMPHASIS_TAGS: Record<"bold" | "italic" | "strike", string[]> = {
  bold: ["STRONG", "B", "H1", "H2", "H3", "H4", "H5", "H6", "TH"],
  italic: ["EM", "I"],
  strike: ["DEL", "S", "STRIKE"],
};

function hasAncestorTag(el: Element, tags: string[]): boolean {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (tags.includes(p.tagName)) return true;
  }
  return false;
}

function wrapChildren(el: Element, tag: string): void {
  const wrapper = el.ownerDocument.createElement(tag);
  while (el.firstChild) wrapper.appendChild(el.firstChild);
  el.appendChild(wrapper);
}

/**
 * Google Docs (and Word) emit `style`-driven markup that turndown can't read:
 * bold/italic runs are `<span style="font-weight:700">` rather than `<strong>`,
 * and the whole selection is wrapped in `<b style="font-weight:normal">` — which
 * turndown would otherwise bold in its entirety. Rewrite inline styling to
 * semantic tags before conversion. Real `<h1>–<h6>` / `<ul>` structure that Docs
 * *does* emit is left alone.
 */
function normalizePastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Unwrap <b>/<strong> that aren't actually bold — the Google Docs / Word
  // selection wrapper (`<b style="font-weight:normal">…</b>`), which turndown
  // would otherwise bold in its entirety. Leave <span>s alone: turndown ignores
  // them, and they may still carry italic/strike style the next pass needs.
  for (const el of Array.from(doc.querySelectorAll<HTMLElement>("b, strong"))) {
    if (/^(normal|[1-4]00)$/.test(el.style.fontWeight)) {
      el.replaceWith(...Array.from(el.childNodes));
    }
  }

  // Promote remaining inline emphasis to <strong>/<em>/<del>.
  for (const el of Array.from(doc.querySelectorAll<HTMLElement>("*"))) {
    if (!el.isConnected) continue;
    const fw = el.style.fontWeight;
    const deco = `${el.style.textDecorationLine} ${el.style.textDecoration}`;
    const bold = fw === "bold" || (/^\d+$/.test(fw) && Number(fw) >= 600);
    const italic = el.style.fontStyle === "italic";
    const strike = deco.includes("line-through");
    if (bold && el.hasChildNodes() && !hasAncestorTag(el, EMPHASIS_TAGS.bold)) wrapChildren(el, "strong");
    if (italic && el.hasChildNodes() && !hasAncestorTag(el, EMPHASIS_TAGS.italic)) wrapChildren(el, "em");
    if (strike && el.hasChildNodes() && !hasAncestorTag(el, EMPHASIS_TAGS.strike)) wrapChildren(el, "del");
    el.removeAttribute("style");
    el.removeAttribute("class");
  }

  return doc.body.innerHTML;
}

let hookInstalled = false;

function ensureHook(): void {
  if (hookInstalled || typeof window === "undefined") return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
  });
  hookInstalled = true;
}

/** Convert clipboard HTML (LinkedIn / Greenhouse / Word / Google Docs …) to Markdown. */
export function htmlToMarkdown(html: string): string {
  const md = getTurndown().turndown(normalizePastedHtml(html));
  return md
    .replace(/[ \t]+$/gm, "") // trailing whitespace turndown leaves between block items
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Render stored Markdown to a sanitized HTML string safe for dangerouslySetInnerHTML. */
export function markdownToSafeHtml(markdown: string): string {
  ensureHook();
  const rawHtml = marked.parse(markdown, { async: false, gfm: true, breaks: true }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
    FORBID_TAGS: ["style", "img"],
    FORBID_ATTR: ["style"],
  });
}
