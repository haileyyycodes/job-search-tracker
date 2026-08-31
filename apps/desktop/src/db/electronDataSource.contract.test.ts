import { afterEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import {
  runDataSourceContractTests,
  runResumeFileContractTests,
} from "../../../../packages/shared/src/lib/dataSource/contract";
import { createSqliteDataSource } from "./ipcHandlers";
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
runResumeFileContractTests(makeDataSource);

describe("createSqliteDataSource against a real SQLite file", () => {
  it("starts empty on first run (no seed data) and persists across separate connections to the same file", async () => {
    const dbPath = `${process.env.TMPDIR ?? "/tmp"}/job-tracker-electron-contract-${Date.now()}.db`;

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
    const dbPath = `${process.env.TMPDIR ?? "/tmp"}/job-tracker-electron-migrate-${Date.now()}.db`;

    // Simulate a DB file created before `user_profile`, `interview_prep_questions`, and
    // `elevator_pitch_versions` existed: create it, then drop the tables later schema
    // changes added, exactly as if they had never been there.
    const first = openDatabase(dbPath);
    const company = await createSqliteDataSource(first).createCompany({
      name: "Acme",
      isTarget: false,
      status: "researching",
      notes: "",
    });
    first.exec("DROP TABLE elevator_pitch_versions;");
    first.exec("DROP TABLE interview_prep_questions;");
    first.exec("DROP TABLE user_profile;");
    first.exec("DROP TABLE resume_files;");
    first.close();

    const second = openDatabase(dbPath);
    const secondDs = createSqliteDataSource(second);
    expect(await secondDs.getCompanies()).toEqual([company]);
    expect(await secondDs.getUserProfile()).toEqual({ name: "" });
    // These would throw "no such table" if migrate() hadn't re-created them, which is
    // exactly what breaks useTrackerData's boot-time Promise.all for pre-existing DBs.
    expect(await secondDs.getInterviewPrepQuestions()).toEqual([]);
    expect(await secondDs.getElevatorPitchVersions()).toEqual([]);
    // resume_files is re-created too, so attaching a file doesn't hit "no such table"
    const app = await secondDs.createApplication({
      companyId: company.id,
      role: "Engineer",
      dateApplied: "Jan 1, 2026",
      link: "",
      jobDescription: "",
      referral: false,
      resumeType: "tailored",
      coverLetterSubmitted: false,
      notes: "",
      status: "applied",
      logo: "A",
      statusHistory: [],
    });
    await secondDs.setResumeFile(app.id, {
      name: "r.pdf",
      mimeType: "application/pdf",
      size: 10,
      data: Buffer.from("%PDF-1.4\n\n").toString("base64"),
    });
    expect((await secondDs.getResumeFile(app.id))?.name).toBe("r.pdf");
    second.close();
  });
});
