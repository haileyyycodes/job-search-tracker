import { defineConfig } from "vitest/config";

// Node environment (not jsdom) — this exercises real better-sqlite3 + the main-process
// DataSource implementation, not anything DOM-shaped.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
  },
});
