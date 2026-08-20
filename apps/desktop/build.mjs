import * as esbuild from "esbuild";

// Plain `tsc` only type-checks and emits — it doesn't bundle, so it can't resolve
// imports that reach into packages/shared/src (those only exist as TypeScript
// source, never compiled to a standalone .js file on disk). esbuild bundles them
// inline instead, the same way Turbopack does for apps/web, just via a real
// bundler this time since main/preload run under plain Node, not Next's tooling.
//
// electron and better-sqlite3 stay external: electron is provided by the Electron
// runtime itself, and better-sqlite3 ships a native .node binary that can't be
// inlined into a JS bundle — it has to stay a real require() resolved from
// node_modules at runtime.
const shared = {
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  external: ["electron", "better-sqlite3"],
  sourcemap: true,
};

await Promise.all([
  esbuild.build({ ...shared, entryPoints: ["src/main.ts"], outfile: "dist/main.js" }),
  esbuild.build({ ...shared, entryPoints: ["src/preload.ts"], outfile: "dist/preload.js" }),
]);
