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

export interface WeekItemBucket<T> {
  weekStart: Date;
  label: string;
  items: T[];
}

/**
 * Buckets `items` into the last `weeks` Monday-Sunday calendar weeks (oldest first, ending with
 * the current week) by the "Jul 15, 2026"-formatted date returned from `getDate`. Weeks with no
 * matches are still included so a trend chart has a continuous x-axis.
 */
export function bucketItemsByCalendarWeek<T>(
  items: T[],
  getDate: (item: T) => string,
  weeks: number
): WeekItemBucket<T>[] {
  const currentWeekStart = startOfCalendarWeek(new Date());
  const buckets: WeekItemBucket<T>[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    buckets.push({
      weekStart,
      label: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      items: [],
    });
  }

  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const time = new Date(raw).getTime();
    for (const bucket of buckets) {
      const weekEnd = new Date(bucket.weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (time >= bucket.weekStart.getTime() && time < weekEnd.getTime()) {
        bucket.items.push(item);
        break;
      }
    }
  }

  return buckets;
}

/**
 * Buckets "Jul 15, 2026"-formatted dates into the last `weeks` Monday-Sunday calendar weeks
 * (oldest first, ending with the current week), including weeks with zero matches so a trend
 * chart has a continuous x-axis.
 */
export function bucketByCalendarWeek(dates: string[], weeks: number): WeekBucket[] {
  return bucketItemsByCalendarWeek(dates, (d) => d, weeks).map(({ weekStart, label, items }) => ({
    weekStart,
    label,
    count: items.length,
  }));
}

/** First day 00:00 of the month containing `date`. */
export function startOfCalendarMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** A Date as a `YYYY-MM-DD` string, for pre-filling an `<input type="date">`. */
export function toDateInputString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type BucketUnit = "week" | "month";

export interface PeriodItemBucket<T> {
  /** Inclusive start of the period: Monday 00:00 for weeks, the 1st for months. */
  start: Date;
  /** Short x-axis label, e.g. "Jul 15" for weeks, "Jul" (or "Jul '26" across a year boundary) for months. */
  label: string;
  items: T[];
}

/**
 * Buckets `items` into consecutive `week`- or `month`-long periods covering [from, to] — each
 * end is widened to a whole period — oldest first, keyed by the "Jul 15, 2026"-formatted date
 * from `getDate`. Empty periods are kept so a trend chart has a continuous x-axis.
 */
export function bucketItemsByPeriod<T>(
  items: T[],
  getDate: (item: T) => string,
  from: Date,
  to: Date,
  unit: BucketUnit
): PeriodItemBucket<T>[] {
  const spansYears = from.getFullYear() !== to.getFullYear();
  const advance = (d: Date) => (unit === "week" ? d.setDate(d.getDate() + 7) : d.setMonth(d.getMonth() + 1));

  const buckets: PeriodItemBucket<T>[] = [];
  const cursor = unit === "week" ? startOfCalendarWeek(from) : startOfCalendarMonth(from);
  while (cursor.getTime() <= to.getTime()) {
    const monthLabel = cursor.toLocaleDateString("en-US", { month: "short" });
    const label =
      unit === "week"
        ? cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : spansYears
          ? `${monthLabel} '${String(cursor.getFullYear()).slice(-2)}`
          : monthLabel;
    buckets.push({ start: new Date(cursor), label, items: [] });
    advance(cursor);
  }
  if (buckets.length === 0) return buckets;

  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const time = new Date(raw).getTime();
    for (let i = 0; i < buckets.length; i += 1) {
      const startT = buckets[i].start.getTime();
      const endBoundary = new Date(buckets[i].start);
      advance(endBoundary);
      const endT = i + 1 < buckets.length ? buckets[i + 1].start.getTime() : endBoundary.getTime();
      if (time >= startT && time < endT) {
        buckets[i].items.push(item);
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
