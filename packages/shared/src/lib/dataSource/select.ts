import type { DataSource } from "./types";

/**
 * Boot-time DataSource selection. WasmDataSource is dynamically imported so
 * its ~1.5MB sql.js WASM binary never ends up in the Electron bundle, which
 * doesn't need it. ElectronDataSource is dynamically imported too — it's a
 * thin wrapper (no native module inside), but keeping the import dynamic
 * avoids evaluating window.electronAPI-touching code in non-Electron builds.
 */
export async function selectDataSource(): Promise<DataSource> {
  if (typeof window !== "undefined" && window.electronAPI) {
    const { ElectronDataSource } = await import("./electronDataSource");
    return new ElectronDataSource();
  }
  const { WasmDataSource } = await import("./wasmDataSource");
  return new WasmDataSource();
}
