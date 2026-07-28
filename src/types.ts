// Shared data shapes for every Vigor Momentum system.
// Anything persisted to localStorage is declared here so the storage layer and
// the UI can never drift apart.

export type Screen = "account" | "intro" | "profile" | "plan" | "home";

export type Tab = "today" | "routine" | "catalogue" | "snackbar" | "progress" | "calendar";

export type DayId =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/** One planned or completed movement inside the weekly routine. */
export type Exercise = {
  id: number;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  weight: number;
  duration: number;
  /** Rate of perceived exertion, 1–10. */
  difficulty: number;
  done: boolean;
  /** Per-set completion flags used by the guided session runner. */
  setLog?: boolean[];
};

export type ActivityRecord = {
  id: number;
  /** ISO `YYYY-MM-DD`, always produced by `dateKey()`. */
  date: string;
  type: "session" | "note" | "photo";
  title: string;
  detail: string;
  /** Session snapshots store JSON; photos store a data URL. */
  data?: string;
};

export type CatalogueItem = {
  id: number;
  category: string;
  name: string;
  equipment: string;
  muscles: string;
  sets: number;
  reps: string;
};

export type StatMetric = "TOTAL VOLUME" | "BEST PR" | "REPS" | "TIME";

export type StatEntry = {
  id: number;
  exercise: string;
  metric: StatMetric;
  value: number;
  date: string;
};

export type FoodItem = {
  id: number;
  category: "Snack" | "Meal";
  name: string;
  ingredients: string;
  tutorial: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  benefits: string;
};

export type FoodLog = {
  id: number;
  foodId: number;
  name: string;
  date: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Macros = { calories: number; protein: number; carbs: number; fat: number };

/** A dated body-weight reading, used by the trend card in the tracker. */
export type WeightEntry = { id: number; date: string; value: number; unit: string };

export type Profile = {
  name: string;
  weight: number;
  weightUnit: string;
  height: number;
  heightUnit: string;
  goal: string;
  experience: string;
};

export type Preferences = {
  theme: "light" | "dark" | "system";
  reduceMotion: boolean;
  /** Skips the marketing screens once onboarding has been completed. */
  onboarded: boolean;
  lastTab: Tab;
  macroTargets: Macros;
};

/** Everything the export/import backup writes to disk. */
export type Snapshot = {
  version: number;
  exportedAt: string;
  profile: Profile;
  preferences: Preferences;
  exercises: Exercise[];
  schedule: Record<number, string>;
  restDays: Record<string, boolean>;
  records: ActivityRecord[];
  foodLogs: FoodLog[];
  statEntries: StatEntry[];
  weightEntries: WeightEntry[];
  journal: string;
};

export type InsightTone = "positive" | "focus" | "neutral" | "alert";

/** One coaching card produced by the feedback engine. */
export type Insight = {
  id: string;
  tone: InsightTone;
  label: string;
  title: string;
  copy: string;
  /** Higher sorts first — the engine ranks by how much attention it needs. */
  priority: number;
  action?: { label: string; tab: Tab };
};
