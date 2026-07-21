import { describe, expect, it } from "vitest";
import { companyName, displayedCompanyStatus, formatCompanyLocations } from "./companies";
import type { Company } from "./types";

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "company-1",
    name: "Acme Corp",
    isTarget: true,
    status: "researching",
    locations: [],
    notes: "",
    ...overrides,
  };
}

describe("companyName", () => {
  const companies = [makeCompany({ id: "c1", name: "Acme Corp" })];

  it("resolves a known companyId to its name", () => {
    expect(companyName("c1", companies)).toBe("Acme Corp");
  });

  it("falls back to 'Unknown company' for an undefined id", () => {
    expect(companyName(undefined, companies)).toBe("Unknown company");
  });

  it("falls back to 'Unknown company' for a dangling id", () => {
    expect(companyName("does-not-exist", companies)).toBe("Unknown company");
  });
});

describe("formatCompanyLocations", () => {
  it("joins multiple locations with a middle dot", () => {
    const company = makeCompany({
      locations: [
        { city: "Detroit", state: "MI" },
        { city: "Austin", state: "TX" },
      ],
    });
    expect(formatCompanyLocations(company)).toBe("Detroit, MI · Austin, TX");
  });

  it("returns an empty string when there are no locations", () => {
    expect(formatCompanyLocations(makeCompany({ locations: [] }))).toBe("");
  });

  it("drops empty city/state fields within a location", () => {
    const company = makeCompany({ locations: [{ city: "Detroit", state: "" }] });
    expect(formatCompanyLocations(company)).toBe("Detroit");
  });
});

describe("displayedCompanyStatus", () => {
  it("surfaces the full pipeline status for target companies", () => {
    expect(displayedCompanyStatus(makeCompany({ isTarget: true, status: "watching" }))).toBe("watching");
  });

  it("surfaces 'applied' for non-target companies that have been applied to", () => {
    expect(displayedCompanyStatus(makeCompany({ isTarget: false, status: "applied" }))).toBe("applied");
  });

  it("hides pre-application statuses for non-target companies", () => {
    expect(displayedCompanyStatus(makeCompany({ isTarget: false, status: "researching" }))).toBeNull();
    expect(displayedCompanyStatus(makeCompany({ isTarget: false, status: "watching" }))).toBeNull();
    expect(displayedCompanyStatus(makeCompany({ isTarget: false, status: "not_pursuing" }))).toBeNull();
  });
});
