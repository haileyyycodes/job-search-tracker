"use strict";

// extract-zip (yauzl under the hood) silently stops partway through extracting the
// Electron zip in this environment — deterministic across Node 24 and Node 26, with and
// without the sandbox, always right after the first non-trivial binary entry. The system
// `unzip` binary extracts the exact same archive correctly and instantly, so this shim
// swaps extract-zip's implementation for a shell-out to `unzip` (wired in via npm
// `overrides` in the root package.json). Only used by @electron/packager during local
// `electron-forge package`/`make` — never shipped in the app itself.
const { execFile } = require("node:child_process");
const fs = require("node:fs/promises");

module.exports = async function extract(zipPath, opts) {
  const dir = opts && opts.dir;
  if (!dir) throw new Error("extract-zip shim: opts.dir is required");
  await fs.mkdir(dir, { recursive: true });
  await new Promise((resolve, reject) => {
    execFile(
      "unzip",
      ["-q", "-o", zipPath, "-d", dir],
      { maxBuffer: 1024 * 1024 * 64 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`unzip failed: ${error.message}\n${stderr}`));
          return;
        }
        resolve();
      }
    );
  });
};
