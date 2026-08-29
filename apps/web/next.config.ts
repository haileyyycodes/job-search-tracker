import type { NextConfig } from "next";
import path from "path";

// The app is fully self-contained (no external scripts, styles, fonts, images,
// or network calls), so the CSP can allowlist 'self' only. 'unsafe-inline' is
// required for Next.js's bootstrap scripts and React inline style attributes.
// 'wasm-unsafe-eval' is required in every environment: the tracker's data layer
// is SQLite compiled to WebAssembly (sql.js), and browsers gate
// WebAssembly.instantiate() behind this directive (or the far broader
// 'unsafe-eval'). It permits WASM compilation only, not JS eval().
// 'unsafe-eval' proper is dev-only: React dev mode uses eval() for debugging
// features; production builds never do, so the deployed policy stays strict.
const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
];

// The Electron build needs `output: "export"` (static HTML/JS/CSS, no Next server —
// Electron just loads the files off disk). Static export can't serve custom headers
// at runtime (there's no server to apply them), so headers() is Vercel-only; Electron
// gets its CSP-equivalent restrictions from its own BrowserWindow/session config instead.
const isStaticExport = process.env.BUILD_TARGET === "export";

const nextConfig: NextConfig = {
  turbopack: {
    // Monorepo root (two levels up from apps/web), not just this app's own directory —
    // Turbopack needs this to resolve and transpile packages/shared/src, which apps/web
    // reaches via a raw "@/*" tsconfig path alias rather than a real package import.
    root: path.join(__dirname, "../.."),
  },
  ...(isStaticExport
    ? { output: "export" }
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: securityHeaders,
            },
          ];
        },
      }),
};

export default nextConfig;
