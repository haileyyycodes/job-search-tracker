import { describe, expect, it } from "vitest";
import { runDataSourceContractTests } from "./contract";
import { MemoryDataSource } from "./memoryDataSource";
import { defaultSeed, emptySeed } from "./seed";

runDataSourceContractTests(() => new MemoryDataSource(emptySeed));

describe("MemoryDataSource seed loading", () => {
  it("loads defaultSeed with remapped numeric ids and preserved relationships", async () => {
    const ds = new MemoryDataSource(defaultSeed);

    const companies = await ds.getCompanies();
    expect(companies).toHaveLength(2);
    const northwind = companies.find((c) => c.name === "Northwind Co.")!;
    expect(northwind.locations).toEqual([{ city: "Detroit", state: "MI" }]);

    const contacts = await ds.getContacts();
    expect(contacts).toHaveLength(1);
    expect(contacts[0].companyId).toBe(northwind.id);

    const applications = await ds.getApplications();
    expect(applications).toHaveLength(2);
    const productDesigner = applications.find((a) => a.role === "Product Designer")!;
    expect(productDesigner.companyId).toBe(northwind.id);
    expect(productDesigner.referredByContactId).toBe(contacts[0].id);
    expect(productDesigner.interviews).toHaveLength(1);
    expect(productDesigner.followUps).toEqual([{ id: expect.any(Number), date: "Jun 25, 2026", contactId: contacts[0].id, notes: "Checked in on timeline." }]);

    const tasks = await ds.getTasks();
    expect(tasks).toHaveLength(1);
    const feEngineer = applications.find((a) => a.role === "Senior Frontend Engineer")!;
    expect(tasks[0].applicationId).toBe(feEngineer.id);

    const events = await ds.getNetworkingEvents();
    expect(events).toHaveLength(1);
    expect(events[0].contactIds).toEqual([contacts[0].id]);
    expect(events[0].applicationId).toBe(productDesigner.id);

    expect(await ds.getGoals()).toEqual(defaultSeed.goals);
    expect(await ds.getInterviewCategories()).toEqual(defaultSeed.interviewCategories);
  });

  it("resetToSeedData clears everything created since construction and reloads the seed", async () => {
    const ds = new MemoryDataSource(defaultSeed);
    await ds.createCompany({ name: "Extra Co", isTarget: false, status: "researching", notes: "" });
    expect(await ds.getCompanies()).toHaveLength(3);

    await ds.resetToSeedData();

    const companies = await ds.getCompanies();
    expect(companies).toHaveLength(2);
    expect(companies.some((c) => c.name === "Extra Co")).toBe(false);
  });
});
