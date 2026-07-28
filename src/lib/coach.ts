import type {
  ActivityRecord,
  Exercise,
  FoodLog,
  Insight,
  Macros,
  Profile,
  WeightEntry,
} from "../types";
import { MOVEMENT_GROUPS, MUSCLES } from "../data/muscles";
import { daysBetween, dateKey, weekKeys } from "./dates";
import {
  daysTrainedThisWeek,
  muscleBalance,
  nutritionDays,
  percent,
  progression,
  readiness,
  sumMacros,
  trainingStreak,
} from "./metrics";

export type ScorePart = {
  key: string;
  label: string;
  /** Points earned out of `weight`. */
  value: number;
  weight: number;
  hint: string;
};

export type WeeklyReview = {
  score: number;
  parts: ScorePart[];
  insights: Insight[];
  headline: string;
  /** The single most valuable next action, taken from the top insight. */
  nextMove: { copy: string; action?: Insight["action"] };
};

type ReviewInput = {
  exercises: Exercise[];
  records: ActivityRecord[];
  foodLogs: FoodLog[];
  macroTargets: Macros;
  profile: Profile;
  weightEntries: WeightEntry[];
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/**
 * Turns every tracked system into a ranked set of coaching cards plus a
 * transparent score. Each dimension contributes a weighted share so the number
 * can always be explained rather than just displayed.
 */
export function weeklyReview({
  exercises,
  records,
  foodLogs,
  macroTargets,
  profile,
  weightEntries,
}: ReviewInput): WeeklyReview {
  const completed = exercises.filter((exercise) => exercise.done);
  const completion = percent(completed.length, Math.max(exercises.length, 1));
  const balance = muscleBalance(exercises);
  const coveredGroups = MOVEMENT_GROUPS.filter((group) =>
    exercises.some((exercise) => group.muscles.includes(exercise.muscle as never)),
  );
  const missingGroups = MOVEMENT_GROUPS.filter((group) => !coveredGroups.includes(group)).map(
    (group) => group.label,
  );
  const underworked = balance.filter((row) => row.status === "under" && row.sets > 0);
  const untouched = balance.filter((row) => row.status === "none");
  const overreached = balance.filter((row) => row.status === "over");

  const rpeSamples = completed.filter((exercise) => exercise.difficulty > 0);
  const averageRpe = rpeSamples.length
    ? rpeSamples.reduce((sum, exercise) => sum + exercise.difficulty, 0) / rpeSamples.length
    : 0;

  const fuelDays = nutritionDays(foodLogs);
  const weekLogs = foodLogs.filter((log) => new Set(weekKeys()).has(log.date));
  const weekMacros = sumMacros(weekLogs);
  const loggedDayCount = Math.max(fuelDays, 1);
  const dailyProtein = weekMacros.protein / loggedDayCount;
  const dailyCalories = weekMacros.calories / loggedDayCount;

  const streak = trainingStreak(records);
  const trainedDays = daysTrainedThisWeek(records);
  const fresh = readiness(records, [...MUSCLES]);
  const staleGroups = fresh.filter((entry) => entry.state === "stale" && entry.days !== null);
  const overdue = fresh.filter((entry) => entry.days === null);

  const readyToProgress = completed
    .map((exercise) => ({ exercise, suggestion: progression(exercise) }))
    .filter((entry) => entry.suggestion && entry.suggestion.delta > 0);
  const missingLoad = exercises.filter((exercise) => exercise.done && exercise.weight === 0);

  // ── Score ────────────────────────────────────────────────────────────────
  const parts: ScorePart[] = [
    {
      key: "completion",
      label: "Completion",
      value: Math.round((completion / 100) * 35),
      weight: 35,
      hint: `${completed.length} of ${exercises.length} planned movements done`,
    },
    {
      key: "balance",
      label: "Balance",
      value: Math.round((coveredGroups.length / MOVEMENT_GROUPS.length) * 25),
      weight: 25,
      hint: `${coveredGroups.length}/${MOVEMENT_GROUPS.length} movement patterns in the plan`,
    },
    {
      key: "effort",
      label: "Effort quality",
      value:
        averageRpe === 0
          ? 0
          : averageRpe >= 6.5 && averageRpe <= 8.5
            ? 20
            : averageRpe < 6.5
              ? 12
              : 10,
      weight: 20,
      hint: averageRpe ? `Average RPE ${averageRpe.toFixed(1)}/10` : "No effort logged yet",
    },
    {
      key: "fuel",
      label: "Fuel tracking",
      value: Math.round(clamp(fuelDays / 5) * 20),
      weight: 20,
      hint: `${fuelDays}/7 days logged in Snack Bar`,
    },
  ];
  const score = Math.min(100, parts.reduce((sum, part) => sum + part.value, 0));

  // ── Insights ─────────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (!exercises.length) {
    insights.push({
      id: "empty-routine",
      tone: "alert",
      label: "SETUP",
      title: "Your week is empty",
      copy: "Build a routine first — every insight below unlocks once there is a plan to measure against.",
      priority: 100,
      action: { label: "Open routine builder", tab: "routine" },
    });
  } else if (completion >= 100) {
    insights.push({
      id: "completion",
      tone: "positive",
      label: "CONSISTENCY",
      title: "Full plan cleared",
      copy: `All ${exercises.length} movements are done. Hold this structure for one more week before adding volume.`,
      priority: 20,
    });
  } else if (completion >= 70) {
    insights.push({
      id: "completion",
      tone: "positive",
      label: "CONSISTENCY",
      title: "Strong follow-through",
      copy: `${completed.length} of ${exercises.length} movements complete. Finish the last ${exercises.length - completed.length} to bank a full week.`,
      priority: 45,
      action: { label: "Finish today", tab: "today" },
    });
  } else {
    insights.push({
      id: "completion",
      tone: "focus",
      label: "CONSISTENCY",
      title: "Close the completion gap",
      copy: `${exercises.length - completed.length} movement${exercises.length - completed.length === 1 ? " is" : "s are"} still open. Shorten one session or move the surplus to a lighter day rather than skipping it.`,
      priority: 75,
      action: { label: "Rebalance the week", tab: "routine" },
    });
  }

  if (missingGroups.length) {
    insights.push({
      id: "patterns",
      tone: "focus",
      label: "BALANCE",
      title: `Add ${missingGroups.join(" + ").toLowerCase()} work`,
      copy: `Your plan has no ${missingGroups.join(" or ").toLowerCase()} movement. Two to four quality sets close the gap without lengthening the week much.`,
      priority: 80,
      action: { label: "Browse catalogue", tab: "catalogue" },
    });
  } else if (untouched.length > 4) {
    insights.push({
      id: "untouched",
      tone: "neutral",
      label: "BALANCE",
      title: `${untouched.length} muscle groups untouched`,
      copy: `${untouched.slice(0, 3).map((row) => row.muscle).join(", ")} have no sets this week. That is fine on a focused block — worth revisiting if it runs longer than a month.`,
      priority: 35,
      action: { label: "Browse catalogue", tab: "catalogue" },
    });
  } else {
    insights.push({
      id: "patterns",
      tone: "positive",
      label: "BALANCE",
      title: "All movement patterns covered",
      copy: "Push, pull, lower-body and core are all present — a well-rounded weekly base.",
      priority: 18,
    });
  }

  if (underworked.length) {
    const names = underworked.slice(0, 2).map((row) => `${row.muscle} (${row.sets}/${row.min})`);
    insights.push({
      id: "landmarks",
      tone: "focus",
      label: "VOLUME",
      title: "Some groups are below their weekly floor",
      copy: `${names.join(" and ")} sit under the minimum weekly sets that reliably drive growth. Add one exercise or an extra set to each.`,
      priority: 65,
      action: { label: "Adjust routine", tab: "routine" },
    });
  }
  if (overreached.length) {
    insights.push({
      id: "overreach",
      tone: "neutral",
      label: "VOLUME",
      title: `${overreached[0].muscle} is above its productive ceiling`,
      copy: `${overreached[0].sets} weekly sets exceeds the ${overreached[0].max}-set range where extra work usually stops paying off. Trim a set and see whether quality improves.`,
      priority: 40,
      action: { label: "Adjust routine", tab: "routine" },
    });
  }

  if (averageRpe === 0) {
    insights.push({
      id: "effort",
      tone: "neutral",
      label: "PROGRESSION",
      title: "Log effort to unlock guidance",
      copy: "Record how hard each set felt in the session log. Effort is what tells the coach when to add weight and when to hold.",
      priority: 55,
      action: { label: "Open session log", tab: "progress" },
    });
  } else if (averageRpe <= 6) {
    insights.push({
      id: "effort",
      tone: "focus",
      label: "PROGRESSION",
      title: "You have room to progress",
      copy: `Average effort is ${averageRpe.toFixed(1)}/10${readyToProgress.length ? ` and ${readyToProgress.length} lift${readyToProgress.length === 1 ? "" : "s"} already qualify for more load` : ""}. Add a small increment while form stays clean.`,
      priority: 60,
      action: { label: "Apply progressions", tab: "progress" },
    });
  } else if (averageRpe >= 9) {
    insights.push({
      id: "effort",
      tone: "alert",
      label: "RECOVERY",
      title: "Protect your recovery",
      copy: `Average effort is ${averageRpe.toFixed(1)}/10. Hold the load steady, prioritise sleep, and consider a lighter session before adding volume.`,
      priority: 85,
      action: { label: "Review the load", tab: "progress" },
    });
  } else {
    insights.push({
      id: "effort",
      tone: "positive",
      label: "PROGRESSION",
      title: "Effort is in the productive zone",
      copy: `Average effort is ${averageRpe.toFixed(1)}/10. Progress one exercise at a time instead of increasing everything together.`,
      priority: 22,
    });
  }

  if (missingLoad.length) {
    insights.push({
      id: "data-quality",
      tone: "neutral",
      label: "TRACKING",
      title: `${missingLoad.length} completed lift${missingLoad.length === 1 ? " has" : "s have"} no weight`,
      copy: "Volume, personal records and progression all read from the weight column. A quick entry makes the whole tracker sharper.",
      priority: 50,
      action: { label: "Fill in the log", tab: "progress" },
    });
  }

  if (staleGroups.length) {
    const worst = staleGroups.sort((a, b) => (b.days ?? 0) - (a.days ?? 0))[0];
    insights.push({
      id: "stale",
      tone: "focus",
      label: "RECOVERY",
      title: `${worst.muscle} has not been trained in ${worst.days} days`,
      copy: "Fully recovered is not the same as progressing. Schedule this group before the gap turns into lost ground.",
      priority: 58,
      action: { label: "Schedule it", tab: "routine" },
    });
  } else if (overdue.length && records.some((record) => record.type === "session")) {
    insights.push({
      id: "coverage",
      tone: "neutral",
      label: "RECOVERY",
      title: "Some groups have no logged history",
      copy: `${overdue.slice(0, 3).map((entry) => entry.muscle).join(", ")} have never appeared in a logged session. Log one to start their recovery timeline.`,
      priority: 30,
    });
  }

  const proteinTarget = macroTargets.protein || 0;
  const proteinRatio = proteinTarget ? dailyProtein / proteinTarget : 0;
  if (fuelDays === 0) {
    insights.push({
      id: "fuel",
      tone: "neutral",
      label: "NUTRITION",
      title: "Nothing logged in Snack Bar yet",
      copy: "Even three tracked days per week is enough to connect training quality with fuel. Start with the days you train.",
      priority: 48,
      action: { label: "Open Snack Bar", tab: "snackbar" },
    });
  } else if (proteinTarget && proteinRatio < 0.8) {
    insights.push({
      id: "fuel",
      tone: "focus",
      label: "NUTRITION",
      title: "Protein is trailing your target",
      copy: `You are averaging ${Math.round(dailyProtein)}g against a ${proteinTarget}g goal across ${fuelDays} tracked day${fuelDays === 1 ? "" : "s"}. One high-protein snack per day closes most of that gap.`,
      priority: 62,
      action: { label: "Find a snack", tab: "snackbar" },
    });
  } else if (fuelDays >= 5) {
    insights.push({
      id: "fuel",
      tone: "positive",
      label: "NUTRITION",
      title: "Fuel tracking is consistent",
      copy: `Nutrition logged on ${fuelDays} of 7 days, averaging ${Math.round(dailyCalories)} kcal and ${Math.round(dailyProtein)}g protein. Keep portions honest so the trend stays useful.`,
      priority: 16,
    });
  } else {
    insights.push({
      id: "fuel",
      tone: "neutral",
      label: "NUTRITION",
      title: "Make recovery visible",
      copy: `Nutrition logged on ${fuelDays} of 7 days. A few more entries and the report can compare training weeks against fuelling weeks.`,
      priority: 38,
      action: { label: "Open Snack Bar", tab: "snackbar" },
    });
  }

  const calorieTarget = macroTargets.calories || 0;
  if (calorieTarget && fuelDays >= 3) {
    const ratio = dailyCalories / calorieTarget;
    const cutting = profile.goal === "Lose fat";
    const gaining = profile.goal === "Build muscle" || profile.goal === "Get stronger";
    if (cutting && ratio > 1.1) {
      insights.push({
        id: "goal-fuel",
        tone: "focus",
        label: "GOAL FIT",
        title: "Intake is above a fat-loss range",
        copy: `Averaging ${Math.round(dailyCalories)} kcal against a ${calorieTarget} kcal target. Trim the highest-calorie repeat entry rather than cutting protein.`,
        priority: 52,
        action: { label: "Review macros", tab: "progress" },
      });
    } else if (gaining && ratio < 0.85) {
      insights.push({
        id: "goal-fuel",
        tone: "focus",
        label: "GOAL FIT",
        title: "Intake is under a growth range",
        copy: `Averaging ${Math.round(dailyCalories)} kcal against a ${calorieTarget} kcal target. Muscle gain stalls before training does when fuel runs short.`,
        priority: 52,
        action: { label: "Find a meal", tab: "snackbar" },
      });
    }
  }

  if (streak >= 3) {
    insights.push({
      id: "streak",
      tone: "positive",
      label: "MOMENTUM",
      title: `${streak}-day logging streak`,
      copy: `You have logged a session ${streak} days running and trained ${trainedDays} day${trainedDays === 1 ? "" : "s"} this week. Consistency is the compounding part.`,
      priority: 14,
    });
  }

  if (weightEntries.length >= 2) {
    const sorted = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const span = daysBetween(first.date, last.date);
    const change = last.value - first.value;
    if (span >= 7 && Math.abs(change) >= 0.4) {
      const direction = change > 0 ? "up" : "down";
      insights.push({
        id: "bodyweight",
        tone: "neutral",
        label: "BODY WEIGHT",
        title: `Trending ${direction} ${Math.abs(change).toFixed(1)}${last.unit} over ${span} days`,
        copy:
          profile.goal === "Lose fat" && change > 0
            ? "Weight is drifting the other way from your goal. Check portion sizes before changing training."
            : "Weigh in at the same time of day so the trend stays comparable week to week.",
        priority: 28,
      });
    }
  }

  insights.sort((a, b) => b.priority - a.priority);

  const top = insights[0];
  const headline =
    score >= 80
      ? "A strong, well-balanced week."
      : score >= 55
        ? "Solid base — one or two things to tighten."
        : exercises.length
          ? "The plan is there; the follow-through needs work."
          : "Let's get a plan on the board.";

  return {
    score,
    parts,
    insights,
    headline,
    nextMove: { copy: top?.title ?? "Keep the plan steady.", action: top?.action },
  };
}

