import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatResponseTime, getDaysAwaitingResponse, getResponseDays } from "./responseTime";
import type { Application, StatusHistoryEntry } from "./types";

function makeApp(statusHistory: StatusHistoryEntry[]): Application {
  return {
    id: "app-1",
    companyId: "company-1",
    role: "Software Engineer",
    dateApplied: "Jul 1, 2026",
    link: "",
    jobDescription: "",
    referral: false,
    resumeType: "tailored",
    coverLetterSubmitted: false,
    notes: "",
    status: statusHistory[statusHistory.length - 1]?.status ?? "todo",
    logo: "",
    statusHistory,
    interviews: [],
    followUps: [],
  };
}

describe("getResponseDays", () => {
  it("returns null when the application hasn't been applied to yet", () => {
    const app = makeApp([{ status: "todo", at: "Jul 1, 2026" }]);
    expect(getResponseDays(app)).toBeNull();
  });

  it("returns null when there's no status change after applying", () => {
    const app = makeApp([{ status: "applied", at: "Jul 1, 2026" }]);
    expect(getResponseDays(app)).toBeNull();
  });

  it("counts days from applying to the next status change", () => {
    const app = makeApp([
      { status: "applied", at: "Jul 1, 2026" },
      { status: "interviewing", at: "Jul 13, 2026" },
    ]);
    expect(getResponseDays(app)).toBe(12);
  });

  it("counts a rejection as a response", () => {
    const app = makeApp([
      { status: "applied", at: "Jul 1, 2026" },
      { status: "rejected_no_interview", at: "Jul 4, 2026" },
    ]);
    expect(getResponseDays(app)).toBe(3);
  });
});

describe("getDaysAwaitingResponse", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when not yet applied", () => {
    const app = makeApp([{ status: "todo", at: "Jul 1, 2026" }]);
    expect(getDaysAwaitingResponse(app)).toBeNull();
  });

  it("returns null once a response has been received", () => {
    const app = makeApp([
      { status: "applied", at: "Jul 1, 2026" },
      { status: "interviewing", at: "Jul 5, 2026" },
    ]);
    expect(getDaysAwaitingResponse(app)).toBeNull();
  });

  it("counts days elapsed since applying while still waiting", () => {
    const app = makeApp([{ status: "applied", at: "Jul 1, 2026" }]);
    expect(getDaysAwaitingResponse(app)).toBe(9);
  });
});

describe("formatResponseTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is undefined before applying", () => {
    const app = makeApp([{ status: "todo", at: "Jul 1, 2026" }]);
    expect(formatResponseTime(app)).toBeUndefined();
  });

  it("pluralizes a single day of response time", () => {
    const app = makeApp([
      { status: "applied", at: "Jul 1, 2026" },
      { status: "interviewing", at: "Jul 2, 2026" },
    ]);
    expect(formatResponseTime(app)).toBe("1 day");
  });

  it("formats multiple days of response time", () => {
    const app = makeApp([
      { status: "applied", at: "Jul 1, 2026" },
      { status: "interviewing", at: "Jul 4, 2026" },
    ]);
    expect(formatResponseTime(app)).toBe("3 days");
  });

  it("flags an application still awaiting response", () => {
    const app = makeApp([{ status: "applied", at: "Jul 1, 2026" }]);
    expect(formatResponseTime(app)).toBe("9 days (awaiting response)");
  });
});
