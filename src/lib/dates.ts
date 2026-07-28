/**
 * Date helpers. Every stored date is a local `YYYY-MM-DD` key so that a session
 * logged at 11pm never jumps to the next day the way `toISOString()` would.
 */

export const DAY_IDS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const dayLabel = (id: string) => DAY_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);

/** Local `YYYY-MM-DD`. */
export function dateKey(date: Date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` key back into a local noon Date, avoiding TZ drift. */
export function fromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12);
}

/** Monday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date = new Date()) {
  const start = new Date(date);
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + amount);
  return next;
}

/** The seven `YYYY-MM-DD` keys of the week containing `date`, Monday first. */
export function weekKeys(date: Date = new Date()) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i)));
}

/** Which `DAY_IDS` entry a date falls on. */
export function dayIdOf(date: Date) {
  return DAY_IDS[(date.getDay() + 6) % 7];
}

/** Whole days between two date keys (positive when `to` is later). */
export function daysBetween(from: string, to: string) {
  const ms = fromKey(to).getTime() - fromKey(from).getTime();
  return Math.round(ms / 86_400_000);
}

export const shortDate = (key: string) =>
  fromKey(key).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

export const longDate = (key: string) =>
  fromKey(key).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });

/** Greeting that actually tracks the clock instead of always saying "morning". */
export function greeting(date: Date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Still going";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Winding down";
}
