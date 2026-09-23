import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "@/lib/dataSource/schema";

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

  // Interview Prep (1408d75) added a table to SCHEMA_SQL. Any DB file created
  // before that commit never gets it otherwise, and useTrackerData's boot-time
  // Promise.all fails the whole load — the app shows no data at all — the
  // first time it calls interviewPrep:list.
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

  // Elevator Pitch Builder (16eaa53) — removed, feature dropped. Drop the table
  // from any DB file that still has it from before that removal.
  if (hasTable(db, "elevator_pitch_versions")) {
    db.exec("DROP TABLE elevator_pitch_versions;");
  }

  // Stories (added later) — a standalone table, same story as the one above: a
  // DB file created before this commit never gets it, and useTrackerData's
  // boot-time Promise.all fails the first time it calls stories:list.
  if (!hasTable(db, "stories")) {
    db.exec(`
      CREATE TABLE stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        date TEXT,
        to_date TEXT
      );
    `);
  }

  // Story date range (added later).
  if (!hasColumn(db, "stories", "date")) {
    db.exec("ALTER TABLE stories ADD COLUMN date TEXT;");
  }
  if (!hasColumn(db, "stories", "to_date")) {
    db.exec("ALTER TABLE stories ADD COLUMN to_date TEXT;");
  }

  // Pasted resume text (added later). Replaces an earlier file-upload attempt —
  // drop that table if a DB still has it.
  if (!hasColumn(db, "applications", "resume_text")) {
    db.exec("ALTER TABLE applications ADD COLUMN resume_text TEXT;");
  }
  if (hasTable(db, "resume_files")) {
    db.exec("DROP TABLE resume_files;");
  }

  // Pasted cover-letter text (added later).
  if (!hasColumn(db, "applications", "cover_letter_text")) {
    db.exec("ALTER TABLE applications ADD COLUMN cover_letter_text TEXT;");
  }

  // Inbound vs. outbound (added later). Backfills every pre-existing
  // application to "inbound" via the column default.
  if (!hasColumn(db, "applications", "source")) {
    db.exec("ALTER TABLE applications ADD COLUMN source TEXT NOT NULL DEFAULT 'inbound';");
  }

  // Linking a contact to an interview (added later).
  if (!hasColumn(db, "interviews", "contact_id")) {
    db.exec("ALTER TABLE interviews ADD COLUMN contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL;");
  }

  // Prep questions to ask the interviewer (added later).
  if (!hasColumn(db, "interviews", "questions_to_ask")) {
    db.exec("ALTER TABLE interviews ADD COLUMN questions_to_ask TEXT;");
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
