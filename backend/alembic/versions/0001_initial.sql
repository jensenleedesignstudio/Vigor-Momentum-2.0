CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_subject text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  height_cm numeric(6,2), weight_kg numeric(6,2), unit_system text NOT NULL CHECK (unit_system IN ('metric','imperial')),
  experience_level text NOT NULL CHECK (experience_level IN ('beginner','novice','intermediate','advanced')),
  activity_level text NOT NULL, primary_goal text NOT NULL, secondary_goals jsonb NOT NULL DEFAULT '[]',
  preferred_duration smallint NOT NULL CHECK (preferred_duration IN (20,30,45,60,75,90)),
  training_days jsonb NOT NULL DEFAULT '[]', equipment jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE exercises (
  id text PRIMARY KEY, name text NOT NULL, category text NOT NULL, instructions text NOT NULL,
  equipment jsonb NOT NULL DEFAULT '[]', difficulty text NOT NULL, movement_pattern text NOT NULL,
  primary_muscles jsonb NOT NULL DEFAULT '[]', secondary_muscles jsonb NOT NULL DEFAULT '[]',
  muscle_activation jsonb NOT NULL DEFAULT '{}', substitutions jsonb NOT NULL DEFAULT '[]',
  common_mistakes jsonb NOT NULL DEFAULT '[]', media_url text, is_unilateral boolean NOT NULL DEFAULT false,
  is_bodyweight boolean NOT NULL DEFAULT false, owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), CHECK (owner_user_id IS NOT NULL OR id !~ '^custom_')
);

CREATE TABLE workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL, goal text NOT NULL, status text NOT NULL DEFAULT 'draft', start_date date, end_date date,
  generated_by_ai boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE planned_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workout_plan_id uuid NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7), name text NOT NULL, estimated_duration smallint NOT NULL, order_index smallint NOT NULL
);

CREATE TABLE planned_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), planned_workout_id uuid NOT NULL REFERENCES planned_workouts(id) ON DELETE CASCADE,
  exercise_id text NOT NULL REFERENCES exercises(id), sets smallint NOT NULL CHECK (sets BETWEEN 1 AND 12),
  rep_min smallint, rep_max smallint, target_rpe numeric(3,1), rest_seconds smallint, notes text, order_index smallint NOT NULL
);

CREATE TABLE workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planned_workout_id uuid REFERENCES planned_workouts(id) ON DELETE SET NULL, started_at timestamptz NOT NULL,
  completed_at timestamptz, duration_minutes smallint, overall_difficulty smallint, energy_level smallint,
  satisfaction smallint, notes text, status text NOT NULL DEFAULT 'active'
);

CREATE TABLE exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workout_session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id text NOT NULL REFERENCES exercises(id), notes text, order_index smallint NOT NULL
);

CREATE TABLE set_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), exercise_log_id uuid NOT NULL REFERENCES exercise_logs(id) ON DELETE CASCADE,
  set_number smallint NOT NULL, weight numeric(8,2), repetitions smallint, duration_seconds integer, distance numeric(10,2),
  rpe numeric(3,1), rir smallint, completed boolean NOT NULL DEFAULT false, UNIQUE(exercise_log_id, set_number)
);

CREATE INDEX workout_sessions_user_started_idx ON workout_sessions(user_id, started_at DESC);
CREATE INDEX workout_plans_user_status_idx ON workout_plans(user_id, status);
CREATE INDEX exercises_name_idx ON exercises(lower(name));
