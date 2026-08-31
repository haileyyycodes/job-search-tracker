/**
 * Shared, environment-agnostic helpers for resume-file handling. No DOM/browser
 * references — this module is imported by the Electron main process
 * (apps/desktop/src/db/ipcHandlers.ts) as well as the browser, so it must
 * type-check under a Node-only lib. Browser-only pieces (File validation, the
 * download trigger) live in `resumeUpload.ts`.
 *
 * Security model: a resume file is treated as opaque bytes end to end. It is
 * never parsed, executed, or rendered in-app — only validated on the way in and
 * handed back to the user as a download. We do NOT scan for macros / embedded
 * scripts inside the document; the mitigation is that the app never opens it.
 */

export const MAX_RESUME_BYTES = 2 * 1024 * 1024; // 2 MB

export type ResumeKind = "pdf" | "doc" | "docx";

export const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

export const ALLOWED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const EXTENSION_BY_KIND: Record<ResumeKind, string> = {
  pdf: ".pdf",
  doc: ".doc",
  docx: ".docx",
};

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Sniff the real file type from its leading bytes. This — not the extension or
 * the browser-reported MIME — is the gate: it defeats `evil.html` renamed to
 * `resume.pdf`.
 *
 * Note the DOCX (ZIP) and DOC (OLE2) signatures are shared with other Office /
 * archive formats (xlsx, pptx, xls, …). That's an accepted limitation: the file
 * is still only ever returned to the user as a download, and the extension
 * allowlist is checked alongside this.
 */
export function detectResumeSignature(bytes: Uint8Array): ResumeKind | null {
  // %PDF-
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf";
  // OLE2 compound file (legacy .doc): D0 CF 11 E0 A1 B1 1A E1
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "doc";
  // ZIP local file header (.docx and every other OOXML/zip): PK\x03\x04 / PK\x05\x06 / PK\x07\x08
  if (
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
  ) {
    return "docx";
  }
  return null;
}

export function extensionForResumeKind(kind: ResumeKind): string {
  return EXTENSION_BY_KIND[kind];
}

export function resumeExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

/**
 * Reduce an arbitrary (possibly hostile) filename to a safe display/download
 * name: basename only, no control chars or dots inside the stem, single spaces,
 * length-capped, and the extension forced to match the detected signature.
 */
export function sanitizeResumeName(name: string, kind?: ResumeKind): string {
  // Take the last path segment (defeats "../../etc/passwd").
  const segments = name.split(/[\\/]/);
  let base = (segments[segments.length - 1] ?? "").trim();

  base = base.replace(/[\x00-\x1f\x7f]/g, ""); // control chars

  // Drop any existing extension; we re-append a known-good one.
  const dot = base.lastIndexOf(".");
  if (dot > 0) base = base.slice(0, dot);

  // No dots in the stem (blocks "resume.pdf.exe"-style tricks), collapse
  // whitespace, and trim leading punctuation/space.
  base = base
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+/, "")
    .trim();

  if (!base) base = "resume";
  if (base.length > 100) base = base.slice(0, 100).trim();

  return base + (kind ? extensionForResumeKind(kind) : "");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---- base64 (works in browser and Node; avoids spreading large arrays) ----

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Server-side (and defense-in-depth client-side) revalidation of already-encoded
 * bytes: enforces the size cap and the signature allowlist. Throws on violation.
 */
export function assertValidResumeBytes(bytes: Uint8Array): ResumeKind {
  if (bytes.length === 0) throw new Error("Resume file is empty.");
  if (bytes.length > MAX_RESUME_BYTES) {
    throw new Error(`Resume file is too large (max ${formatFileSize(MAX_RESUME_BYTES)}).`);
  }
  const kind = detectResumeSignature(bytes);
  if (!kind) throw new Error("Resume file is not a valid PDF or Word document.");
  return kind;
}
