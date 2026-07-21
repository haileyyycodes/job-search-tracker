import { describe, expect, it } from "vitest";
import { isValidEmail, isValidUrl } from "./validation";

describe("isValidUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("https://example.com/path?query=1")).toBe(true);
  });

  it("rejects javascript: URLs even though they parse", () => {
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: URLs even though they parse", () => {
    expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects strings that aren't valid URLs at all", () => {
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts a plausible email address", () => {
    expect(isValidEmail("person@example.com")).toBe(true);
  });

  it("rejects addresses missing an @ or a domain", () => {
    expect(isValidEmail("person.example.com")).toBe(false);
    expect(isValidEmail("person@")).toBe(false);
  });

  it("rejects strings containing whitespace", () => {
    expect(isValidEmail("person @example.com")).toBe(false);
  });
});
