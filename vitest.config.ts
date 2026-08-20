import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The `test`/`test:watch` npm scripts run with NODE_OPTIONS=--no-experimental-webstorage:
// Node 22+'s built-in `localStorage` global otherwise shadows jsdom's implementation and
// throws without a --localstorage-file flag, breaking anything under test that touches
// window.localStorage.
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // apps/desktop has its own vitest.config.ts (node environment, no jsdom/react —
    // its tests exercise better-sqlite3 + electron's ipcMain, neither of which belongs here).
    include: ["packages/shared/src/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["packages/shared/src/**/*.{ts,tsx}"],
      skipFull: false,
    },
  },
});
