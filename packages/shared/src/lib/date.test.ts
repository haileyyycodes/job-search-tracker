import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  bucketByCalendarWeek,
  daysBetween,
  daysUntil,
  formatDateInput,
  isInCurrentCalendarMonth,
  isInCurrentCalendarWeek,
  isWithinDateRange,
  startOfCalendarWeek,
  todayFormatted,
  toDateInputValue,
} from "./date";

describe("formatDateInput", () => {
  it("formats a YYYY-MM-DD value as a short display date", () => {
    expect(formatDateInput("2026-07-15")).toBe("Jul 15, 2026");
  });

  it("returns an empty string for an empty value", () => {
    expect(formatDateInput("")).toBe("");
  });
});

describe("toDateInputValue", () => {
  it("reverses formatDateInput", () => {
    expect(toDateInputValue("Jul 15, 2026")).toBe("2026-07-15");
  });

  it("returns an empty string for an empty value", () => {
    expect(toDateInputValue("")).toBe("");
  });
});

describe("addDays", () => {
  it("adds days within the same month", () => {
    expect(addDays("Jul 15, 2026", 3)).toBe("Jul 18, 2026");
  });

  it("rolls over a month boundary", () => {
    expect(addDays("Jul 30, 2026", 3)).toBe("Aug 2, 2026");
  });

  it("supports negative offsets", () => {
    expect(addDays("Jul 15, 2026", -20)).toBe("Jun 25, 2026");
  });
});

describe("isWithinDateRange", () => {
  it("is true when both bounds are unset", () => {
    expect(isWithinDateRange("Jul 15, 2026", "", "")).toBe(true);
  });

  it("is true when the date falls within an inclusive range", () => {
    expect(isWithinDateRange("Jul 15, 2026", "2026-07-15", "2026-07-15")).toBe(true);
  });

  it("is false when the date is before the lower bound", () => {
    expect(isWithinDateRange("Jul 14, 2026", "2026-07-15", "")).toBe(false);
  });

  it("is false when the date is after the upper bound", () => {
    expect(isWithinDateRange("Jul 16, 2026", "", "2026-07-15")).toBe(false);
  });
});

describe("daysUntil / daysBetween", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("daysUntil is 0 for today", () => {
    expect(daysUntil("Jul 15, 2026")).toBe(0);
  });

  it("daysUntil is positive for a future date", () => {
    expect(daysUntil("Jul 20, 2026")).toBe(5);
  });

  it("daysUntil is negative for a past date", () => {
    expect(daysUntil("Jul 10, 2026")).toBe(-5);
  });

  it("daysBetween measures the gap between two dates", () => {
    expect(daysBetween("Jul 10, 2026", "Jul 15, 2026")).toBe(5);
  });

  it("daysBetween is negative when `to` precedes `from`", () => {
    expect(daysBetween("Jul 15, 2026", "Jul 10, 2026")).toBe(-5);
  });
});

describe("todayFormatted", () => {
  it("matches the current system date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15));
    expect(todayFormatted()).toBe("Jul 15, 2026");
    vi.useRealTimers();
  });
});

describe("startOfCalendarWeek", () => {
  it("returns the same date for a Monday", () => {
    const monday = new Date(2026, 6, 13); // Jul 13, 2026 is a Monday
    expect(startOfCalendarWeek(monday)).toEqual(new Date(2026, 6, 13));
  });

  it("returns the preceding Monday for a mid-week date", () => {
    const wednesday = new Date(2026, 6, 15);
    expect(startOfCalendarWeek(wednesday)).toEqual(new Date(2026, 6, 13));
  });

  it("treats Sunday as the end of its week, not the start", () => {
    const sunday = new Date(2026, 6, 19);
    expect(startOfCalendarWeek(sunday)).toEqual(new Date(2026, 6, 13));
  });
});

describe("isInCurrentCalendarWeek", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15)); // Wednesday, week of Jul 13-19
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is true for another day in the same Monday-Sunday week", () => {
    expect(isInCurrentCalendarWeek("Jul 19, 2026")).toBe(true);
  });

  it("is false for a day in the following week", () => {
    expect(isInCurrentCalendarWeek("Jul 20, 2026")).toBe(false);
  });

  it("is false for a day in the previous week", () => {
    expect(isInCurrentCalendarWeek("Jul 12, 2026")).toBe(false);
  });
});

describe("isInCurrentCalendarMonth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is true for another day in the same month and year", () => {
    expect(isInCurrentCalendarMonth("Jul 1, 2026")).toBe(true);
  });

  it("is false for the same month in a different year", () => {
    expect(isInCurrentCalendarMonth("Jul 1, 2025")).toBe(false);
  });

  it("is false for a different month", () => {
    expect(isInCurrentCalendarMonth("Aug 1, 2026")).toBe(false);
  });
});

describe("bucketByCalendarWeek", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Wednesday of the week of Jul 13-19, 2026.
    vi.setSystemTime(new Date(2026, 6, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("produces one bucket per requested week, oldest first, ending with the current week", () => {
    const buckets = bucketByCalendarWeek([], 3);
    expect(buckets.map((b) => b.label)).toEqual(["Jun 29", "Jul 6", "Jul 13"]);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });

  it("counts dates into the calendar week that contains them", () => {
    const buckets = bucketByCalendarWeek(["Jul 14, 2026", "Jul 19, 2026", "Jul 8, 2026"], 3);
    const [weekOfJun29, weekOfJul6, weekOfJul13] = buckets;
    expect(weekOfJun29.count).toBe(0);
    expect(weekOfJul6.count).toBe(1);
    expect(weekOfJul13.count).toBe(2);
  });

  it("ignores dates outside the requested window and empty strings", () => {
    const buckets = bucketByCalendarWeek(["", "Jan 1, 2020"], 2);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(0);
  });
});
