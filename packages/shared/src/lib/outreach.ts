import type { Contact, NetworkingEvent, RelationshipTier } from "./types";
import { addDays, daysBetween, todayFormatted } from "./date";

/**
 * Networking cadence model. Each relationship tier carries a recommended
 * reach-out window: `minDays` is when a touchpoint starts being worthwhile,
 * `maxDays` is the point past which the relationship is going cold. Derived
 * entirely from logged networking events — see `outreachInfo`.
 */
export interface TierCadence {
  /** Label for the tier itself. */
  label: string;
  /** Human phrasing of the recommended cadence, e.g. "every 1–3 months". */
  cadence: string;
  /** Days after the last touchpoint that a reach-out becomes worthwhile. */
  minDays: number;
  /** Days after the last touchpoint past which the relationship is going cold. */
  maxDays: number;
  /** One-liner on what a good touchpoint looks like for this tier. */
  tip: string;
}

export const RELATIONSHIP_TIERS: Record<RelationshipTier, TierCadence> = {
  core: {
    label: "Core",
    cadence: "every 1–3 months",
    minDays: 30,
    maxDays: 90,
    tip: "Mentors and close peers. Share a quick update or ask a specific, low-stakes question — a short chat or coffee keeps the bond warm.",
  },
  extended: {
    label: "Extended",
    cadence: "2–4 times a year",
    minDays: 90,
    maxDays: 180,
    tip: "Acquaintances and past colleagues. Lead with a reason: a relevant article, congrats on a job change, a brief update. Skip generic check-ins.",
  },
  dormant: {
    label: "Dormant",
    cadence: "every 6–12 months",
    minDays: 180,
    maxDays: 365,
    tip: "Inactive ties. Reconnect with a warm note that references a shared experience so it doesn't read as out of the blue.",
  },
};

export const relationshipTierOptions: { value: RelationshipTier; label: string }[] = [
  { value: "core", label: "Core — mentors & close peers" },
  { value: "extended", label: "Extended — acquaintances & past colleagues" },
  { value: "dormant", label: "Dormant — inactive ties" },
];

export type OutreachStatus = "on_track" | "due" | "overdue" | "untracked";

export const OUTREACH_STATUS_META: Record<OutreachStatus, { label: string; tone: "danger" | "warn" | "ok" | "muted" }> = {
  overdue: { label: "Overdue", tone: "danger" },
  due: { label: "Due", tone: "warn" },
  on_track: { label: "On track", tone: "ok" },
  untracked: { label: "No tier", tone: "muted" },
};

export interface OutreachInfo {
  status: OutreachStatus;
  tier: RelationshipTier | null;
  /** Display date of the most recent networking event this contact was part of. */
  lastContactedOn: string | null;
  daysSinceLastContact: number | null;
  /** `lastContactedOn` + `tier.maxDays`; null when untracked or never contacted. */
  reachOutBy: string | null;
  /** Whole days until `reachOutBy`; negative once overdue. null when not applicable. */
  daysUntilDue: number | null;
  /** Sort key, smaller = more urgent: -Infinity (tiered, no touchpoint) … +Infinity (untracked). */
  urgency: number;
}

function mostRecentEventDate(contactId: number, events: NetworkingEvent[]): string | null {
  let latest: string | null = null;
  for (const e of events) {
    if (!e.date || !e.contactIds.includes(contactId)) continue;
    if (latest === null || new Date(e.date).getTime() > new Date(latest).getTime()) latest = e.date;
  }
  return latest;
}

/**
 * Where a contact sits in its reach-out cycle, given the networking events it's
 * attached to. A contact with no tier is `untracked` (but still reports its last
 * touchpoint); a tiered contact with no touchpoint yet is `overdue` to prompt a
 * first reach-out.
 */
export function outreachInfo(
  contact: Pick<Contact, "id" | "relationshipTier">,
  events: NetworkingEvent[],
  today: string = todayFormatted()
): OutreachInfo {
  const tier = contact.relationshipTier ?? null;
  const lastContactedOn = mostRecentEventDate(contact.id, events);
  const daysSinceLastContact = lastContactedOn === null ? null : daysBetween(lastContactedOn, today);

  if (tier === null) {
    return {
      status: "untracked",
      tier: null,
      lastContactedOn,
      daysSinceLastContact,
      reachOutBy: null,
      daysUntilDue: null,
      urgency: Number.POSITIVE_INFINITY,
    };
  }

  if (lastContactedOn === null || daysSinceLastContact === null) {
    return {
      status: "overdue",
      tier,
      lastContactedOn: null,
      daysSinceLastContact: null,
      reachOutBy: null,
      daysUntilDue: null,
      urgency: Number.NEGATIVE_INFINITY,
    };
  }

  const cadence = RELATIONSHIP_TIERS[tier];
  const reachOutBy = addDays(lastContactedOn, cadence.maxDays);
  const daysUntilDue = cadence.maxDays - daysSinceLastContact;
  const status: OutreachStatus =
    daysSinceLastContact > cadence.maxDays ? "overdue" : daysSinceLastContact >= cadence.minDays ? "due" : "on_track";

  return { status, tier, lastContactedOn, daysSinceLastContact, reachOutBy, daysUntilDue, urgency: daysUntilDue };
}

/** Comparator for sorting contacts most-urgent-first; NaN-safe around the Infinity urgencies. */
export function compareByOutreachUrgency(a: OutreachInfo, b: OutreachInfo): number {
  if (a.urgency === b.urgency) return 0;
  return a.urgency < b.urgency ? -1 : 1;
}

/** Short timing phrase for a list cell, e.g. "Due in 12d", "34d overdue", "No touchpoints yet". */
export function outreachTiming(info: OutreachInfo): string {
  if (info.status === "untracked") return "Set a tier to track";
  if (info.lastContactedOn === null || info.daysUntilDue === null) return "No touchpoints yet";
  const d = info.daysUntilDue;
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return "Due today";
  return `Due in ${d}d`;
}
