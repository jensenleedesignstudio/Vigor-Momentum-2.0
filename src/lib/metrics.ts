import type { ActivityRecord, Exercise, FoodLog, Macros } from "../types";
import { RECOVERY_DAYS, WEEKLY_SET_LANDMARKS } from "../data/muscles";
import { addDays, dateKey, daysBetween, startOfWeek, weekKeys } from "./dates";

/**
 * Reading a rep prescription.
 *
 * The catalogue mixes plain counts ("10"), ranges ("8–12"), per-side work
 * ("10 / side"), timed holds ("45 sec") and open sets ("AMRAP"), so a naive
 * `parseFloat` turns an AMRAP set into `NaN` and poisons every total downstream.
 */
export type RepInfo = {
  /** Representative rep count for volume maths. Timed work returns 0. */
  reps: number;
  /** Seconds per set for holds such as planks. */
  seconds: number;
  timed: boolean;
  /** True when the number is an assumption rather than a prescription. */
  estimated: boolean;
};

const AMRAP_ASSUMPTION = 10;

export function repInfo(value: string): RepInfo {
  const text = String(value ?? "").trim();
  if (!text) return { reps: 0, seconds: 0, timed: false, estimated: false };

  const range = text.match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
  const single = text.match(/(\d+(?:\.\d+)?)/);
  const timed = /sec|second|min\b|minute/i.test(text);
  const perSide = /\/\s*side|per side|each side/i.test(text);

  let amount = 0;
  if (range) amount = (Number(range[1]) + Number(range[2])) / 2;
  else if (single) amount = Number(single[1]);

  if (timed) {
    const seconds = /min/i.test(text) ? amount * 60 : amount;
    return { reps: 0, seconds, timed: true, estimated: false };
  }
  if (!amount && /amrap|max/i.test(text)) {
    return { reps: AMRAP_ASSUMPTION, seconds: 0, timed: false, estimated: true };
  }
  return { reps: perSide ? amount * 2 : amount, seconds: 0, timed: false, estimated: false };
}

/** Representative reps only — convenient for averages. */
export const parseReps = (value: string) => repInfo(value).reps;

/** Load moved by one exercise: sets × reps × weight. Never `NaN`. */
export function exerciseVolume(exercise: Exercise) {
  const volume = exercise.sets * repInfo(exercise.reps).reps * exercise.weight;
  return Number.isFinite(volume) ? volume : 0;
}

/** Only counts work that was actually completed. */
export const completedVolume = (exercises: Exercise[]) =>
  exercises.reduce((sum, e) => sum + (e.done ? exerciseVolume(e) : 0), 0);

/** Estimated minutes for an exercise when the user has not logged a duration. */
export const estimatedMinutes = (exercise: Exercise) =>
  exercise.duration || Math.max(3, Math.round(exercise.sets * 2.5));

/** Sets per muscle group across a list of exercises. */
export function setsByMuscle(exercises: Exercise[]) {
  return exercises.reduce<Record<string, number>>((totals, exercise) => {
    totals[exercise.muscle] = (totals[exercise.muscle] ?? 0) + exercise.sets;
    return totals;
  }, {});
}

export type BalanceRow = {
  muscle: string;
  sets: number;
  completed: number;
  min: number;
  max: number;
  /** 0–1 position of `sets` inside the landmark range, clamped for the meter. */
  fill: number;
  status: "none" | "under" | "in-range" | "over";
};

/** Weekly set volume per muscle measured against evidence-based landmarks. */
export function muscleBalance(exercises: Exercise[]): BalanceRow[] {
  const planned = setsByMuscle(exercises);
  const completed = setsByMuscle(exercises.filter((e) => e.done));
  return Object.keys(WEEKLY_SET_LANDMARKS)
    .map((muscle) => {
      const { min, max } = WEEKLY_SET_LANDMARKS[muscle];
      const sets = planned[muscle] ?? 0;
      const status: BalanceRow["status"] =
        sets === 0 ? "none" : sets < min ? "under" : sets > max ? "over" : "in-range";
      return {
        muscle,
        sets,
        completed: completed[muscle] ?? 0,
        min,
        max,
        fill: Math.min(1, sets / max),
        status,
      };
    })
    .sort((a, b) => b.sets - a.sets);
}

/** Session snapshots stored on a calendar record. */
export function sessionExercises(record: ActivityRecord): Exercise[] {
  if (record.type !== "session" || !record.data) return [];
  try {
    const parsed = JSON.parse(record.data);
    return Array.isArray(parsed) ? (parsed as Exercise[]) : [];
  } catch {
    return [];
  }
}

export type WeekPoint = { key: string; label: string; volume: number; sessions: number };

/**
 * Real training history, derived from logged sessions rather than invented
 * numbers. Returns the last `weeks` Mondays, oldest first, so an empty history
 * renders an honest empty chart instead of a fake upward trend.
 */
export function weeklyVolumeHistory(records: ActivityRecord[], weeks = 8): WeekPoint[] {
  const thisMonday = startOfWeek();
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const monday = addDays(thisMonday, (i - (weeks - 1)) * 7);
    return {
      key: dateKey(monday),
      label: monday.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
      volume: 0,
      sessions: 0,
    };
  });

  records
    .filter((record) => record.type === "session")
    .forEach((record) => {
      const monday = dateKey(startOfWeek(new Date(`${record.date}T12:00:00`)));
      const bucket = buckets.find((entry) => entry.key === monday);
      if (!bucket) return;
      bucket.volume += completedVolume(sessionExercises(record));
      bucket.sessions += 1;
    });

  return buckets.map((bucket) => ({ ...bucket, volume: Math.round(bucket.volume) }));
}

