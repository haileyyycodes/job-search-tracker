import { daysBetween, todayFormatted } from "./date";
import type { Application } from "./types";

/**
 * Days between applying and the first subsequent status change (any change counts as a
 * "response" — an interview request, a rejection, or a self-initiated withdrawal). Returns
 * null if the application hasn't been applied to yet, or hasn't heard anything back.
 */
export function getResponseDays(app: Application): number | null {
  const appliedIndex = app.statusHistory.findIndex((s) => s.status === "applied");
  if (appliedIndex === -1) return null;
  const next = app.statusHistory[appliedIndex + 1];
  if (!next) return null;
  return daysBetween(app.statusHistory[appliedIndex].at, next.at);
}

/** Days elapsed since applying, for applications still waiting on a first response. */
export function getDaysAwaitingResponse(app: Application): number | null {
  const appliedIndex = app.statusHistory.findIndex((s) => s.status === "applied");
  if (appliedIndex === -1) return null;
  if (app.statusHistory[appliedIndex + 1]) return null;
  return daysBetween(app.statusHistory[appliedIndex].at, todayFormatted());
}

function formatDays(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/** "12 days", "3 days (awaiting response)", or undefined if not yet applied. */
export function formatResponseTime(app: Application): string | undefined {
  const responded = getResponseDays(app);
  if (responded != null) return formatDays(responded);
  const awaiting = getDaysAwaitingResponse(app);
  if (awaiting != null) return `${formatDays(awaiting)} (awaiting response)`;
  return undefined;
}
