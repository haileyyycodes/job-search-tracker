import type { DataSource } from "./types";

/**
 * Boot-time DataSource selection. Two audiences, one shared codebase:
 * NEXT_PUBLIC_DEMO_MODE is set only in the Vercel project's env vars, for the
 * portfolio demo (fake seed data, in-memory, resets on refresh). Everywhere
 * else — `npm run dev`, `npm start` on your own machine — it's unset, so the
 * app talks to the local Next.js server's real SQLite-backed /api/db route
 * instead, and your data persists across restarts.
 *
 * WasmDataSource is dynamically imported so its ~1.5MB sql.js WASM binary
 * never ends up in a bundle that doesn't need it.
 */
export async function selectDataSource(): Promise<DataSource> {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    const { HttpDataSource } = await import("./httpDataSource");
    return new HttpDataSource();
  }
  const { WasmDataSource } = await import("./wasmDataSource");
  return new WasmDataSource();
}