export type Achievement = {
  id: string;
  name: string;
  detail: string;
  unlocked: boolean;
  /** 0–1 progress toward unlocking, for the meter on locked badges. */
  progress: number;
};

/** Milestones derived from real logged history — never awarded speculatively. */
export function achievements(
  records: ActivityRecord[],
  foodLogs: FoodLog[],
  statEntries: { id: number }[],
): Achievement[] {
  const sessions = records.filter((record) => record.type === "session");
  const streak = trainingStreak(records);
  const photos = records.filter((record) => record.type === "photo").length;
  const notes = records.filter((record) => record.type === "note").length;
  const fuelled = new Set(foodLogs.map((log) => log.date)).size;
  const today = dateKey();
  const earliest = sessions.reduce((min, record) => (record.date < min ? record.date : min), today);
  const span = sessions.length ? daysBetween(earliest, today) + 1 : 0;

  const make = (id: string, name: string, detail: string, value: number, goal: number) => ({
    id,
    name,
    detail,
    unlocked: value >= goal,
    progress: clamp(value / goal),
  });

  return [
    make("first-session", "First rep logged", "Log your first session", sessions.length, 1),
    make("ten-sessions", "Ten sessions deep", "Log 10 training sessions", sessions.length, 10),
    make("streak-three", "Three in a row", "Log sessions on 3 consecutive days", streak, 3),
    make("streak-seven", "Seven-day streak", "Log sessions 7 days running", streak, 7),
    make("fuelled", "Fuelled week", "Track nutrition on 7 different days", fuelled, 7),
    make("measured", "Measured progress", "Save 10 stat-tracker data points", statEntries.length, 10),
    make("reflective", "Reflective athlete", "Write 5 training notes", notes, 5),
    make("long-game", "The long game", "Keep logging across 60 days", span, 60),
    make("documented", "Documented change", "Add 3 progress photos", photos, 3),
  ];
}
