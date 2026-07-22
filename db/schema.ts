import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  ...timestamps,
});

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  heightCm: real("height_cm"), weightKg: real("weight_kg"),
  unitSystem: text("unit_system").notNull().default("metric"),
  experienceLevel: text("experience_level").notNull(), activityLevel: text("activity_level").notNull(),
  primaryGoal: text("primary_goal").notNull(), secondaryGoals: text("secondary_goals", { mode: "json" }).$type<string[]>().notNull().default([]),
  preferredDuration: integer("preferred_duration").notNull(), trainingDays: text("training_days", { mode: "json" }).$type<string[]>().notNull().default([]),
  equipment: text("equipment", { mode: "json" }).$type<string[]>().notNull().default([]),
  ...timestamps,
});

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(), name: text("name").notNull(), category: text("category").notNull(),
  instructions: text("instructions").notNull(), equipment: text("equipment", { mode: "json" }).$type<string[]>().notNull().default([]),
  difficulty: text("difficulty").notNull(), movementPattern: text("movement_pattern").notNull(),
  primaryMuscles: text("primary_muscles", { mode: "json" }).$type<string[]>().notNull().default([]),
  secondaryMuscles: text("secondary_muscles", { mode: "json" }).$type<string[]>().notNull().default([]),
  muscleActivation: text("muscle_activation", { mode: "json" }).$type<Record<string, number>>().notNull().default({}),
  substitutions: text("substitutions", { mode: "json" }).$type<string[]>().notNull().default([]),
  isUnilateral: integer("is_unilateral", { mode: "boolean" }).notNull().default(false),
  isBodyweight: integer("is_bodyweight", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const workoutPlans = sqliteTable("workout_plans", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), goal: text("goal").notNull(), status: text("status").notNull().default("draft"),
  startDate: text("start_date"), endDate: text("end_date"), generatedByAi: integer("generated_by_ai", { mode: "boolean" }).notNull().default(false), ...timestamps,
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workoutPlanId: text("workout_plan_id").references(() => workoutPlans.id, { onDelete: "set null" }),
  startedAt: text("started_at").notNull(), completedAt: text("completed_at"), durationMinutes: integer("duration_minutes"),
  overallDifficulty: integer("overall_difficulty"), energyLevel: integer("energy_level"), satisfaction: integer("satisfaction"),
  notes: text("notes"), status: text("status").notNull().default("active"),
});

export const journalEntries = sqliteTable("journal_entries", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), mood: integer("mood"), energy: integer("energy"), sleepHours: real("sleep_hours"),
  sleepQuality: integer("sleep_quality"), stress: integer("stress"), soreness: integer("soreness"), motivation: integer("motivation"),
  notes: text("notes"), tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
});
