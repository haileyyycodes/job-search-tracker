import { afterEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { runDataSourceContractTests } from "@/lib/dataSource/contract";
import { createSqliteDataSource } from "./sqliteDataSource";
import { openDatabase } from "./schema";

const openDbs: Database.Database[] = [];

function makeDataSource() {
  const db = openDatabase(":memory:");
  openDbs.push(db);
  return createSqliteDataSource(db);
}

afterEach(() => {
  while (openDbs.length) openDbs.pop()!.close();
});

runDataSourceContractTests(makeDataSource);

describe("createSqliteDataSource against a real SQLite file", () => {
  it("starts empty on first run (no seed data) and persists across separate connections to the same file", async () => {
    const dbPath = `${process.env.TMPDIR ?? "/tmp"}/job-tracker-sqlite-contract-${Date.now()}.db`;

    const first = openDatabase(dbPath);
    const firstDs = createSqliteDataSource(first);
    expect(await firstDs.getApplications()).toEqual([]);
    expect(await firstDs.getCompanies()).toEqual([]);

    const company = await firstDs.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
    first.close();

    const second = openDatabase(dbPath);
    const secondDs = createSqliteDataSource(second);
    const companies = await secondDs.getCompanies();
    expect(companies).toEqual([company]);
    second.close();
  });

  it("adds tables introduced after a DB file was created, without touching existing data", async () => {
    const dbPath = `${process.env.TMPDIR ?? "/tmp"}/job-tracker-sqlite-migrate-${Date.now()}.db`;

    // Simulate a DB file created before `user_profile` and `interview_prep_questions`
    // existed: create it, then drop the tables later schema changes added, exactly as
    // if they had never been there.
    const first = openDatabase(dbPath);
    const firstDs = createSqliteDataSource(first);
    const company = await firstDs.createCompany({
      name: "Acme",
      isTarget: false,
      status: "researching",
      notes: "",
    });
    // A pre-existing application from before the "source" column existed —
    // used below to confirm migrate() backfills it to "inbound".
    const preExistingApp = await firstDs.createApplication({
      companyId: company.id,
      role: "Designer",
      dateApplied: "Jan 1, 2026",
      link: "",
      jobDescription: "",
      referral: false,
      source: "outbound",
      resumeType: "tailored",
      coverLetterSubmitted: false,
      notes: "",
      status: "applied",
      logo: "A",
      statusHistory: [],
    });
    // A pre-existing story from before the "date"/"to_date" columns existed —
    // used below to confirm migrate() adds them without losing this row.
    const preExistingStory = await firstDs.addStory({ title: "Old story", content: "", tags: [] });
    // A pre-existing interview from before the "questions_to_ask" column existed —
    // used below to confirm migrate() adds it without losing this row.
    const preExistingInterview = await firstDs.logInterview(preExistingApp.id, {
      type: "Recruiter Screen",
      date: "Jan 2, 2026",
      notes: "",
    });
    first.exec("DROP TABLE interview_prep_questions;");
    first.exec("DROP TABLE user_profile;");
    first.exec("ALTER TABLE applications DROP COLUMN resume_text;");
    first.exec("ALTER TABLE applications DROP COLUMN cover_letter_text;");
    first.exec("ALTER TABLE applications DROP COLUMN source;");
    first.exec("ALTER TABLE stories DROP COLUMN date;");
    first.exec("ALTER TABLE stories DROP COLUMN to_date;");
    first.exec("ALTER TABLE interviews DROP COLUMN questions_to_ask;");
    first.close();

    const second = openDatabase(dbPath);
    const secondDs = createSqliteDataSource(second);
    expect(await secondDs.getCompanies()).toEqual([company]);
    expect(await secondDs.getUserProfile()).toEqual({ name: "" });
    // These would throw "no such table" if migrate() hadn't re-created them, which is
    // exactly what breaks useTrackerData's boot-time Promise.all for pre-existing DBs.
    expect(await secondDs.getInterviewPrepQuestions()).toEqual([]);
    // The pre-existing story survives the column-add migration, with the new columns unset.
    expect(await secondDs.getStories()).toEqual([preExistingStory]);
    const storyWithDates = await secondDs.addStory({
      title: "New story",
      content: "",
      tags: [],
      date: "Jan 5, 2026",
      toDate: "Mar 12, 2026",
    });
    expect(storyWithDates.date).toBe("Jan 5, 2026");
    expect(storyWithDates.toDate).toBe("Mar 12, 2026");
    // The pre-existing interview survives the column-add migration too.
    const appsAfterMigration = await secondDs.getApplications();
    const migratedInterview = appsAfterMigration
      .flatMap((a) => a.interviews)
      .find((i) => i.id === preExistingInterview.id)!;
    expect(migratedInterview.questionsToAsk).toBeUndefined();
    await secondDs.editInterview(preExistingApp.id, preExistingInterview.id, {
      ...preExistingInterview,
      questionsToAsk: "What's the team's biggest challenge right now?",
    });
    const [afterEdit] = await secondDs.getApplications();
    expect(afterEdit.interviews.find((i) => i.id === preExistingInterview.id)!.questionsToAsk).toBe(
      "What's the team's biggest challenge right now?"
    );
    // resume_text / cover_letter_text are re-added too — no "no such column"
    const app = await secondDs.createApplication({
      companyId: company.id,
      role: "Engineer",
      dateApplied: "Jan 1, 2026",
      link: "",
      jobDescription: "",
      referral: false,
      source: "outbound",
      resumeType: "tailored",
      coverLetterSubmitted: false,
      notes: "",
      status: "applied",
      logo: "A",
      statusHistory: [],
    });
    await secondDs.editApplication({ ...app, resumeText: "Jane Doe — Engineer", coverLetterText: "Dear team," });
    const applications = await secondDs.getApplications();
    const migrated = applications.find((a) => a.id === app.id)!;
    expect(migrated.resumeText).toBe("Jane Doe — Engineer");
    expect(migrated.coverLetterText).toBe("Dear team,");
    // The pre-existing application (created before "source" existed) is backfilled to "inbound".
    const backfilled = applications.find((a) => a.id === preExistingApp.id)!;
    expect(backfilled.source).toBe("inbound");
    second.close();
  });

  it("drops the elevator_pitch_versions table from a DB file that still has it", async () => {
    const dbPath = `${process.env.TMPDIR ?? "/tmp"}/job-tracker-sqlite-drop-pitch-${Date.now()}.db`;

    // Simulate a DB file from before the elevator pitch feature was removed: create a
    // fresh DB (current SCHEMA_SQL, no pitch table), then hand-add the table the old
    // schema used to create, exactly as if it had survived from an older version.
    const first = openDatabase(dbPath);
    first.exec(`
      CREATE TABLE elevator_pitch_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
    `);
    first.exec("INSERT INTO elevator_pitch_versions (name) VALUES ('Career fair');");
    first.close();

    const second = openDatabase(dbPath);
    const hasTable = second
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'elevator_pitch_versions'")
      .get();
    expect(hasTable).toBeUndefined();
    second.close();
  });
});
