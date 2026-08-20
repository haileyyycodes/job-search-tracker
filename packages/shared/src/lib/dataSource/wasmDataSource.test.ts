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
    const productDesigner = applications.find((a) => a.role === "Product Designer")!;
    expect(productDesigner.companyId).toBe(northwind.id);
    expect(productDesigner.interviews).toHaveLength(1);
    expect(productDesigner.followUps).toHaveLength(1);
    expect(productDesigner.statusHistory).toHaveLength(2);

    // deleting Northwind should be blocked at the SQL level (RESTRICT), same as MemoryDataSource
    await expect(ds.deleteCompany(northwind.id)).rejects.toThrow();
  });
});