/** Volume per weekday for the current week, mapped from real session dates. */
export function weekdayVolume(records: ActivityRecord[]) {
  const keys = weekKeys();
  return keys.map((key) => {
    const volume = records
      .filter((record) => record.type === "session" && record.date === key)
      .reduce((sum, record) => sum + completedVolume(sessionExercises(record)), 0);
    return { key, volume: Math.round(volume) };
  });
}

/** Most recent date each muscle group was actually trained. */
export function lastTrainedByMuscle(records: ActivityRecord[]) {
  const latest: Record<string, string> = {};
  records
    .filter((record) => record.type === "session")
    .forEach((record) => {
      sessionExercises(record)
        .filter((exercise) => exercise.done)
        .forEach((exercise) => {
          if (!latest[exercise.muscle] || latest[exercise.muscle] < record.date) {
            latest[exercise.muscle] = record.date;
          }
        });
    });
  return latest;
}

export type Readiness = { muscle: string; days: number | null; state: "fresh" | "recovering" | "stale" };

/**
 * How ready each muscle group is to be trained again. `stale` means it has been
 * left alone for more than a week — a nudge rather than a warning.
 */
export function readiness(records: ActivityRecord[], muscles: string[]): Readiness[] {
  const latest = lastTrainedByMuscle(records);
  const today = dateKey();
  return muscles.map((muscle) => {
    const last = latest[muscle];
    if (!last) return { muscle, days: null, state: "stale" as const };
    const days = daysBetween(last, today);
    const window = RECOVERY_DAYS[muscle] ?? 2;
    return {
      muscle,
      days,
      state: days < window ? ("recovering" as const) : days > 8 ? ("stale" as const) : ("fresh" as const),
    };
  });
}

/** Consecutive days, counting back from today, that contain a logged session. */
export function trainingStreak(records: ActivityRecord[]) {
  const days = new Set(records.filter((r) => r.type === "session").map((r) => r.date));
  if (!days.size) return 0;
  let streak = 0;
  const cursor = new Date();
  // A session logged yesterday but not yet today should not break the streak.
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Distinct days trained in the current Monday-to-Sunday week. */
export function daysTrainedThisWeek(records: ActivityRecord[]) {
  const keys = new Set(weekKeys());
  return new Set(
    records.filter((record) => record.type === "session" && keys.has(record.date)).map((r) => r.date),
  ).size;
}

export type PersonalRecord = { name: string; weight: number; previous: number; date: string };

/** Heaviest completed load per exercise across every logged session. */
export function bestLifts(records: ActivityRecord[]) {
  const best: Record<string, { weight: number; date: string }> = {};
  records
    .filter((record) => record.type === "session")
    .forEach((record) => {
      sessionExercises(record)
        .filter((exercise) => exercise.done && exercise.weight > 0)
        .forEach((exercise) => {
          const key = exercise.name.trim().toLowerCase();
          if (!best[key] || exercise.weight > best[key].weight) {
            best[key] = { weight: exercise.weight, date: record.date };
          }
        });
    });
  return best;
}

/** Which of the exercises about to be logged beat their previous best. */
export function detectPersonalRecords(
  exercises: Exercise[],
  records: ActivityRecord[],
): PersonalRecord[] {
  const best = bestLifts(records);
  return exercises
    .filter((exercise) => exercise.done && exercise.weight > 0)
    .map((exercise) => {
      const previous = best[exercise.name.trim().toLowerCase()]?.weight ?? 0;
      return { name: exercise.name, weight: exercise.weight, previous, date: dateKey() };
    })
    .filter((pr) => pr.weight > pr.previous)
    .sort((a, b) => b.weight - a.weight);
}

export type Progression = {
  /** Suggested working weight for the next session. */
  weight: number;
  delta: number;
  reason: string;
};

/**
 * Progressive-overload suggestion for one exercise.
 *
 * Effort drives the recommendation: comfortable sets earn a load bump, hard sets
 * hold steady, and maximal sets get a deload prompt. Increments follow the
 * smallest jump most gyms can actually make for that class of movement.
 */
export function progression(exercise: Exercise): Progression | null {
  if (!exercise.weight) return null;
  const compound = /squat|deadlift|press|row|pull|thrust|lunge/i.test(exercise.name);
  const step = compound ? Math.max(2.5, exercise.weight * 0.025) : Math.max(1, exercise.weight * 0.02);
  const round = (value: number) => Math.round(value * 2) / 2;

  if (exercise.difficulty <= 6) {
    return {
      weight: round(exercise.weight + step),
      delta: round(step),
      reason: `Last set felt like ${exercise.difficulty}/10 — add load while form holds.`,
    };
  }
  if (exercise.difficulty >= 9) {
    return {
      weight: round(exercise.weight * 0.9),
      delta: round(exercise.weight * 0.9 - exercise.weight),
      reason: `${exercise.difficulty}/10 is close to failure — back off 10% and rebuild.`,
    };
  }
  return {
    weight: exercise.weight,
    delta: 0,
    reason: `${exercise.difficulty}/10 is the productive zone — repeat the load and add a rep.`,
  };
}

export const EMPTY_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function sumMacros(logs: FoodLog[]): Macros {
  return logs.reduce(
    (total, log) => ({
      calories: total.calories + log.calories * log.servings,
      protein: total.protein + log.protein * log.servings,
      carbs: total.carbs + log.carbs * log.servings,
      fat: total.fat + log.fat * log.servings,
    }),
    { ...EMPTY_MACROS },
  );
}

/** Days in the current week with at least one food entry. */
export function nutritionDays(logs: FoodLog[]) {
  const keys = new Set(weekKeys());
  return new Set(logs.filter((log) => keys.has(log.date)).map((log) => log.date)).size;
}

export const percent = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

export const trendDelta = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
