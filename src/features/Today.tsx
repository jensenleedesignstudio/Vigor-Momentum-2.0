import { useMemo, useState } from "react";
import type {
  ActivityRecord,
  Exercise,
  FoodLog,
  Macros,
  Profile,
  Tab,
  WeightEntry,
} from "../types";
import { FOOD_CATALOGUE, foodSprite } from "../data/foods";
import { MUSCLES } from "../data/muscles";
import { dateKey, dayIdOf, dayLabel } from "../lib/dates";
import {
  completedVolume,
  daysTrainedThisWeek,
  percent,
  readiness,
  sumMacros,
  trainingStreak,
} from "../lib/metrics";
import { BodyMap, EmptyState } from "../components/primitives";
import { Meter, ProgressRing } from "../components/charts";
import { WeeklyReport } from "./WeeklyReport";

const MACRO_ROWS = [
  { key: "protein", label: "Protein", unit: "g", series: 1 },
  { key: "carbs", label: "Carbs", unit: "g", series: 2 },
  { key: "fat", label: "Fat", unit: "g", series: 3 },
] as const;

/**
 * The daily dashboard.
 *
 * "Today" now means today: the checklist is filtered to the movements actually
 * scheduled for this weekday instead of the whole week, so completion, the body
 * map, and the hero figure all describe the same session.
 */
