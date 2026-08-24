import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getApplicationChannel,
  getChannelBreakdown,
  getDaysSinceActivity,
  getFunnelApps,
  getInterviewRatio,
  getInterviewRatioTier,
  getOfferRatio,
  getResponseRate,
  getStaleApplications,
  hasReplied,
  reachedInterview,
  reachedOffer,
} from "./funnel";
import type { Application, ApplicationStatus, Interview, NetworkingEvent, StatusHistoryEntry } from "./types";

let nextId = 1;

function makeApp(overrides: Partial<Application> & { statusHistory: StatusHistoryEntry[] }): Application {
  const { statusHistory, ...rest } = overrides;
  return {
    id: nextId++,
    companyId: 1,
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
    ...rest,
  };
}

function history(...statuses: ApplicationStatus[]): StatusHistoryEntry[] {
  return statuses.map((status, i) => ({ status, at: `Jul ${i + 1}, 2026` }));
}

describe("hasReplied", () => {
  it("is false before applying", () => {
    expect(hasReplied(makeApp({ statusHistory: history("todo") }))).toBe(false);
  });

  it("is false with no reply yet", () => {
    expect(hasReplied(makeApp({ statusHistory: history("applied") }))).toBe(false);
  });

  it("is false for a pure self-initiated withdrawal", () => {
    expect(hasReplied(makeApp({ statusHistory: history("applied", "withdrawn") }))).toBe(false);
  });

  it("is true once interviewing is reached, even if later withdrawn", () => {
    expect(hasReplied(makeApp({ statusHistory: history("applied", "interviewing", "withdrawn") }))).toBe(true);
  });

  it("counts a rejection as a reply", () => {
    expect(hasReplied(makeApp({ statusHistory: history("applied", "rejected_no_interview") }))).toBe(true);
  });
});

describe("reachedInterview / reachedOffer", () => {
  it("reachedInterview is true regardless of later status", () => {
    const app = makeApp({ statusHistory: history("applied", "interviewing", "rejected_after_interview") });
    expect(reachedInterview(app)).toBe(true);
  });

  it("reachedOffer is true even if the offer was later declined", () => {
    const app = makeApp({ statusHistory: history("applied", "interviewing", "offer_extended", "offer_declined") });
    expect(reachedOffer(app)).toBe(true);
  });

  it("reachedOffer is false without an offer_extended entry", () => {
    expect(reachedOffer(makeApp({ statusHistory: history("applied", "interviewing") }))).toBe(false);
  });
});

describe("getFunnelApps", () => {
  it("excludes todo applications", () => {
    const todo = makeApp({ statusHistory: history("todo") });
    expect(getFunnelApps([todo])).toEqual([]);
  });

  it("excludes a pure self-withdrawal with no prior reply", () => {
    const withdrawn = makeApp({ statusHistory: history("applied", "withdrawn") });
    expect(getFunnelApps([withdrawn])).toEqual([]);
  });

  it("keeps a withdrawal that happened after a real reply", () => {
    const withdrawnAfterInterview = makeApp({ statusHistory: history("applied", "interviewing", "withdrawn") });
    expect(getFunnelApps([withdrawnAfterInterview])).toEqual([withdrawnAfterInterview]);
  });

  it("keeps plain applied and interviewing applications", () => {
    const applied = makeApp({ statusHistory: history("applied") });
    expect(getFunnelApps([applied])).toEqual([applied]);
  });
});

describe("getResponseRate / getInterviewRatio / getOfferRatio", () => {
  it("returns null when there's no funnel yet", () => {
    expect(getResponseRate([])).toBeNull();
    expect(getInterviewRatio([])).toBeNull();
    expect(getOfferRatio([])).toBeNull();
  });

  it("computes rates across a mixed set of applications", () => {
    const apps = [
      makeApp({ statusHistory: history("applied") }), // no reply
      makeApp({ statusHistory: history("applied", "rejected_no_interview") }), // reply, no interview
      makeApp({ statusHistory: history("applied", "interviewing") }), // interview, no offer
      makeApp({ statusHistory: history("applied", "interviewing", "offer_extended", "offer_accepted") }), // offer
    ];
    expect(getResponseRate(apps)).toBe(75); // 3 of 4 replied
    expect(getInterviewRatio(apps)).toBe(50); // 2 of 4 interviewed
    expect(getOfferRatio(apps)).toBe(50); // 1 of 2 interviewed apps got an offer
  });

  it("excludes pure self-withdrawals from every ratio", () => {
    const apps = [
      makeApp({ statusHistory: history("applied", "interviewing") }),
      makeApp({ statusHistory: history("applied", "withdrawn") }),
    ];
    expect(getResponseRate(apps)).toBe(100);
    expect(getInterviewRatio(apps)).toBe(100);
  });

  it("offer ratio is null when no interviews have been reached", () => {
    const apps = [makeApp({ statusHistory: history("applied") })];
    expect(getOfferRatio(apps)).toBeNull();
  });
});

