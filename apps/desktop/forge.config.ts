import fs from "node:fs";
import path from "node:path";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

// npm workspaces hoist better-sqlite3 to the repo-root node_modules, so it's never present
// under apps/desktop/node_modules — the directory @electron/packager actually copies into the
// packaged app. esbuild also can't inline it (native .node binary, see build.mjs), so without
// this hook the packaged app would launch to a "Cannot find module 'better-sqlite3'" crash.
// Copied in here instead, post-copy, straight from the root install.
function copyBetterSqlite3(buildPath: string, _electronVersion: string, _platform: string, _arch: string, callback: (err?: Error) => void): void {
  const source = path.join(__dirname, "../../node_modules/better-sqlite3");
  const dest = path.join(buildPath, "node_modules/better-sqlite3");
  fs.cpSync(source, dest, { recursive: true });
  callback();
}

// apps/web's static export (see apps/web's build:electron script) lives in a sibling
// workspace, so — same as better-sqlite3 above — @electron/packager never picks it up on its
// own. main.ts resolves it via app.isPackaged: process.resourcesPath/app.asar/web-export in
// a packaged build, or the monorepo-relative apps/web/out path in dev.
function copyWebExport(buildPath: string, _electronVersion: string, _platform: string, _arch: string, callback: (err?: Error) => void): void {
  const source = path.join(__dirname, "../web/out");
  if (!fs.existsSync(source)) {
    callback(new Error(`apps/web static export not found at ${source}. Run "npm run build:electron --workspace=apps/web" first.`));
    return;
  }
  const dest = path.join(buildPath, "web-export");
  fs.cpSync(source, dest, { recursive: true });
  callback();
}

// Local, unsigned distribution for v1 (see docs/local-first-architecture.md) — a .dmg for a
// normal drag-to-Applications install, a .zip as a fallback for other platforms.
const config: ForgeConfig = {
  packagerConfig: {
    // Electron Packager derives the packaged app's folder/bundle name from packagerConfig.name
    // (falling back to package.json's "name" otherwise) — the scoped npm name
    // "@job-tracker/desktop" contains a "/" that breaks output-path derivation, so it's
    // overridden here with a plain display name.
    name: "Job Tracker",
    // Bundle icon — the web favicon (yellow sparkle) on a black rounded square.
    // Extensionless: packager appends .icns on macOS, .ico on Windows. Regenerate
    // from assets/icon.svg with assets/generate-icons.mjs.
    icon: path.join(__dirname, "assets/icon"),
    // better-sqlite3's compiled .node binary can't live inside the asar archive (native
    // modules can't dlopen from inside it) — Electron transparently redirects reads for
    // anything matching this glob to an app.asar.unpacked sibling directory instead.
    asar: { unpack: "**/node_modules/better-sqlite3/**/*.node" },
    afterCopy: [copyBetterSqlite3, copyWebExport],
  },
  rebuildConfig: {},
  makers: [new MakerDMG({}, ["darwin"]), new MakerZIP({}, ["linux", "win32"])],
  plugins: [
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
