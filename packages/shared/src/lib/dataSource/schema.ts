/**
 * Normalized SQLite schema shared by WasmDataSource (sql.js, in-browser) and,
 * later, ElectronDataSource (better-sqlite3). Foreign key actions are enforced
 * natively by SQLite itself (with `PRAGMA foreign_keys = ON`, set by whoever
 * opens the connection) rather than hand-rolled in JS:
 *
 *  - applications.company_id: RESTRICT — a company with applications can't be deleted
 *  - follow_ups.contact_id:   RESTRICT — a contact with follow-ups can't be deleted
 *  - everything else optional: SET NULL (referrals, contact's company, event's application,
 *    a pitch version's source prep question)
 *  - application/company/event children (interviews, follow_ups, status_history,
 *    company_locations, networking_event_contacts): CASCADE
 */
export const SCHEMA_SQL = `
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  is_target INTEGER NOT NULL,
  status TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  notes TEXT NOT NULL
);

CREATE TABLE company_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT NOT NULL
);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linked_in_url TEXT,
  website TEXT,
  company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  role TEXT,
  relationship_tier TEXT,
  notes TEXT NOT NULL
);

CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  role TEXT NOT NULL,
  date_applied TEXT NOT NULL,
  link TEXT NOT NULL,
  job_description TEXT NOT NULL,
  referral INTEGER NOT NULL,
  referred_by_contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  resume_type TEXT NOT NULL,
  cover_letter_submitted INTEGER NOT NULL,
  notes TEXT NOT NULL,
  status TEXT NOT NULL,
  logo TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  work_arrangement TEXT,
  city TEXT,
  state TEXT,
  feedback_text TEXT,
  feedback_date TEXT
);

CREATE TABLE interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  style TEXT,
  categories TEXT,
  questions_asked TEXT,
  notes TEXT NOT NULL
);

CREATE TABLE follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  notes TEXT NOT NULL
);

CREATE TABLE status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  at TEXT NOT NULL
);

CREATE TABLE networking_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
  notes TEXT NOT NULL
);

CREATE TABLE networking_event_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES networking_events(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE goals (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  salary_min INTEGER,
  salary_max INTEGER,
  applications_per_week_target INTEGER,
  target_offer_date TEXT
);

CREATE TABLE interview_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL
);

CREATE TABLE interview_prep_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  section TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  starred INTEGER NOT NULL DEFAULT 0
);

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

INSERT INTO goals (id) VALUES (1);
INSERT INTO user_profile (id, name) VALUES (1, '');
`;
