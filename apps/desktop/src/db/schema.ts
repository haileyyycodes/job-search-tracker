import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "../../../../packages/shared/src/lib/dataSource/schema";

export { SCHEMA_SQL };

/**
 * Opens (creating if needed) a SQLite file at `dbPath`, enables foreign key
 * enforcement, and runs the schema if the file is new/empty. `dbPath` can also
 * be `:memory:` for tests.
 */
export function openDatabase(dbPath: string): Database.Database {
  if (dbPath !== ":memory:") fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  const hasSchema = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'applications'")
    .get();
  if (!hasSchema) db.exec(SCHEMA_SQL);

  return db;
}
