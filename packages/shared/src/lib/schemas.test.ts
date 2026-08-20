import { z } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import { salvageArray, salvageObject } from "./schemas";

const itemSchema = z.object({ id: z.string(), name: z.string() });
type Item = z.infer<typeof itemSchema>;

const fallbackItems: Item[] = [{ id: "fallback", name: "Fallback" }];

describe("salvageArray", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps every item when all are valid", () => {
    const sanitize = salvageArray(itemSchema, fallbackItems);
    const input = [
      { id: "1", name: "One" },
      { id: "2", name: "Two" },
    ];
    expect(sanitize("key-a", input)).toEqual(input);
  });

  it("drops only the records that fail validation", () => {
    const sanitize = salvageArray(itemSchema, fallbackItems);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const input = [{ id: "1", name: "One" }, { id: "2" /* missing name */ }, { id: "3", name: "Three" }];
    expect(sanitize("key-b", input)).toEqual([
      { id: "1", name: "One" },
      { id: "3", name: "Three" },
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("falls back wholesale when the stored value isn't an array", () => {
    const sanitize = salvageArray(itemSchema, fallbackItems);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(sanitize("key-c", { not: "an array" })).toEqual(fallbackItems);
    expect(sanitize("key-c-2", null)).toEqual(fallbackItems);
  });

  it("warns only once per storage key even across repeated sanitize calls", () => {
    const sanitize = salvageArray(itemSchema, fallbackItems);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const badInput = [{ id: "1" }];
    sanitize("key-d", badInput);
    sanitize("key-d", badInput);
    sanitize("key-d", badInput);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("salvageObject", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const fallback: Item = { id: "fallback", name: "Fallback" };

  it("returns the parsed value when it matches the schema", () => {
    const sanitize = salvageObject(itemSchema, fallback);
    const valid = { id: "1", name: "One" };
    expect(sanitize("key-e", valid)).toEqual(valid);
  });

  it("returns the fallback and warns when the value fails validation", () => {
    const sanitize = salvageObject(itemSchema, fallback);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(sanitize("key-f", { id: "1" })).toEqual(fallback);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
