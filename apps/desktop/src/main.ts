import { app, BrowserWindow } from "electron";
import http, { type Server } from "node:http";
import fs from "node:fs";
import path from "node:path";
import serveHandler from "serve-handler";
import { openDatabase } from "./db/schema";
import { registerIpcHandlers } from "./db/ipcHandlers";

// Electron otherwise falls back to package.json's "name" for app.getName() (and by
// extension the userData directory), which for this scoped workspace package is
// "@job-tracker/desktop" — literally a folder named "@job-tracker" would be created
// under Application Support. Set explicitly, before app is ready, so it takes effect
// everywhere (userData path, window title bar default, etc).
app.setName("Job Tracker");

// apps/web/src/app builds its static export to apps/web/out (see apps/web's
// build:electron script). forge.config.ts's copyWebExport hook copies it to
// <packaged app>/Resources/app.asar/web-export for packaged builds; in dev
// (unpackaged, running straight from the monorepo) it's read from apps/web/out directly.
const STATIC_EXPORT_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "app.asar", "web-export")
  : path.join(__dirname, "../../web/out");

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
  // Same file in dev and packaged builds — app.setName() above makes
  // app.getPath("userData") resolve identically either way, so there's only
  // ever one real database on disk instead of two that silently diverge.
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
