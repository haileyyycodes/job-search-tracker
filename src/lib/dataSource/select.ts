import { MemoryDataSource } from "./memoryDataSource";
import type { DataSource } from "./types";

declare global {
  interface Window {
    electronAPI?: unknown;
  }
}

/**
 * Boot-time DataSource selection. WasmDataSource is dynamically imported so
 * its ~1.5MB sql.js WASM binary never ends up in a bundle that doesn't need
 * it (the Electron branch, once it exists).
 */
export async function selectDataSource(): Promise<DataSource> {
  if (typeof window !== "undefined" && window.electronAPI) {
    // Phase 5 wires the real ElectronDataSource (IPC to the Electron main
    // process) in here. Unreachable today — window.electronAPI doesn't exist yet.
    return new MemoryDataSource();
  }
  const { WasmDataSource } = await import("./wasmDataSource");
  return new WasmDataSource();
}
