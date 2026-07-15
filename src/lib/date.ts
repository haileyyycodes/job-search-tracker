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
