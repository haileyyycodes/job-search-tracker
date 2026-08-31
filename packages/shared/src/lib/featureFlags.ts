/**
 * Build-time feature flags. Each is off unless its `NEXT_PUBLIC_*` env var is set
 * to "1" or "true" — Next inlines these at build time for both the web build and
 * the Electron static export, so there's no runtime `process` access in the
 * browser. Vitest runs under Node where `process` exists; the `typeof` guard
 * keeps this safe everywhere.
 */
function flag(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

/**
 * Resume file upload + storage (desktop only). While off: the upload control
 * still renders, disabled, with an explanatory caption; nothing is stored or
 * downloaded.
 */
export const RESUME_UPLOAD_ENABLED = flag(
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_RESUME_UPLOAD : undefined
);
