import { describe, expect, it } from "vitest";
import { HTTP_DB_CHANNELS } from "@/lib/dataSource/httpDataSource";
import { CHANNELS } from "./route";

/**
 * Regression guard: HttpDataSource (packages/shared) and this route's CHANNELS
 * map are two independently maintained string lists on either side of an HTTP
 * boundary — a typo or a rename on only one side fails silently as "Unknown
 * channel" at runtime, not at compile time. These must stay identical.
 */
describe("db API channel wiring", () => {
  it("registers exactly the channels HttpDataSource expects", () => {
    const registered = Object.keys(CHANNELS).sort();
    const expected = [...HTTP_DB_CHANNELS].sort();

    expect(registered).toEqual(expected);
    expect(new Set(registered).size).toBe(registered.length); // no dupes
  });
});
