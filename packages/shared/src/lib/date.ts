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
export function startOfCalendarWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

export interface WeekBucket {
  weekStart: Date;
  label: string;
  count: number;
}

/**
 * Buckets "Jul 15, 2026"-formatted dates into the last `weeks` Monday-Sunday calendar weeks
 * (oldest first, ending with the current week), including weeks with zero matches so a trend
 * chart has a continuous x-axis.
 */
export function bucketByCalendarWeek(dates: string[], weeks: number): WeekBucket[] {
  const currentWeekStart = startOfCalendarWeek(new Date());
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    buckets.push({
      weekStart,
      label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  for (const raw of dates) {
    if (!raw) continue;
    const time = new Date(raw).getTime();
    for (const bucket of buckets) {
      const weekEnd = new Date(bucket.weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (time >= bucket.weekStart.getTime() && time < weekEnd.getTime()) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets;
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

/** Whole days between two "Jul 15, 2026"-formatted dates (`to` minus `from`). */
export function daysBetween(from: string, to: string): number {
  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(0, 0, 0, 0);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
}

/** True if a "Jul 15, 2026"-formatted date falls in the same calendar month (and year) as today. */
export function isInCurrentCalendarMonth(displayDate: string): boolean {
  const date = new Date(displayDate);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
