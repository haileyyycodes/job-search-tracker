import { describe, expect, it } from "vitest";
import { runDataSourceContractTests } from "./contract";
import { MemoryDataSource } from "./memoryDataSource";
import { defaultSeed, emptySeed } from "./seed";

runDataSourceContractTests(() => new MemoryDataSource(emptySeed));

describe("MemoryDataSource seed loading", () => {
  it("loads defaultSeed with remapped numeric ids and preserved relationships", async () => {
    const ds = new MemoryDataSource(defaultSeed);

    const companies = await ds.getCompanies();
    const contacts = await ds.getContacts();
    const applications = await ds.getApplications();
    const events = await ds.getNetworkingEvents();

    expect(companies).toHaveLength(defaultSeed.companies.length);
    expect(contacts).toHaveLength(defaultSeed.contacts.length);
    expect(applications).toHaveLength(defaultSeed.applications.length);
    expect(events).toHaveLength(defaultSeed.networkingEvents.length);
    expect(await ds.getElevatorPitchVersions()).toHaveLength(defaultSeed.elevatorPitchVersions.length);

    const northwind = companies.find((c) => c.name === "Northwind Co.")!;
    expect(northwind.locations).toEqual([{ city: "Detroit", state: "MI" }]);
    expect(contacts.find((c) => c.name === "Alex Chen")!.companyId).toBe(northwind.id);

    // every string placeholder id was remapped to a numeric one, and every FK still resolves
    const companyIds = new Set(companies.map((c) => c.id));
    const contactIds = new Set(contacts.map((c) => c.id));
    for (const a of applications) {
      expect(typeof a.id).toBe("number");
      expect(companyIds.has(a.companyId)).toBe(true);
      if (a.referredByContactId != null) expect(contactIds.has(a.referredByContactId)).toBe(true);
      for (const f of a.followUps) expect(contactIds.has(f.contactId)).toBe(true);
    }
    for (const e of events) for (const cid of e.contactIds) expect(contactIds.has(cid)).toBe(true);

    // the composed nested shapes came through
    expect(applications.some((a) => a.interviews.length > 0)).toBe(true);
    expect(applications.some((a) => a.followUps.length > 0)).toBe(true);
    expect(applications.some((a) => a.referredByContactId != null)).toBe(true);
    expect(applications.every((a) => a.statusHistory.length > 0)).toBe(true);

    expect(await ds.getGoals()).toEqual(defaultSeed.goals);
    expect(await ds.getInterviewCategories()).toEqual(defaultSeed.interviewCategories);
  });
});
