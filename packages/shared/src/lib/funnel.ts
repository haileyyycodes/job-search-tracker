import { daysBetween, todayFormatted } from "./date";
import type { Application, ApplicationStatus, NetworkingEvent } from "./types";

/** Status changes that represent an external reply — excludes "withdrawn", which is self-initiated. */
const REPLY_STATUSES: ApplicationStatus[] = [
  "interviewing",
  "offer_extended",
  "offer_accepted",
  "offer_declined",
  "rejected_no_interview",
  "rejected_after_interview",
];

/** True if the company ever responded (any external status change), regardless of the application's current status. */
export function hasReplied(app: Application): boolean {
  return app.statusHistory.some((s) => REPLY_STATUSES.includes(s.status));
}

/** True if the application ever reached the interviewing stage, regardless of what happened after. */
export function reachedInterview(app: Application): boolean {
  return app.statusHistory.some((s) => s.status === "interviewing");
}

/** True if an offer was ever extended, regardless of whether it was later accepted or declined. */
export function reachedOffer(app: Application): boolean {
  return app.statusHistory.some((s) => s.status === "offer_extended");
}

/**
 * Applications eligible for funnel-ratio math: submitted (not "todo"), excluding pure
 * self-initiated withdrawals with no prior reply — those never got a chance to respond
 * either way, so counting them would unfairly drag down the rates.
 */
export function getFunnelApps(apps: Application[]): Application[] {
  return apps.filter((a) => a.status !== "todo" && !(a.status === "withdrawn" && !hasReplied(a)));
}

function pct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 100);
}

/** Replies (incl. rejections) ÷ applications sent, as a whole-number percentage. Null when there's no funnel yet. */
export function getResponseRate(apps: Application[]): number | null {
  const funnel = getFunnelApps(apps);
  return pct(funnel.filter(hasReplied).length, funnel.length);
}

/** Interviews reached ÷ applications sent — the headline diagnostic metric. */
export function getInterviewRatio(apps: Application[]): number | null {
  const funnel = getFunnelApps(apps);
  return pct(funnel.filter(reachedInterview).length, funnel.length);
}

/** Offers ÷ interviews reached. Null when no interviews have been reached yet. */
export function getOfferRatio(apps: Application[]): number | null {
  const interviewed = getFunnelApps(apps).filter(reachedInterview);
  return pct(interviewed.filter(reachedOffer).length, interviewed.length);
}

export type InterviewRatioTier = "healthy" | "at_risk" | "critical";

/** 2026 market bands: 10%+ healthy, 3-9% at-risk, below 3% critical. */
export function getInterviewRatioTier(ratio: number | null): InterviewRatioTier | null {
  if (ratio == null) return null;
  if (ratio >= 10) return "healthy";
  if (ratio >= 3) return "at_risk";
  return "critical";
}

export function interviewRatioTierColor(tier: InterviewRatioTier | null): string {
  if (tier === "healthy") return "var(--success)";
  if (tier === "at_risk") return "var(--warning)";
  if (tier === "critical") return "var(--danger)";
  return "var(--text-secondary)";
}

export function interviewRatioTierLabel(tier: InterviewRatioTier | null): string {
  if (tier === "healthy") return "Healthy";
  if (tier === "at_risk") return "At risk";
  if (tier === "critical") return "Critical";
  return "";
}

export type ApplicationChannel = "referral" | "warm" | "cold";

export const channelLabels: Record<ApplicationChannel, string> = {
  referral: "Referral",
  warm: "Warm outreach",
  cold: "Cold",
};

/**
 * Derives how an application originated, entirely from existing data:
 * a referral if flagged as such, otherwise "warm" if any networking event is linked to
 * this specific application, otherwise "cold". No dedicated channel field required.
 */
export function getApplicationChannel(app: Application, networkingEvents: NetworkingEvent[]): ApplicationChannel {
  if (app.referral) return "referral";
  if (networkingEvents.some((e) => e.applicationId === app.id)) return "warm";
  return "cold";
}

export interface ChannelBreakdownRow {
  channel: ApplicationChannel;
  count: number;
  interviewRatio: number | null;
  tier: InterviewRatioTier | null;
}

/** Interview ratio segmented by channel, over the same funnel-apps base as the headline ratios. */
export function getChannelBreakdown(apps: Application[], networkingEvents: NetworkingEvent[]): ChannelBreakdownRow[] {
  const funnel = getFunnelApps(apps);
  const channels: ApplicationChannel[] = ["referral", "warm", "cold"];
  return channels.map((channel) => {
    const inChannel = funnel.filter((a) => getApplicationChannel(a, networkingEvents) === channel);
    const interviewRatio = pct(inChannel.filter(reachedInterview).length, inChannel.length);
    return { channel, count: inChannel.length, interviewRatio, tier: getInterviewRatioTier(interviewRatio) };
  });
}

/** Most recent date across status history, interviews, and follow-ups — the broadest signal of "is this moving." */
export function getLastActivityDate(app: Application): string | null {
  const dates = [
    ...app.statusHistory.map((s) => s.at),
    ...app.interviews.map((iv) => iv.date),
    ...app.followUps.map((f) => f.date),
  ].filter(Boolean);
  if (dates.length === 0) return null;
  return dates.reduce((latest, d) => (new Date(d).getTime() > new Date(latest).getTime() ? d : latest));
}

export function getDaysSinceActivity(app: Application): number | null {
  const last = getLastActivityDate(app);
  if (!last) return null;
  return daysBetween(last, todayFormatted());
}
