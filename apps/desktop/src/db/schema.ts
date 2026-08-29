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
  if (!hasSchema) {
    db.exec(SCHEMA_SQL);
  } else {
    migrate(db);
  }

  return db;
}

/**
 * Additive, idempotent fixups for databases created before a given table or
 * column existed. `openDatabase` only runs the full SCHEMA_SQL once (on a
 * brand-new file), so anything added later needs a matching check here or every
 * pre-existing local DB breaks the moment code starts calling it.
 */
function migrate(db: Database.Database): void {
  const hasUserProfile = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user_profile'")
    .get();
  if (!hasUserProfile) {
    db.exec(`
      CREATE TABLE user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL
      );
      INSERT INTO user_profile (id, name) VALUES (1, '');
    `);
  }

  if (!hasColumn(db, "contacts", "relationship_tier")) {
    db.exec("ALTER TABLE contacts ADD COLUMN relationship_tier TEXT;");
  }
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some((c) => c.name === column);
}
