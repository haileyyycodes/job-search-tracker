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
