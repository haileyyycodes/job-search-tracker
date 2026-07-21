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
  },
});
