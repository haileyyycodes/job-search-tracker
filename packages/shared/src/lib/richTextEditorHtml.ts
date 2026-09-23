/**
 * Sanitize + plain-text helpers for fields authored with `RichTextEditor` (Tiptap,
 * restricted to paragraphs/headings (H1-H3), bold/italic/underline/strikethrough, and
 * bulleted/numbered lists) — the Story write-up and the interview-prep STAR answer.
 * Unlike the job-description/résumé fields in `richText.ts` (which store Markdown),
 * these fields store the editor's HTML output directly — mirrors the quick-meal-planner
 * project's recipe notes/instructions fields.
 *
 * Browser-only: DOMPurify needs a DOM. Only ever called from "use client" components,
 * in response to user interaction (never during server render).
 */
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "h1", "h2", "h3"];

/** Sanitize Tiptap's HTML output before persisting — defense in depth against any future
 * render path that trusts stored content, or content that arrived outside the editor UI. */
export function sanitizeRichTextHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}

/** Strip markup down to plain text, preserving paragraph/list-item breaks as newlines
 * (suitable for a `white-space: pre-wrap` display). Inserts a break at each block tag
 * first, so adjacent blocks (`</p><p>`) don't run their text together — `textContent`
 * alone concatenates them with nothing between. Callers that need a single line (list
 * previews, search matching) should additionally `.replace(/\s+/g, " ")`. */
export function richTextHtmlToPlainText(html: string): string {
  const spaced = html.replace(/<\/(p|li|ul|ol|h1|h2|h3)>/gi, "</$1>\n").replace(/<br\s*\/?>/gi, "\n");
  const text =
    typeof DOMParser === "undefined"
      ? spaced.replace(/<[^>]+>/g, "")
      : (new DOMParser().parseFromString(spaced, "text/html").body.textContent ?? "");
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/** True if the editor content has no visible text (an "empty" Tiptap doc still
 * serializes to `<p></p>`, so a plain `.trim().length` check on the HTML is wrong). */
export function isRichTextEmpty(html: string): boolean {
  return richTextHtmlToPlainText(html).trim().length === 0;
}

const LOOKS_LIKE_RICH_TEXT_HTML = /<\/?(p|br|strong|em|u|s|ul|ol|li|h1|h2|h3)[ >]/i;

/**
 * Upgrades a legacy plain-text value (possibly multi-line, from before this field used
 * `RichTextEditor`) to HTML, preserving line breaks as `<br>`. A no-op if the value
 * already looks like rich-text HTML.
 *
 * Without this, a plain string handed straight to Tiptap gets parsed as HTML: raw `\n`
 * characters survive in the text node but render collapsed to nothing (default
 * `white-space: normal`), so a multi-paragraph note visually runs together as one line.
 */
export function ensureRichTextHtml(value: string): string {
  if (!value || LOOKS_LIKE_RICH_TEXT_HTML.test(value)) return value;
  const escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
}
