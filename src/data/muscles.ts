import type { Exercise } from "../types";

/** Canonical muscle list used by onboarding, filters, and every anatomy map. */
export const MUSCLES = [
  "Chest",
  "Upper Back",
  "Mid-Back",
  "Lower Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
  "Glutes",
  "Quadriceps",
  "Hamstrings",
  "Calves",
] as const;

export type Muscle = (typeof MUSCLES)[number];

export const MUSCLE_INFO: Record<string, string> = {
  Chest: "Front upper torso · pushing",
  "Upper Back": "Traps & rhomboids · posture",
  "Mid-Back": "Lats · pulling",
  "Lower Back": "Erector spinae · torso support",
  Shoulders: "Deltoids · raises the arms",
  Biceps: "Front upper arm · bends the elbow",
  Triceps: "Back upper arm · straightens the elbow",
  Core: "Abs & obliques · spine stability",
  Glutes: "Hip drive and extension",
  Quadriceps: "Front thigh · straightens the knee",
  Hamstrings: "Back thigh · bends the knee",
  Calves: "Lower leg · jumping and plantar flexion",
};

/**
 * Weekly working-set landmarks per muscle group. The lower bound is roughly the
 * volume needed to keep a group progressing; the upper bound is where extra sets
 * stop paying for themselves for most lifters. Used by the balance meter and the
 * coaching engine to say "under", "in range", or "over".
 */
export const WEEKLY_SET_LANDMARKS: Record<string, { min: number; max: number }> = {
  Chest: { min: 10, max: 20 },
  "Upper Back": { min: 8, max: 18 },
  "Mid-Back": { min: 10, max: 20 },
  "Lower Back": { min: 4, max: 12 },
  Shoulders: { min: 8, max: 20 },
  Biceps: { min: 6, max: 18 },
  Triceps: { min: 6, max: 18 },
  Core: { min: 6, max: 16 },
  Glutes: { min: 8, max: 18 },
  Quadriceps: { min: 8, max: 20 },
  Hamstrings: { min: 8, max: 18 },
  Calves: { min: 6, max: 16 },
};

/** Push / pull / lower / core families used for weekly balance feedback. */
export const MOVEMENT_GROUPS = [
  { label: "Push", muscles: ["Chest", "Shoulders", "Triceps"] },
  { label: "Pull", muscles: ["Upper Back", "Mid-Back", "Lower Back", "Biceps"] },
  { label: "Lower", muscles: ["Glutes", "Quadriceps", "Hamstrings", "Calves"] },
  { label: "Core", muscles: ["Core"] },
] as const;

/** Recovery windows, in days, before a group is considered fresh again. */
export const RECOVERY_DAYS: Record<string, number> = {
  Chest: 2,
  "Upper Back": 2,
  "Mid-Back": 2,
  "Lower Back": 3,
  Shoulders: 2,
  Biceps: 2,
  Triceps: 2,
  Core: 1,
  Glutes: 2,
  Quadriceps: 3,
  Hamstrings: 3,
  Calves: 1,
};

type SeedExercise = Omit<Exercise, "id" | "done" | "weight" | "duration" | "difficulty">;

/** Starter movements per muscle group, used when generating a first routine. */
export const ROUTINES: Record<string, SeedExercise[]> = {
  Chest: [
    { name: "Incline dumbbell press", muscle: "Chest", sets: 4, reps: "8–10" },
    { name: "Cable fly", muscle: "Chest", sets: 3, reps: "12–15" },
  ],
  "Upper Back": [{ name: "Face pull", muscle: "Upper Back", sets: 3, reps: "12–15" }],
  "Mid-Back": [
    { name: "Lat pulldown", muscle: "Mid-Back", sets: 4, reps: "8–12" },
    { name: "Chest-supported row", muscle: "Mid-Back", sets: 3, reps: "10–12" },
  ],
  "Lower Back": [{ name: "Back extension", muscle: "Lower Back", sets: 3, reps: "12" }],
  Shoulders: [{ name: "Dumbbell shoulder press", muscle: "Shoulders", sets: 3, reps: "8–10" }],
  Biceps: [{ name: "Hammer curl", muscle: "Biceps", sets: 3, reps: "10–12" }],
  Triceps: [{ name: "Cable pushdown", muscle: "Triceps", sets: 3, reps: "10–12" }],
  Core: [{ name: "Plank", muscle: "Core", sets: 3, reps: "45 sec" }],
  Quadriceps: [
    { name: "Back squat", muscle: "Quadriceps", sets: 4, reps: "6–8" },
    { name: "Walking lunge", muscle: "Quadriceps", sets: 3, reps: "10 / side" },
  ],
  Glutes: [
    { name: "Barbell hip thrust", muscle: "Glutes", sets: 4, reps: "8–10" },
    { name: "Bulgarian split squat", muscle: "Glutes", sets: 3, reps: "10 / side" },
  ],
  Hamstrings: [{ name: "Romanian deadlift", muscle: "Hamstrings", sets: 4, reps: "8–10" }],
  Calves: [{ name: "Standing calf raise", muscle: "Calves", sets: 4, reps: "12–15" }],
};

