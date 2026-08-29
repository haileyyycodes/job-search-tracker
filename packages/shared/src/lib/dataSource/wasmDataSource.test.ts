import path from "node:path";
import { describe, expect, it } from "vitest";
import { runDataSourceContractTests } from "./contract";
import { defaultSeed, emptySeed, type Seed } from "./seed";
import { WasmDataSource } from "./wasmDataSource";

// sql.js resolves `locateFile` via fs.readFileSync under Node, not fetch — point it at the
// real file the npm package ships, not the public/ copy the browser build serves.
const wasmPath = path.resolve(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm");
const makeDataSource = (seed: Seed = defaultSeed) => new WasmDataSource(seed, () => wasmPath);

runDataSourceContractTests(() => makeDataSource(emptySeed));

describe("WasmDataSource seed loading", () => {
  it("loads defaultSeed with real relational data and enforces foreign keys natively", async () => {
    const ds = makeDataSource();

    const companies = await ds.getCompanies();
    const northwind = companies.find((c) => c.name === "Northwind Co.")!;
    expect(northwind.locations).toEqual([{ city: "Detroit", state: "MI" }]);

    const applications = await ds.getApplications();
    expect(applications).toHaveLength(defaultSeed.applications.length);

    // nested rows were composed back onto their applications
    const withInterviews = applications.find((a) => a.interviews.length > 0)!;
    expect(withInterviews.statusHistory.length).toBeGreaterThan(1);
    expect(applications.some((a) => a.followUps.length > 0)).toBe(true);

    // every application FK resolves to a real company
    const companyIds = new Set(companies.map((c) => c.id));
    expect(applications.every((a) => companyIds.has(a.companyId))).toBe(true);

    // deleting a company that still has applications is blocked at the SQL level (RESTRICT)
    const companyWithApps = companies.find((c) => applications.some((a) => a.companyId === c.id))!;
    await expect(ds.deleteCompany(companyWithApps.id)).rejects.toThrow();
  });
});
