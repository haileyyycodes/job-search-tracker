import { describe, expect, it } from "vitest";
import {
  compareByOutreachUrgency,
  outreachInfo,
  outreachTiming,
  RELATIONSHIP_TIERS,
} from "./outreach";
import type { Contact, NetworkingEvent } from "./types";

const TODAY = "Jun 1, 2026";

function contact(overrides: Partial<Contact> = {}): Contact {
  return { id: 1, name: "Sam", notes: "", ...overrides };
}

function event(overrides: Partial<NetworkingEvent> = {}): NetworkingEvent {
  return { id: 1, contactIds: [1], type: "Coffee chat", date: "May 1, 2026", notes: "", ...overrides };
}

describe("outreachInfo", () => {
  it("is untracked when the contact has no tier, but still reports the last touchpoint", () => {
    const info = outreachInfo(contact(), [event({ date: "Mar 1, 2026" })], TODAY);
    expect(info.status).toBe("untracked");
    expect(info.tier).toBeNull();
    expect(info.lastContactedOn).toBe("Mar 1, 2026");
    expect(info.reachOutBy).toBeNull();
    expect(info.urgency).toBe(Number.POSITIVE_INFINITY);
  });

  it("is overdue when the contact has a tier but no logged touchpoint", () => {
    const info = outreachInfo(contact({ relationshipTier: "extended" }), [], TODAY);
    expect(info.status).toBe("overdue");
    expect(info.lastContactedOn).toBeNull();
    expect(info.daysUntilDue).toBeNull();
    expect(info.urgency).toBe(Number.NEGATIVE_INFINITY);
  });

  it("is on_track when the last touchpoint is inside the tier's min window", () => {
    const info = outreachInfo(contact({ relationshipTier: "core" }), [event({ date: "May 20, 2026" })], TODAY);
    expect(info.status).toBe("on_track");
    expect(info.daysSinceLastContact).toBe(12);
  });

  it("is due once past minDays but not yet past maxDays", () => {
    const info = outreachInfo(contact({ relationshipTier: "core" }), [event({ date: "Apr 1, 2026" })], TODAY);
    expect(info.status).toBe("due");
    expect(info.daysSinceLastContact).toBe(61);
    expect(info.reachOutBy).toBe("Jun 30, 2026"); // Apr 1 + 90d
    expect(info.daysUntilDue).toBe(RELATIONSHIP_TIERS.core.maxDays - 61);
  });

  it("is overdue once past maxDays", () => {
    const info = outreachInfo(contact({ relationshipTier: "core" }), [event({ date: "Feb 1, 2026" })], TODAY);
    expect(info.status).toBe("overdue");
    expect(info.daysSinceLastContact).toBe(120);
    expect(info.daysUntilDue).toBe(RELATIONSHIP_TIERS.core.maxDays - 120);
  });

  it("uses the most recent qualifying event and ignores events the contact isn't on", () => {
    const events = [
      event({ id: 1, date: "Feb 1, 2026" }),
      event({ id: 2, date: "May 10, 2026" }),
      event({ id: 3, date: "May 25, 2026", contactIds: [99] }),
    ];
    const info = outreachInfo(contact({ relationshipTier: "extended" }), events, TODAY);
    expect(info.lastContactedOn).toBe("May 10, 2026");
  });

  it("widens the window for more distant tiers", () => {
    const events = [event({ date: "Jan 1, 2026" })]; // ~151 days before TODAY
    expect(outreachInfo(contact({ relationshipTier: "core" }), events, TODAY).status).toBe("overdue");
    expect(outreachInfo(contact({ relationshipTier: "extended" }), events, TODAY).status).toBe("due");
    expect(outreachInfo(contact({ relationshipTier: "dormant" }), events, TODAY).status).toBe("on_track");
  });
});

describe("compareByOutreachUrgency", () => {
  it("orders never-contacted first, then most overdue, then untracked last", () => {
    const events: NetworkingEvent[] = [
      event({ id: 1, contactIds: [10], date: "Feb 1, 2026" }), // core -> very overdue
      event({ id: 2, contactIds: [11], date: "May 20, 2026" }), // core -> on track
    ];
    const contacts = [
      contact({ id: 10, relationshipTier: "core" }),
      contact({ id: 11, relationshipTier: "core" }),
      contact({ id: 12, relationshipTier: "core" }), // no touchpoint
      contact({ id: 13 }), // untracked
    ];
    const ordered = [...contacts]
      .sort((a, b) => compareByOutreachUrgency(outreachInfo(a, events, TODAY), outreachInfo(b, events, TODAY)))
      .map((c) => c.id);
    expect(ordered).toEqual([12, 10, 11, 13]);
  });
});

describe("outreachTiming", () => {
  const withEvents = (tier: Contact["relationshipTier"], date: string | undefined) =>
    outreachTiming(outreachInfo(contact({ relationshipTier: tier }), date ? [event({ date })] : [], TODAY));

  it("phrases each state", () => {
    expect(withEvents(undefined, "Mar 1, 2026")).toBe("Set a tier to track");
    expect(withEvents("core", undefined)).toBe("No touchpoints yet");
    expect(withEvents("core", "May 20, 2026")).toBe("Due in 78d");
    expect(withEvents("core", "Feb 1, 2026")).toBe("30d overdue");
  });
});
