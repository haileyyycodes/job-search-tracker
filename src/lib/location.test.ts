import { describe, expect, it } from "vitest";
import { formatLocation } from "./location";

describe("formatLocation", () => {
  it("returns an empty string when no work arrangement is set", () => {
    expect(formatLocation({})).toBe("");
  });

  it("formats remote as 'Remote' regardless of city/state", () => {
    expect(formatLocation({ workArrangement: "remote", city: "Detroit", state: "MI" })).toBe("Remote");
  });

  it("formats onsite as 'City, State'", () => {
    expect(formatLocation({ workArrangement: "onsite", city: "Detroit", state: "MI" })).toBe("Detroit, MI");
  });

  it("formats onsite with no city/state as an empty string", () => {
    expect(formatLocation({ workArrangement: "onsite" })).toBe("");
  });

  it("formats hybrid with a city/state as 'City, State (Hybrid)'", () => {
    expect(formatLocation({ workArrangement: "hybrid", city: "Detroit", state: "MI" })).toBe("Detroit, MI (Hybrid)");
  });

  it("formats hybrid with no city/state as just 'Hybrid'", () => {
    expect(formatLocation({ workArrangement: "hybrid" })).toBe("Hybrid");
  });

  it("drops a missing state and keeps just the city", () => {
    expect(formatLocation({ workArrangement: "onsite", city: "Detroit" })).toBe("Detroit");
  });
});
