import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next's Next-specific rules (e.g. no-html-link-for-pages) auto-detect the
  // app directory relative to cwd, which breaks now that the app lives under apps/web.
  { settings: { next: { rootDir: "apps/web" } } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    // vitest coverage output:
    "coverage/**",
  ]),
]);

export default eslintConfig;
