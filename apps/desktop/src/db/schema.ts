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
  if (!hasTable(db, "user_profile")) {
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

  // Interview Prep (1408d75) and Elevator Pitch Builder (16eaa53) each added a
  // table to SCHEMA_SQL. Any DB file created before those commits never gets
  // them otherwise, and useTrackerData's boot-time Promise.all fails the whole
  // load — the app shows no data at all — the first time it calls
  // interviewPrep:list / elevatorPitch:list.
  if (!hasTable(db, "interview_prep_questions")) {
    db.exec(`
      CREATE TABLE interview_prep_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        section TEXT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        starred INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  if (!hasTable(db, "elevator_pitch_versions")) {
    db.exec(`
      CREATE TABLE elevator_pitch_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        setting TEXT NOT NULL,
        who TEXT NOT NULL,
        person_name TEXT NOT NULL,
        role TEXT NOT NULL,
        identity TEXT NOT NULL,
        situation TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        themes TEXT NOT NULL,
        synthesis TEXT NOT NULL,
        seeking TEXT NOT NULL,
        closing_question TEXT NOT NULL,
        source_question_id INTEGER REFERENCES interview_prep_questions(id) ON DELETE SET NULL
      );
    `);
  }
}

function hasTable(db: Database.Database, table: string): boolean {
  return (
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table) !== undefined
  );
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some((c) => c.name === column);
}
