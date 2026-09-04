import { defineConfig } from "vitest/config";

// Node environment (not jsdom) — this exercises real better-sqlite3 and the
// server-side DataSource implementation and API route, not anything DOM-shaped.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
  },
});
