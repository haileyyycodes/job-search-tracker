import { afterEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { runDataSourceContractTests } from "../../../../packages/shared/src/lib/dataSource/contract";
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

    // Simulate a DB file created before `user_profile` existed: create it, then drop the
    // table a later schema change added, exactly as if that table had never been there.
    const first = openDatabase(dbPath);
    const company = await createSqliteDataSource(first).createCompany({
      name: "Acme",
      isTarget: false,
      status: "researching",
      notes: "",
    });
    first.exec("DROP TABLE user_profile;");
    first.close();

    const second = openDatabase(dbPath);
    const secondDs = createSqliteDataSource(second);
    expect(await secondDs.getCompanies()).toEqual([company]);
    expect(await secondDs.getUserProfile()).toEqual({ name: "" });
    second.close();
  });
});
