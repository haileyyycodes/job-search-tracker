/**
 * Browser-only resume-file helpers: turning a picked `File` into a validated,
 * base64-encoded `ResumeFile`, and triggering a download of stored bytes.
 * Imported only from React components — never from the Electron main process
 * (which has no DOM lib); shared pure logic lives in `resumeFile.ts`.
 */
import type { ResumeFile, ResumeFileMeta } from "@/lib/types";
import {
  ALLOWED_RESUME_EXTENSIONS,
  MAX_RESUME_BYTES,
  bytesToBase64,
  detectResumeSignature,
  formatFileSize,
  resumeExtension,
  sanitizeResumeName,
} from "@/lib/resumeFile";

export type ResumeValidationResult =
  | { ok: true; file: ResumeFile }
  | { ok: false; error: string };

/**
 * Validate a user-picked file and encode it for storage. The content signature
 * is the real gate; extension is checked alongside; the browser-reported MIME is
 * only a soft cross-check (browsers report `.doc` inconsistently).
 */
export async function validateResumeFile(file: File): Promise<ResumeValidationResult> {
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  if (file.size > MAX_RESUME_BYTES) {
    return { ok: false, error: `File is too large — keep it under ${formatFileSize(MAX_RESUME_BYTES)}.` };
  }

  const ext = resumeExtension(file.name);
  if (!ALLOWED_RESUME_EXTENSIONS.includes(ext as (typeof ALLOWED_RESUME_EXTENSIONS)[number])) {
    return { ok: false, error: "Use a PDF or Word document (.pdf, .doc, .docx)." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectResumeSignature(bytes);
  if (!kind) {
    return { ok: false, error: "That doesn't look like a real PDF or Word document." };
  }
  // The extension has to be consistent with what the bytes actually are.
  if ((kind === "pdf") !== (ext === ".pdf")) {
    return { ok: false, error: "The file contents don't match its extension." };
  }

  return {
    ok: true,
    file: {
      name: sanitizeResumeName(file.name, kind),
      mimeType: file.type || "application/octet-stream",
      size: bytes.length,
      data: bytesToBase64(bytes),
    },
  };
}

/**
 * Hand stored bytes to the user as a download. Served as a neutral
 * `application/octet-stream` blob so nothing tries to render/execute it inline,
 * with a sanitized filename. CSP-safe (blob: is same-origin) and behaves the
 * same inside the Electron renderer.
 */
export function downloadResumeFile(meta: ResumeFileMeta, base64: string): void {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = sanitizeResumeName(meta.name);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // let the click dispatch before revoking
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
