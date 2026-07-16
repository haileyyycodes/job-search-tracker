import type { Goals } from "./types";

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/** "$100,000–$140,000", "$100,000+" (min-only), or "" if neither is set. */
export function formatSalaryRange(min?: number, max?: number): string {
  if (min != null && max != null) return `${formatCurrency(min)}–${formatCurrency(max)}`;
  if (min != null) return `${formatCurrency(min)}+`;
  return "";
}

export type SalaryMatch = "meets" | "possible" | "below";

/**
 * Compares an application's posted salary band against the user's salary goal.
 * Only ever evaluated against the goal's minimum — a job paying more than the goal's
 * max is still a win, so the max isn't a ceiling requirement. Returns null when there's
 * nothing to compare (no goal set, or the application has no salary band).
 */
export function getSalaryMatch(app: { salaryMin?: number; salaryMax?: number }, goals: Goals): SalaryMatch | null {
  if (goals.salaryMin == null || app.salaryMin == null) return null;
  if (app.salaryMin >= goals.salaryMin) return "meets";
  if (app.salaryMax == null || app.salaryMax >= goals.salaryMin) return "possible";
  return "below";
}

export function salaryMatchColor(match: SalaryMatch | null): string {
  if (match === "meets") return "var(--green-600)";
  if (match === "possible") return "var(--yellow-600)";
  if (match === "below") return "var(--red-600)";
  return "var(--text-secondary)";
}

export function salaryMatchLabel(match: SalaryMatch | null): string {
  if (match === "meets") return "Meets goal";
  if (match === "possible") return "Possible";
  if (match === "below") return "Below goal";
  return "";
}
