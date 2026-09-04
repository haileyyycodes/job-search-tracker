import os from "node:os";
import path from "node:path";
import type { DataSource } from "@/lib/dataSource/types";
import { openDatabase } from "./schema";
import { createSqliteDataSource } from "./sqliteDataSource";

/**
 * Same file across dev and `next start` — one real database on disk, not one
 * per run mode. Overridable so tests (and anyone who wants a different
 * location) don't have to touch this file.
 */
function getDbPath(): string {
  return process.env.JOB_TRACKER_DB_PATH ?? path.join(os.homedir(), ".job-tracker", "job-tracker.db");
}

let dataSource: DataSource | undefined;

/** Lazily opens the on-disk SQLite file once per server process. */
export function getDataSource(): DataSource {
  if (!dataSource) dataSource = createSqliteDataSource(openDatabase(getDbPath()));
  return dataSource;
}