export function Today({
  exercises,
  schedule,
  restDays,
  records,
  foodLogs,
  macroTargets,
  profile,
  weightEntries,
  update,
  setTab,
  onStartSession,
}: {
  exercises: Exercise[];
  schedule: Record<number, string>;
  restDays: Record<string, boolean>;
  records: ActivityRecord[];
  foodLogs: FoodLog[];
  macroTargets: Macros;
  profile: Profile;
  weightEntries: WeightEntry[];
  update: (id: number, patch: Partial<Exercise>) => void;
  setTab: (tab: Tab) => void;
  onStartSession: () => void;
}) {
  const [showWeek, setShowWeek] = useState(false);
  const today = dayIdOf(new Date());
  const isRestDay = Boolean(restDays[today]);

  const todaysExercises = useMemo(
    () => exercises.filter((exercise) => (schedule[exercise.id] ?? "monday") === today),
    [exercises, schedule, today],
  );

  const doneToday = todaysExercises.filter((exercise) => exercise.done);
  const momentum = percent(doneToday.length, Math.max(todaysExercises.length, 1));
  const muscleHits = doneToday.map((exercise) => exercise.muscle);
  const volumeToday = Math.round(completedVolume(todaysExercises));

  const todayKey = dateKey();
  const todayFood = foodLogs.filter((log) => log.date === todayKey);
  const todayMacros = sumMacros(todayFood);

  const streak = trainingStreak(records);
  const trainedDays = daysTrainedThisWeek(records);
  const recovery = readiness(records, [...MUSCLES]);
  const restedGroups = recovery.filter((entry) => entry.state === "stale");

  const featuredFoods = FOOD_CATALOGUE.slice(0, 3);
  const weekRemaining = exercises.filter(
    (exercise) => (schedule[exercise.id] ?? "monday") !== today && !exercise.done,
  );

  return (
    <div className="dashboard fade-up">
      <section className="hero-stat">
        <div>
          <span className="eyebrow">
            {dayLabel(today).toUpperCase()} / {isRestDay ? "REST DAY" : "TODAY’S MOMENTUM"}
          </span>
          <strong className="hero-figure">
            {momentum}
            <sup>%</sup>
          </strong>
          <p>
            {isRestDay
              ? "Scheduled rest. Recovery is where the adaptation happens."
              : todaysExercises.length === 0
                ? "Nothing scheduled for today yet."
                : momentum === 100
                  ? "Session complete. Momentum earned."
                  : `${volumeToday.toLocaleString()} kg moved so far — a little further than yesterday.`}
          </p>
          <div className="hero-actions">
            {todaysExercises.length > 0 && !isRestDay && (
              <button type="button" className="hero-cta" onClick={onStartSession}>
                {doneToday.length ? "Resume session" : "Start guided session"}{" "}
                <span aria-hidden="true">▶</span>
              </button>
            )}
            <button type="button" className="hero-ghost" onClick={() => setTab("routine")}>
              Edit routine <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
        <ProgressRing value={doneToday.length} total={todaysExercises.length} />
      </section>

      <section className="streak-card">
        <div>
          <span className="eyebrow">MOMENTUM / STREAK</span>
          <strong>
            {streak}
            <small>DAY{streak === 1 ? "" : "S"}</small>
          </strong>
          <p>{streak ? "Consecutive days with a logged session." : "Log a session to start a streak."}</p>
        </div>
        <div>
          <span className="eyebrow">THIS WEEK</span>
          <strong>
            {trainedDays}
            <small>/ 7 DAYS</small>
          </strong>
          <div className="week-dots" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} className={i < trainedDays ? "on" : ""} />
            ))}
          </div>
        </div>
        <div>
          <span className="eyebrow">FUEL TODAY</span>
          <strong>
            {Math.round(todayMacros.calories).toLocaleString()}
            <small>KCAL</small>
          </strong>
          <Meter
            value={todayMacros.calories}
            max={macroTargets.calories || 1}
            status={todayMacros.calories > macroTargets.calories * 1.1 ? "over" : "good"}
            label={`Calories today: ${Math.round(todayMacros.calories)} of ${macroTargets.calories}`}
          />
        </div>
      </section>

      <section className="session-card">
        <div className="card-head">
          <div>
            <span className="eyebrow">TODAY / {dayLabel(today).toUpperCase()}</span>
            <h3>{isRestDay ? "Rest and recover" : "Today’s movements"}</h3>
          </div>
          <button type="button" onClick={() => setTab("routine")}>
            Edit routine ↗
          </button>
        </div>

        {isRestDay ? (
          <EmptyState
            icon="☾"
            title="Today is a rest day"
            copy="Nothing is scheduled. Recovery is planned work — check back tomorrow, or open the builder to move something here."
            action={{ label: "Open routine builder", onClick: () => setTab("routine") }}
          />
        ) : todaysExercises.length === 0 ? (
          <EmptyState
            icon="＋"
            title="No movements scheduled today"
            copy="Add exercises to this day from the routine builder or the catalogue and they will appear here."
            action={{ label: "Browse the catalogue", onClick: () => setTab("catalogue") }}
          />
        ) : (
          <div className="exercise-list">
            {todaysExercises.map((exercise, index) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => update(exercise.id, { done: !exercise.done })}
                className={exercise.done ? "done" : ""}
                aria-pressed={exercise.done}
              >
                <span className="check" aria-hidden="true">
                  {exercise.done ? "✓" : ""}
                </span>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <strong>
                  {exercise.name}
                  <small>{exercise.muscle}</small>
                </strong>
                <span>{exercise.sets} SETS</span>
                <span>{exercise.reps} REPS</span>
                <i aria-hidden="true">↗</i>
              </button>
            ))}
          </div>
        )}

        {weekRemaining.length > 0 && (
          <div className="week-rest">
            <button type="button" onClick={() => setShowWeek((open) => !open)} aria-expanded={showWeek}>
              {showWeek ? "Hide" : "Show"} {weekRemaining.length} movement
              {weekRemaining.length === 1 ? "" : "s"} scheduled later this week
            </button>
            {showWeek && (
              <ul>
                {weekRemaining.map((exercise) => (
                  <li key={exercise.id}>
                    <b>{dayLabel(schedule[exercise.id] ?? "monday").slice(0, 3)}</b>
                    <span>{exercise.name}</span>
                    <small>{exercise.muscle}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="body-card">
        <div>
          <span className="eyebrow">TODAY / BODY MAP</span>
          <h3>Today, mapped.</h3>
          <p>
            Muscles illuminate as you complete today’s exercises. Repeated work on the same group
            deepens the green.
          </p>
          <div className="legend">
            <i /> TRAINED TODAY <i /> NOT YET TRAINED
          </div>
          {restedGroups.length > 0 && (
            <p className="body-note">
              <b>Waiting on you:</b>{" "}
              {restedGroups
                .slice(0, 3)
                .map((entry) => `${entry.muscle}${entry.days === null ? "" : ` (${entry.days}d)`}`)
                .join(", ")}
            </p>
          )}
        </div>
        <BodyMap active={muscleHits} context="today" />
      </section>

      <WeeklyReport
        exercises={exercises}
        records={records}
        foodLogs={foodLogs}
        macroTargets={macroTargets}
        profile={profile}
        weightEntries={weightEntries}
        setTab={setTab}
      />

      <section className="home-snack-bar">
        <header>
          <div>
            <span className="eyebrow">SNACK BAR / DAILY FUEL</span>
            <h3>Fuel the momentum.</h3>
            <p>Quick, balanced ideas from your nutrition catalogue — logged straight to the tracker.</p>
          </div>
          <div className="home-snack-total">
            <strong>{Math.round(todayMacros.calories).toLocaleString()}</strong>
            <span>KCAL TRACKED TODAY</span>
          </div>
        </header>

        <div className="macro-chips">
          {MACRO_ROWS.map((row) => {
            const value = todayMacros[row.key];
            const target = macroTargets[row.key] || 0;
            return (
              <div className="macro-chip" key={row.key} data-series={row.series}>
                <span className="eyebrow">{row.label.toUpperCase()}</span>
                <b>
                  {Math.round(value)}
                  <small>
                    {row.unit} / {target}
                    {row.unit}
                  </small>
                </b>
                <Meter
                  value={value}
                  max={target || 1}
                  status={target && value > target * 1.15 ? "over" : "good"}
                  label={`${row.label}: ${Math.round(value)} of ${target} ${row.unit}`}
                />
              </div>
            );
          })}
        </div>

        <div className="home-snack-grid">
          {featuredFoods.map((food) => {
            const sprite = foodSprite(food);
            return (
              <article key={food.id}>
                <div
                  className={`home-snack-photo ${sprite.className}`}
                  style={sprite.style}
                  role="img"
                  aria-label={`Photo of ${food.name}`}
                />
                <div>
                  <span>{food.category.toUpperCase()}</span>
                  <h4>{food.name}</h4>
                  <p>
                    {food.calories} kcal · {food.protein}g protein
                  </p>
                </div>
              </article>
            );
          })}
        </div>
        <button type="button" onClick={() => setTab("snackbar")}>
          Explore Snack Bar <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className="quote-card">
        <span aria-hidden="true">“</span>
        <p>We are what we repeatedly do. Excellence, then, is not an act, but a habit.</p>
        <small>— ARISTOTLE</small>
      </section>
    </div>
  );
}