/** Percentage coordinates keep highlights aligned when the anatomy art resizes. */
export const MUSCLE_POINTS: Record<string, { x: number; y: number }[]> = {
  Chest: [{ x: 27.3, y: 24 }],
  "Upper Back": [{ x: 71.8, y: 22 }],
  "Mid-Back": [{ x: 71.8, y: 33.5 }],
  "Lower Back": [{ x: 71.8, y: 41.5 }],
  Shoulders: [
    { x: 20.3, y: 22 },
    { x: 34.2, y: 22 },
    { x: 65, y: 22 },
    { x: 79, y: 22 },
  ],
  Biceps: [
    { x: 18.8, y: 31 },
    { x: 35.8, y: 31 },
  ],
  Triceps: [
    { x: 63.5, y: 31 },
    { x: 80.4, y: 31 },
  ],
  Core: [{ x: 27.3, y: 35.5 }],
  Glutes: [{ x: 71.8, y: 49.5 }],
  Quadriceps: [
    { x: 24.4, y: 57 },
    { x: 30.2, y: 57 },
  ],
  Hamstrings: [
    { x: 68.8, y: 59.5 },
    { x: 74.8, y: 59.5 },
  ],
  Calves: [
    { x: 68.5, y: 74.5 },
    { x: 75, y: 74.5 },
  ],
  // Legacy aliases kept so older saved routines still render a highlight.
  Back: [{ x: 71.8, y: 32 }],
  Quads: [
    { x: 24.4, y: 57 },
    { x: 30.2, y: 57 },
  ],
  Arms: [
    { x: 18.8, y: 31 },
    { x: 35.8, y: 31 },
  ],
};

/** Turns "Mid-Back" into the `mid-back` class the stylesheet expects. */
export const muscleClass = (muscle: string) => muscle.toLowerCase().replace(/ /g, "-");

const INFERENCE_RULES: [RegExp, string, string[]][] = [
  [/bench|chest press|push.?up|fly|pec/, "Chest", ["Shoulders", "Triceps"]],
  [/shrug|face pull|reverse fly|high row|trap|rhomboid/, "Upper Back", ["Shoulders"]],
  [/row|pulldown|pull.?up|chin.?up|lat /, "Mid-Back", ["Biceps", "Upper Back"]],
  [/back extension|hyperextension|superman|good morning/, "Lower Back", ["Hamstrings", "Glutes"]],
  [/shoulder|overhead|military|lateral raise|front raise|arnold/, "Shoulders", ["Triceps"]],
  [/curl|hammer|preacher|chin.?up/, "Biceps", ["Mid-Back"]],
  [/tricep|pushdown|dip|skull|close.grip/, "Triceps", ["Chest", "Shoulders"]],
  [/crunch|plank|sit.?up|ab |oblique|russian twist|leg raise/, "Core", []],
  [/hip thrust|glute|kickback|bridge/, "Glutes", ["Hamstrings"]],
  [/squat|leg press|lunge|step.?up|leg extension/, "Quadriceps", ["Glutes"]],
  [/romanian|rdl|hamstring|leg curl|deadlift/, "Hamstrings", ["Glutes", "Lower Back"]],
  [/calf|toe raise|jump rope|box jump/, "Calves", ["Quadriceps"]],
];

/** Infers primary and supporting muscles from common words in an exercise name. */
export function inferMuscles(name: string, fallback: string) {
  const needle = name.toLowerCase();
  const match = INFERENCE_RULES.find(([pattern]) => pattern.test(needle));
  return match
    ? { primary: match[1], secondary: match[2] }
    : { primary: fallback, secondary: [] as string[] };
}

/** Normalises muscle names saved by older versions of the app. */
export function normaliseMuscle(muscle: string, name = "") {
  if (muscle === "Back") return "Mid-Back";
  if (muscle === "Quads") return "Quadriceps";
  if (muscle === "Arms") return inferMuscles(name, "Biceps").primary;
  return muscle;
}
