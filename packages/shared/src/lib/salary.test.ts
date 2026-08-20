import { describe, expect, it } from "vitest";
import { formatSalaryRange, getSalaryMatch, salaryMatchColor, salaryMatchLabel } from "./salary";

describe("formatSalaryRange", () => {
  it("formats a full range", () => {
    expect(formatSalaryRange(100_000, 140_000)).toBe("$100,000–$140,000");
  });

  it("formats a min-only range with a trailing +", () => {
    expect(formatSalaryRange(100_000)).toBe("$100,000+");
  });

  it("returns an empty string when neither bound is set", () => {
    expect(formatSalaryRange()).toBe("");
  });

  it("returns an empty string when only max is set", () => {
    expect(formatSalaryRange(undefined, 140_000)).toBe("");
  });
});

describe("getSalaryMatch", () => {
  it("returns null when the goal has no salary minimum", () => {
    expect(getSalaryMatch({ salaryMin: 100_000 }, {})).toBeNull();
  });

  it("returns null when the application has no salary minimum", () => {
    expect(getSalaryMatch({}, { salaryMin: 100_000 })).toBeNull();
  });

  it("returns 'meets' when the application's min is at or above the goal's min", () => {
    expect(getSalaryMatch({ salaryMin: 100_000 }, { salaryMin: 100_000 })).toBe("meets");
    expect(getSalaryMatch({ salaryMin: 120_000 }, { salaryMin: 100_000 })).toBe("meets");
  });

  it("returns 'possible' when the application's max reaches the goal's min", () => {
    expect(getSalaryMatch({ salaryMin: 80_000, salaryMax: 110_000 }, { salaryMin: 100_000 })).toBe("possible");
  });

  it("returns 'possible' when the application's max is unset (uncapped upside)", () => {
    expect(getSalaryMatch({ salaryMin: 80_000 }, { salaryMin: 100_000 })).toBe("possible");
  });

  it("returns 'below' when even the application's max misses the goal's min", () => {
    expect(getSalaryMatch({ salaryMin: 60_000, salaryMax: 90_000 }, { salaryMin: 100_000 })).toBe("below");
  });
});

describe("salaryMatchColor / salaryMatchLabel", () => {
  it("maps each match to a distinct color and label", () => {
    expect(salaryMatchColor("meets")).toBe("var(--green-600)");
    expect(salaryMatchColor("possible")).toBe("var(--yellow-600)");
    expect(salaryMatchColor("below")).toBe("var(--red-600)");
    expect(salaryMatchColor(null)).toBe("var(--text-secondary)");

    expect(salaryMatchLabel("meets")).toBe("Meets goal");
    expect(salaryMatchLabel("possible")).toBe("Possible");
    expect(salaryMatchLabel("below")).toBe("Below goal");
    expect(salaryMatchLabel(null)).toBe("");
  });
});
