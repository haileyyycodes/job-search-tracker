import { app, BrowserWindow } from "electron";
import path from "node:path";

/**
 * Placeholder shell — just proves the Electron app boots. Phase 5 replaces
 * this with real IPC handlers (ElectronDataSource's better-sqlite3 backend)
 * and loads apps/web's static export instead of this inline placeholder.
 */
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(
    "data:text/html,<title>Job Tracker</title><body style='font:14px system-ui;padding:40px'>Electron shell boots. Static export wiring lands in a later phase.</body>"
  );
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
