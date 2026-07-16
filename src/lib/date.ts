/** Formats a `YYYY-MM-DD` date-input value as "Jul 15, 2026", matching the mock data's display format. */
export function formatDateInput(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayFormatted(): string {
  const now = new Date();
  return now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Adds `days` to a "Jul 15, 2026"-formatted date and returns the same format. */
export function addDays(displayDate: string, days: number): string {
  const date = new Date(displayDate);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Reverse of formatDateInput: "Jul 15, 2026" -> "2026-07-15", for pre-filling a date input. */
export function toDateInputValue(displayDate: string): string {
  if (!displayDate) return "";
  const date = new Date(displayDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * True if `displayDate` falls within [fromInputValue, toInputValue] (inclusive).
 * Bounds are raw `<input type="date">` values; either may be empty for unbounded.
 */
export function isWithinDateRange(displayDate: string, fromInputValue: string, toInputValue: string): boolean {
  const time = new Date(displayDate).getTime();
  if (fromInputValue && time < new Date(formatDateInput(fromInputValue)).getTime()) return false;
  if (toInputValue && time > new Date(formatDateInput(toInputValue)).getTime()) return false;
  return true;
}

/** Monday 00:00 of the week containing `date`. */
function startOfCalendarWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

/** True if a "Jul 15, 2026"-formatted date falls in the same Monday-Sunday week as today. */
export function isInCurrentCalendarWeek(displayDate: string): boolean {
  const date = new Date(displayDate);
  const weekStart = startOfCalendarWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

/** Whole days from today until a "Jul 15, 2026"-formatted date (negative if in the past). */
export function daysUntil(displayDate: string): number {
  const target = new Date(displayDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