describe("getInterviewRatioTier", () => {
  it("classifies healthy, at-risk, and critical bands", () => {
    expect(getInterviewRatioTier(10)).toBe("healthy");
    expect(getInterviewRatioTier(9)).toBe("at_risk");
    expect(getInterviewRatioTier(3)).toBe("at_risk");
    expect(getInterviewRatioTier(2)).toBe("critical");
    expect(getInterviewRatioTier(0)).toBe("critical");
  });

  it("is null when there's no ratio to classify", () => {
    expect(getInterviewRatioTier(null)).toBeNull();
  });
});

describe("getApplicationChannel", () => {
  it("is referral when flagged, regardless of networking events", () => {
    const app = makeApp({ statusHistory: history("applied"), referral: true });
    expect(getApplicationChannel(app, [])).toBe("referral");
  });

  it("is warm when a networking event is linked to this application", () => {
    const app = makeApp({ statusHistory: history("applied") });
    const event: NetworkingEvent = { id: 1, contactIds: [], type: "Coffee chat", date: "Jul 1, 2026", applicationId: app.id, notes: "" };
    expect(getApplicationChannel(app, [event])).toBe("warm");
  });

  it("is cold when no networking event is linked to this specific application", () => {
    const app = makeApp({ statusHistory: history("applied") });
    const otherApp = makeApp({ statusHistory: history("applied") });
    const event: NetworkingEvent = { id: 1, contactIds: [], type: "Coffee chat", date: "Jul 1, 2026", applicationId: otherApp.id, notes: "" };
    expect(getApplicationChannel(app, [event])).toBe("cold");
  });

  it("is cold with no referral and no networking events at all", () => {
    const app = makeApp({ statusHistory: history("applied") });
    expect(getApplicationChannel(app, [])).toBe("cold");
  });
});

describe("getChannelBreakdown", () => {
  it("segments interview ratio by channel over the funnel-apps base", () => {
    const referred = makeApp({ statusHistory: history("applied", "interviewing"), referral: true });
    const cold1 = makeApp({ statusHistory: history("applied") });
    const cold2 = makeApp({ statusHistory: history("applied", "interviewing") });
    const todoApp = makeApp({ statusHistory: history("todo"), referral: true });

    const rows = getChannelBreakdown([referred, cold1, cold2, todoApp], []);
    const byChannel = Object.fromEntries(rows.map((r) => [r.channel, r]));

    expect(byChannel.referral.count).toBe(1);
    expect(byChannel.referral.interviewRatio).toBe(100);
    expect(byChannel.cold.count).toBe(2);
    expect(byChannel.cold.interviewRatio).toBe(50);
    expect(byChannel.warm.count).toBe(0);
    expect(byChannel.warm.interviewRatio).toBeNull();
  });
});

describe("getDaysSinceActivity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 20));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is null with no activity dates at all", () => {
    const app = makeApp({ statusHistory: [] });
    expect(getDaysSinceActivity(app)).toBeNull();
  });

  it("uses the most recent status history entry", () => {
    const app = makeApp({ statusHistory: history("applied", "interviewing") });
    expect(getDaysSinceActivity(app)).toBe(18); // most recent entry is "Jul 2, 2026"
  });

  it("counts a later interview date as more recent than status history", () => {
    const app = makeApp({ statusHistory: history("applied") });
    app.interviews = [{ id: 1, type: "Recruiter Screen", date: "Jul 15, 2026", notes: "" } satisfies Interview];
    expect(getDaysSinceActivity(app)).toBe(5);
  });

  it("counts a later follow-up date as more recent than everything else", () => {
    const app = makeApp({ statusHistory: history("applied") });
    app.interviews = [{ id: 1, type: "Recruiter Screen", date: "Jul 5, 2026", notes: "" } satisfies Interview];
    app.followUps = [{ id: 1, date: "Jul 18, 2026", contactId: 1, notes: "" }];
    expect(getDaysSinceActivity(app)).toBe(2);
  });
});

describe("getStaleApplications", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 20));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("only includes applied and interviewing applications", () => {
    const applied = makeApp({ statusHistory: history("applied") });
    const interviewing = makeApp({ statusHistory: history("applied", "interviewing") });
    const rejected = makeApp({ statusHistory: history("applied", "rejected_no_interview") });
    const todoApp = makeApp({ statusHistory: history("todo") });

    const stale = getStaleApplications([applied, interviewing, rejected, todoApp], 10);
    expect(stale.map((s) => s.app.id).sort()).toEqual([applied.id, interviewing.id].sort());
  });

  it("sorts most-stale first and respects the limit", () => {
    const recent = makeApp({ statusHistory: [{ status: "applied", at: "Jul 18, 2026" }] });
    const stalest = makeApp({ statusHistory: [{ status: "applied", at: "Jul 1, 2026" }] });
    const middle = makeApp({ statusHistory: [{ status: "applied", at: "Jul 10, 2026" }] });

    const result = getStaleApplications([recent, stalest, middle], 2);
    expect(result.map((s) => s.app.id)).toEqual([stalest.id, middle.id]);
    expect(result[0].daysSinceActivity).toBe(19);
  });
});
