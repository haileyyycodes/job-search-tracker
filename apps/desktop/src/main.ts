import { app, BrowserWindow } from "electron";
import http, { type Server } from "node:http";
import fs from "node:fs";
import path from "node:path";
import serveHandler from "serve-handler";
import { openDatabase } from "./db/schema";
import { registerIpcHandlers } from "./db/ipcHandlers";

// apps/web/src/app builds its static export to apps/web/out (see apps/web's
// build:electron script). Not copied into apps/desktop's own directory yet —
// Phase 6 (packaging) decides how that lands in a real packaged app; for now
// this resolves the monorepo-relative path directly.
const STATIC_EXPORT_DIR = path.join(__dirname, "../../web/out");

// Root-relative asset paths (/_next/...) that Next's static export emits don't
// resolve correctly under file://, and client-side routing needs a real origin
// to navigate against — so this serves the export over a local HTTP server
// instead of loading the HTML file directly, same as any other Next+Electron
// integration does.
function startStaticServer(): Promise<{ server: Server; port: number }> {
  if (!fs.existsSync(STATIC_EXPORT_DIR)) {
    throw new Error(
      `Static export not found at ${STATIC_EXPORT_DIR}. Run "npm run build:electron --workspace=apps/web" first.`
    );
  }
  const server = http.createServer((req, res) => {
    void serveHandler(req, res, { public: STATIC_EXPORT_DIR, cleanUrls: true });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("Failed to determine static server port"));
        return;
      }
      resolve({ server, port: address.port });
    });
  });
}

function getDbPath(): string {
  // Dev mode: a throwaway file next to the repo, never your real data — same
  // code path as production, just a different path, per the architecture doc.
  if (!app.isPackaged) return path.join(__dirname, "../dev-data/job-tracker-dev.db");
  return path.join(app.getPath("userData"), "job-tracker.db");
}

async function createWindow(): Promise<void> {
  const db = openDatabase(getDbPath());
  registerIpcHandlers(db);

  const { port } = await startStaticServer();

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(() => {
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
