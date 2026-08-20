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
});
