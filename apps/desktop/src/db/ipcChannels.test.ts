import { describe, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";

// Both preload.ts and ipcHandlers.ts import "electron" at module load for things
// that don't exist outside an Electron runtime. Stub just enough to import them.
const handleCalls: string[] = [];
vi.mock("electron", () => ({
  ipcMain: { handle: (channel: string) => handleCalls.push(channel) },
  contextBridge: { exposeInMainWorld: () => {} },
  ipcRenderer: { invoke: () => Promise.resolve() },
}));

import { registerIpcHandlers } from "./ipcHandlers";
import { ALLOWED_CHANNELS } from "../preload";

/**
 * Regression guard: a resume-file feature shipped with `getResumeFile` /
 * `setResumeFile` on the DataSource and in ElectronDataSource, but the two IPC
 * channels were never registered here or allow-listed in preload — so every call
 * from the renderer was rejected with "Unknown IPC channel". These two lists
 * must stay identical.
 */
describe("IPC channel wiring", () => {
  it("registers exactly the channels preload allow-lists", () => {
    handleCalls.length = 0;
    // registerIpcHandlers only *constructs* the data source (closures); it doesn't
    // touch the db until a channel handler runs, so a bare stub is fine here.
    registerIpcHandlers({} as Database.Database);

    const registered = [...handleCalls].sort();
    const allowed = [...ALLOWED_CHANNELS].sort();

    expect(registered).toEqual(allowed);
    expect(new Set(registered).size).toBe(registered.length); // no dupes
  });
});
