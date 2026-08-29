import { contextBridge, ipcRenderer } from "electron";

/** Must match the channel names ipcHandlers.ts registers exactly. */
const ALLOWED_CHANNELS = new Set([
  "applications:list",
  "applications:create",
  "applications:edit",
  "applications:updateStatus",
  "applications:delete",
  "applications:saveFeedback",
  "interviews:log",
  "interviews:edit",
  "interviews:delete",
  "followUps:log",
  "followUps:delete",
  "companies:list",
  "companies:create",
  "companies:edit",
  "companies:delete",
  "companies:toggleTarget",
  "contacts:list",
  "contacts:create",
  "contacts:edit",
  "contacts:delete",
  "networkingEvents:list",
  "networkingEvents:add",
  "networkingEvents:edit",
  "networkingEvents:delete",
  "goals:get",
  "goals:update",
  "userProfile:get",
  "userProfile:update",
  "interviewCategories:list",
  "interviewCategories:add",
  "interviewPrep:list",
  "interviewPrep:add",
  "interviewPrep:edit",
  "interviewPrep:delete",
  "elevatorPitch:list",
  "elevatorPitch:add",
  "elevatorPitch:edit",
  "elevatorPitch:delete",
]);

/**
 * Exposes window.electronAPI to the renderer — matches the ElectronApi interface in
 * packages/shared's electronDataSource.ts. Only channels ipcHandlers.ts actually
 * registers are invokable; anything else is rejected here before it reaches IPC.
 */
contextBridge.exposeInMainWorld("electronAPI", {
  invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    if (!ALLOWED_CHANNELS.has(channel)) return Promise.reject(new Error(`Unknown IPC channel: ${channel}`));
    return ipcRenderer.invoke(channel, ...args);
  },
});
