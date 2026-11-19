export const stamp = (date: Date) => date.toISOString().slice(0, 10);
export const dayDate = (value: string) => new Date(value + "T12:00:00Z");
export function calendarRange(
  anchor: string,
  period: "MONTH" | "WEEK",
): { from: string; to: string } {
  const first = dayDate(anchor);
  if (period === "MONTH") first.setUTCDate(1);
  first.setUTCDate(first.getUTCDate() - first.getUTCDay());
  const last = new Date(first);
  last.setUTCDate(last.getUTCDate() + (period === "MONTH" ? 41 : 6));
  return { from: stamp(first), to: stamp(last) };
}
export function advanceCalendar(
  anchor: string,
  period: "MONTH" | "WEEK",
  direction: number,
): string {
  const d = dayDate(anchor);
  if (period === "MONTH") {
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + direction);
  } else d.setUTCDate(d.getUTCDate() + 7 * direction);
  return stamp(d);
}
