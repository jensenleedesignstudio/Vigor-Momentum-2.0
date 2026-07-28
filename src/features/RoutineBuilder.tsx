import { useEffect, useMemo, useState } from "react";
import type { Exercise } from "../types";
import { MUSCLES, inferMuscles } from "../data/muscles";
import { CATALOGUE, catalogueFallbackMuscle } from "../data/catalogue";
import { DAY_IDS, dayLabel } from "../lib/dates";
import { estimatedMinutes, muscleBalance } from "../lib/metrics";
import type { NotifyOptions } from "../hooks/useToasts";
import { ExerciseMuscleMap } from "../components/primitives";

const COLUMN_DOTS: Record<string, string> = {
  monday: "blue",
  tuesday: "amber",
  wednesday: "green",
  thursday: "violet",
  friday: "coral",
  saturday: "gold",
  sunday: "gray",
};

const COLUMNS = DAY_IDS.map((id) => ({ id, label: dayLabel(id), dot: COLUMN_DOTS[id] }));

type Notify = (message: string, options?: NotifyOptions) => void;

/**
 * Weekly kanban editor: filters, bulk edits, drag and drop, generated
 * suggestions, rest days, and per-day load summaries.
 *
 * Destructive actions are undoable through the toast queue instead of a browser
 * confirm, so a mis-click costs one click to reverse rather than a rebuild.
 */
export function RoutineBuilder({
  exercises,
  update,
  remove,
  restore,
  add,
  targets,
  notify,
  statuses,
  setStatuses,
  restDays,
  setRestDays,
}: {
  exercises: Exercise[];
  update: (id: number, patch: Partial<Exercise>) => void;
  remove: (id: number) => void;
  restore: (items: Exercise[], schedule: Record<number, string>) => void;
  add: () => number;
  targets: string[];
  notify: Notify;
  statuses: Record<number, string>;
  setStatuses: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  restDays: Record<string, boolean>;
  setRestDays: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const [prompt, setPrompt] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashScope, setTrashScope] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [minSets, setMinSets] = useState(0);
  const [repsFilter, setRepsFilter] = useState("");
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkDay, setBulkDay] = useState("monday");
  const [bulkReps, setBulkReps] = useState("");
  const [dragOver, setDragOver] = useState<string | null>(null);

  const toggleSelected = (id: number) =>
    setSelected((list) => (list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id]));

  const scheduledSelected = selected.filter((id) => exercises.some((e) => e.id === id));

  // Newly added exercises need a home column; existing assignments are kept.
  useEffect(() => {
    setStatuses((previous) => {
      let changed = false;
      const next = { ...previous };
      exercises.forEach((exercise, index) => {
        if (!next[exercise.id]) {
          next[exercise.id] = COLUMNS[index % COLUMNS.length].id;
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  }, [exercises, setStatuses]);

  const balance = useMemo(() => muscleBalance(exercises), [exercises]);
  const underworked = balance.filter((row) => row.status === "under" && row.sets > 0).slice(0, 3);

  const dayStats = useMemo(() => {
    const stats: Record<string, { sets: number; minutes: number; muscles: Set<string> }> = {};
    COLUMNS.forEach((column) => {
      stats[column.id] = { sets: 0, minutes: 0, muscles: new Set() };
    });
    exercises.forEach((exercise) => {
      const day = statuses[exercise.id] ?? "monday";
      const bucket = stats[day];
      if (!bucket) return;
      bucket.sets += exercise.sets;
      bucket.minutes += estimatedMinutes(exercise);
      bucket.muscles.add(exercise.muscle);
    });
    return stats;
  }, [exercises, statuses]);

  const applyBulkDay = () => {
    if (restDays[bulkDay]) {
      notify("That day is set to rest. Turn it back on before moving workouts there.", { tone: "warn" });
      return;
    }
    if (!scheduledSelected.length) return;
    const previous = { ...statuses };
    setStatuses((old) => ({
      ...old,
      ...Object.fromEntries(scheduledSelected.map((id) => [id, bulkDay])),
    }));
    notify(`${scheduledSelected.length} workouts moved to ${dayLabel(bulkDay)}.`, {
      tone: "success",
      undo: () => setStatuses(previous),
    });
  };

  const applyBulkReps = () => {
    const reps = bulkReps.trim();
    if (!reps) return;
    const previous = exercises
      .filter((exercise) => scheduledSelected.includes(exercise.id))
      .map((exercise) => ({ id: exercise.id, reps: exercise.reps }));
    scheduledSelected.forEach((id) => update(id, { reps }));
    setSuggestions((list) =>
      list.map((entry) => (selected.includes(entry.id) ? { ...entry, reps } : entry)),
    );
    setBulkReps("");
    notify(`Reps updated for ${scheduledSelected.length} workouts.`, {
      tone: "success",
      undo: () => previous.forEach((entry) => update(entry.id, { reps: entry.reps })),
    });
  };

  const deleteSelected = () => {
    if (!selected.length) return;
    const removed = exercises.filter((exercise) => selected.includes(exercise.id));
    const removedSchedule = Object.fromEntries(
      removed.map((exercise) => [exercise.id, statuses[exercise.id] ?? "monday"]),
    );
    removed.forEach((exercise) => remove(exercise.id));
    setSuggestions((list) => list.filter((entry) => !selected.includes(entry.id)));
    setSelected([]);
    notify(`${removed.length} workout${removed.length === 1 ? "" : "s"} deleted.`, {
      tone: "warn",
      undo: () => restore(removed, removedSchedule),
    });
  };

  const move = (exercise: Exercise, status: string) => {
    if (restDays[status]) {
      notify(`${dayLabel(status)} is marked as rest. Switch it back before moving workouts there.`, {
        tone: "warn",
      });
      return;
    }
    setStatuses((previous) => ({ ...previous, [exercise.id]: status }));
  };

  const toggleRest = (day: string) => {
    const next = !restDays[day];
    setRestDays((previous) => ({ ...previous, [day]: next }));
    notify(next ? `${dayLabel(day)} is now a rest day.` : `${dayLabel(day)} is back to training.`);
  };

  const addToDay = (day: string) => {
    if (restDays[day]) {
      notify(`${dayLabel(day)} is set to rest — no exercises can be added there.`, { tone: "warn" });
      return;
    }
    const id = add();
    setStatuses((previous) => ({ ...previous, [id]: day }));
    setSelected([id]);
    notify(`Exercise added to ${dayLabel(day)}. Name it and set its sets and reps.`);
  };

  /** Copies one day's programme onto another day. */
  const duplicateDay = (from: string) => {
    const source = exercises.filter((exercise) => (statuses[exercise.id] ?? "monday") === from);
    if (!source.length) {
      notify(`${dayLabel(from)} has nothing to copy.`, { tone: "warn" });
      return;
    }
    const target = COLUMNS.find((column) => column.id !== from && !restDays[column.id]);
    if (!target) {
      notify("Every other day is marked as rest.", { tone: "warn" });
      return;
    }
    const copies = source.map((exercise, index) => ({
      ...exercise,
      id: Date.now() + index,
      done: false,
      setLog: undefined,
    }));
    restore(copies, Object.fromEntries(copies.map((copy) => [copy.id, target.id])));
    notify(`${dayLabel(from)} copied to ${target.label}.`, {
      tone: "success",
      undo: () => copies.forEach((copy) => remove(copy.id)),
    });
  };

  const visibleColumns = COLUMNS.filter((column) => dayFilter === "all" || column.id === dayFilter);
  const passesFilters = (exercise: Exercise) =>
    (muscleFilter === "all" || exercise.muscle === muscleFilter) &&
    exercise.sets >= minSets &&
    (!repsFilter || exercise.reps.toLowerCase().includes(repsFilter.toLowerCase()));
  const filteredCount = exercises.filter(
    (exercise) =>
      passesFilters(exercise) && (dayFilter === "all" || statuses[exercise.id] === dayFilter),
  ).length;
  const clearFilters = () => {
    setDayFilter("all");
    setMuscleFilter("all");
    setMinSets(0);
    setRepsFilter("");
  };

  const trashRoutine = () => {
    const doomed =
      trashScope === "all"
        ? exercises
        : exercises.filter((exercise) => (statuses[exercise.id] ?? "monday") === trashScope);
    const label = trashScope === "all" ? "the entire routine" : dayLabel(trashScope);
    if (!doomed.length) {
      notify(`No workouts to delete from ${label}.`, { tone: "warn" });
      return;
    }
    const removedSchedule = Object.fromEntries(
      doomed.map((exercise) => [exercise.id, statuses[exercise.id] ?? "monday"]),
    );
    doomed.forEach((exercise) => remove(exercise.id));
    setSelected([]);
    setTrashOpen(false);
    if (trashScope !== "all" && dayFilter === trashScope) setDayFilter("all");
    notify(`${doomed.length} workout${doomed.length === 1 ? "" : "s"} deleted from ${label}.`, {
      tone: "warn",
      undo: () => restore(doomed, removedSchedule),
    });
  };

  /**
   * Builds four suggestions from the real catalogue. Keywords steer the muscle
   * mix; anything unmatched falls back to the user's onboarding priorities so
   * the result is never generic.
   */
  const generateSuggestions = () => {
    const query = prompt.toLowerCase();
    const wanted = new Set<string>();
    const addWanted = (...muscles: string[]) => muscles.forEach((muscle) => wanted.add(muscle));

    if (/leg|lower|quad|squat/.test(query)) addWanted("Quadriceps", "Hamstrings", "Glutes", "Calves");
    if (/back|pull|lat|row/.test(query)) addWanted("Mid-Back", "Upper Back", "Biceps");
    if (/push|chest|press/.test(query)) addWanted("Chest", "Shoulders", "Triceps");
    if (/arm|bicep|tricep/.test(query)) addWanted("Biceps", "Triceps");
    if (/core|ab|abs/.test(query)) addWanted("Core");
    if (/shoulder|delt/.test(query)) addWanted("Shoulders");
    if (!wanted.size) addWanted(...(targets.length ? targets : ["Chest", "Mid-Back", "Quadriceps", "Core"]));

    const pool = CATALOGUE.filter((item) => {
      const muscle = inferMuscles(item.name, catalogueFallbackMuscle(item.category)).primary;
      const matchesText =
        !query || `${item.name} ${item.equipment} ${item.muscles}`.toLowerCase().includes(query);
      return wanted.has(muscle) || matchesText;
    });

    const chosen: typeof CATALOGUE = [];
    const usedMuscles = new Set<string>();
    // Prefer one movement per muscle group before repeating a group.
    pool.forEach((item) => {
      const muscle = inferMuscles(item.name, catalogueFallbackMuscle(item.category)).primary;
      if (chosen.length < 4 && !usedMuscles.has(muscle)) {
        usedMuscles.add(muscle);
        chosen.push(item);
      }
    });
    pool.forEach((item) => {
      if (chosen.length < 4 && !chosen.includes(item)) chosen.push(item);
    });

    if (!chosen.length) {
      notify("No movements matched that description — try a muscle group or equipment name.", {
        tone: "warn",
      });
      return;
    }

    const now = Date.now();
    setSuggestions(
      chosen.map((item, index) => ({
        id: -(now + index),
        name: item.name,
        muscle: inferMuscles(item.name, catalogueFallbackMuscle(item.category)).primary,
        sets: item.sets,
        reps: item.reps,
        weight: 0,
        duration: 0,
        difficulty: index === 0 ? 8 : 6,
        done: false,
      })),
    );
    setPrompt("");
    notify(`${chosen.length} suggestions ready — drag them into your week.`, { tone: "success" });
  };

  const startDrag = (event: React.DragEvent, kind: "scheduled" | "ai", id: number) =>
    event.dataTransfer.setData("application/vigor", JSON.stringify({ kind, id }));

  const dropOnDay = (event: React.DragEvent, day: string) => {
    event.preventDefault();
    setDragOver(null);
    if (restDays[day]) {
      notify(`${dayLabel(day)} is set to rest — drag is blocked.`, { tone: "warn" });
      return;
    }
    try {
      const data = JSON.parse(event.dataTransfer.getData("application/vigor"));
      if (data.kind === "scheduled") {
        const previous = statuses[data.id];
        setStatuses((previousMap) => ({ ...previousMap, [data.id]: day }));
        notify(`Workout moved to ${dayLabel(day)}.`, {
          undo: () => setStatuses((map) => ({ ...map, [data.id]: previous })),
        });
      } else {
        const suggestion = suggestions.find((entry) => entry.id === data.id);
        if (!suggestion) return;
        const id = add();
        update(id, {
          name: suggestion.name,
          muscle: suggestion.muscle,
          sets: suggestion.sets,
          reps: suggestion.reps,
          difficulty: suggestion.difficulty,
        });
        setStatuses((previousMap) => ({ ...previousMap, [id]: day }));
        setSuggestions((list) => list.filter((entry) => entry.id !== data.id));
        notify(`${suggestion.name} added to ${dayLabel(day)}.`, { tone: "success" });
      }
    } catch {
      /* Ignore drops that did not originate inside the builder. */
    }
  };

  return (
    <div className="builder board-builder fade-up">
      <div className="board-title">
        <div>
          <span className="eyebrow">ROUTINE BUILDER / WEEKLY PROGRAM</span>
          <h1>Shape the week.</h1>
          <p>Plan each exercise by training day. Select any card to edit it.</p>
        </div>
        <button
          className="board-add"
          type="button"
          onClick={() => addToDay(dayFilter === "all" ? "monday" : dayFilter)}
        >
          ＋ <b>Add exercise</b>
        </button>
      </div>

      {underworked.length > 0 && (
        <aside className="builder-hint" role="note">
          <b>Balance check:</b> {underworked.map((row) => `${row.muscle} ${row.sets}/${row.min} sets`).join(" · ")}{" "}
          — below the weekly range these groups usually need.
        </aside>
      )}

      <div className="board-tools">
        <div className="board-summary">
          <b>{exercises.length}</b> exercises ·{" "}
          <b>{exercises.reduce((sum, exercise) => sum + exercise.sets, 0)}</b> sets ·{" "}
          <b>{COLUMNS.filter((column) => !restDays[column.id]).length}</b> training days
        </div>
        <div className="board-tool-actions">
          <button
            type="button"
            className={filtersOpen ? "filter-active" : ""}
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
          >
            ▽ Filter {filteredCount}/{exercises.length}
          </button>
          <button
            type="button"
            className={`trash-trigger ${trashOpen ? "active" : ""}`}
            onClick={() => setTrashOpen(!trashOpen)}
            aria-expanded={trashOpen}
            aria-label="Delete routine workouts"
          >
            🗑
          </button>
          {trashOpen && (
            <section className="trash-menu">
              <span className="eyebrow">DELETE WORKOUTS</span>
              <label>
                CHOOSE WHAT TO TRASH
                <select value={trashScope} onChange={(event) => setTrashScope(event.target.value)}>
                  <option value="all">Entire routine</option>
                  {COLUMNS.map((column) => (
                    <option value={column.id} key={column.id}>
                      {column.label} only
                    </option>
                  ))}
                </select>
              </label>
              <p>
                {trashScope === "all"
                  ? `${exercises.length} workouts will be removed.`
                  : `${exercises.filter((e) => (statuses[e.id] ?? "monday") === trashScope).length} workouts on ${dayLabel(trashScope)}.`}{" "}
                You can undo this straight afterwards.
              </p>
              <button type="button" className="trash-confirm" onClick={trashRoutine}>
                Trash selection
              </button>
              <button type="button" className="trash-cancel" onClick={() => setTrashOpen(false)}>
                Cancel
              </button>
            </section>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <section className="bulk-toolbar">
          <div>
            <strong>{selected.length}</strong>
            <span>SELECTED</span>
            <button type="button" onClick={() => setSelected([])}>
              Clear ×
            </button>
          </div>
          <label>
            MOVE TO DAY
            <select value={bulkDay} onChange={(event) => setBulkDay(event.target.value)}>
              {COLUMNS.map((column) => (
                <option value={column.id} key={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={applyBulkDay} disabled={!scheduledSelected.length}>
            Apply day
          </button>
          <label>
            CHANGE REPS
            <input
              value={bulkReps}
              onChange={(event) => setBulkReps(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && applyBulkReps()}
              placeholder="e.g. 8–12"
            />
          </label>
          <button type="button" onClick={applyBulkReps} disabled={!bulkReps.trim()}>
            Apply reps
          </button>
          <button type="button" className="bulk-delete" onClick={deleteSelected}>
            Delete selected
          </button>
        </section>
      )}

      {filtersOpen && (
        <section className="routine-filters">
          <label>
            DAY
            <select value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
              <option value="all">All days</option>
              {COLUMNS.map((column) => (
                <option value={column.id} key={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            MINIMUM SETS
            <input
              type="number"
              min="0"
              value={minSets}
              onChange={(event) => setMinSets(Number(event.target.value))}
            />
          </label>
          <label>
            REPS
            <input
              value={repsFilter}
              onChange={(event) => setRepsFilter(event.target.value)}
              placeholder="e.g. 10 or 8–12"
            />
          </label>
          <label>
            MUSCLE WORKED
            <select value={muscleFilter} onChange={(event) => setMuscleFilter(event.target.value)}>
              <option value="all">All muscles</option>
              {MUSCLES.map((muscle) => (
                <option key={muscle}>{muscle}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={clearFilters}>
            Clear all ×
          </button>
        </section>
      )}

      <section className="board-ai">
        <span aria-hidden="true">✦</span>
        <div>
          <label htmlFor="routine-prompt">ROUTINE SUGGESTIONS</label>
          <input
            id="routine-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Try ‘lower-body strength’, ‘back and biceps’ or ‘dumbbell only’…"
            onKeyDown={(event) => event.key === "Enter" && generateSuggestions()}
          />
        </div>
        <button type="button" onClick={generateSuggestions}>
          Generate →
        </button>
      </section>

      <div className={`kanban weekly-kanban ${dayFilter !== "all" ? "single-day" : ""}`}>
        <section className="kanban-column ai-column">
          <header>
            <div>
              <i />
              <b>Suggestions</b>
              <span>{suggestions.length}</span>
            </div>
            <span>DRAG →</span>
          </header>
          <div className="kanban-cards">
            {suggestions.map((suggestion) => {
              const isSelected = selected.includes(suggestion.id);
              return (
                <article
                  className={`workout-card ai-suggestion ${isSelected ? "selected-card" : ""}`}
                  draggable={!isSelected}
                  onDragStart={(event) => startDrag(event, "ai", suggestion.id)}
                  key={suggestion.id}
                >
                  <div className="card-status">
                    <label>
                      <span>✦ SUGGESTED</span>
                    </label>
                    <button
                      type="button"
                      className="select-workout"
                      onClick={() => toggleSelected(suggestion.id)}
                    >
                      {isSelected ? "DONE" : "SELECT"}
                    </button>
                  </div>
                  {isSelected ? (
                    <input
                      className="card-name"
                      aria-label="Suggestion name"
                      value={suggestion.name}
                      onChange={(event) =>
                        setSuggestions((list) =>
                          list.map((entry) =>
                            entry.id === suggestion.id
                              ? {
                                  ...entry,
                                  name: event.target.value,
                                  muscle: inferMuscles(event.target.value, entry.muscle).primary,
                                }
                              : entry,
                          ),
                        )
                      }
                    />
                  ) : (
                    <strong className="ai-card-name">{suggestion.name}</strong>
                  )}
                  <p>
                    {suggestion.sets} sets × {suggestion.reps} reps targeting{" "}
                    {suggestion.muscle.toLowerCase()}.
                  </p>
                  <ExerciseMuscleMap name={suggestion.name} muscle={suggestion.muscle} />
                  {isSelected && (
                    <div className="card-fields">
                      <select
                        aria-label="Target muscle"
                        value={suggestion.muscle}
                        onChange={(event) =>
                          setSuggestions((list) =>
                            list.map((entry) =>
                              entry.id === suggestion.id ? { ...entry, muscle: event.target.value } : entry,
                            ),
                          )
                        }
                      >
                        {MUSCLES.map((muscle) => (
                          <option key={muscle}>{muscle}</option>
                        ))}
                      </select>
                      <label>
                        SETS
                        <input
                          type="number"
                          min="1"
                          value={suggestion.sets}
                          onChange={(event) =>
                            setSuggestions((list) =>
                              list.map((entry) =>
                                entry.id === suggestion.id
                                  ? { ...entry, sets: Number(event.target.value) }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        REPS
                        <input
                          value={suggestion.reps}
                          onChange={(event) =>
                            setSuggestions((list) =>
                              list.map((entry) =>
                                entry.id === suggestion.id ? { ...entry, reps: event.target.value } : entry,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                  )}
                  <div className="suggestion-actions">
                    {COLUMNS.filter((column) => !restDays[column.id])
                      .slice(0, 3)
                      .map((column) => (
                        <button
                          key={column.id}
                          type="button"
                          onClick={() => {
                            const id = add();
                            update(id, {
                              name: suggestion.name,
                              muscle: suggestion.muscle,
                              sets: suggestion.sets,
                              reps: suggestion.reps,
                              difficulty: suggestion.difficulty,
                            });
                            setStatuses((previous) => ({ ...previous, [id]: column.id }));
                            setSuggestions((list) => list.filter((entry) => entry.id !== suggestion.id));
                            notify(`${suggestion.name} added to ${column.label}.`, { tone: "success" });
                          }}
                        >
                          + {column.label.slice(0, 3)}
                        </button>
                      ))}
                  </div>
                  <small className="drag-hint">
                    {isSelected ? "Edit the workout, then press Done" : "⠿ Drag into a training day"}
                  </small>
                </article>
              );
            })}
          </div>
          {!suggestions.length && (
            <div className="ai-empty">
              <b aria-hidden="true">✦</b>
              <span>Describe a goal above to pull matching movements from the 100-exercise catalogue.</span>
            </div>
          )}
        </section>

        {visibleColumns.map((column) => {
          const cards = exercises.filter(
            (exercise) => (statuses[exercise.id] ?? "monday") === column.id && passesFilters(exercise),
          );
          const stats = dayStats[column.id];
          return (
            <section
              className={`kanban-column day-dropzone${dragOver === column.id ? " drag-over" : ""}${restDays[column.id] ? " rest-day" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(column.id);
              }}
              onDragLeave={() => setDragOver((current) => (current === column.id ? null : current))}
              onDrop={(event) => dropOnDay(event, column.id)}
              key={column.id}
            >
              <header>
                <div>
                  <i className={column.dot} />
                  <b>{column.label}</b>
                  <span>{cards.length}</span>
                </div>
                <div className="day-actions">
                  <button
                    type="button"
                    className={`day-rest-toggle ${restDays[column.id] ? "active" : ""}`}
                    onClick={() => toggleRest(column.id)}
                    aria-pressed={Boolean(restDays[column.id])}
                  >
                    {restDays[column.id] ? "REST ON" : "REST"}
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateDay(column.id)}
                    aria-label={`Copy ${column.label} to another day`}
                    title="Copy this day"
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    onClick={() => addToDay(column.id)}
                    disabled={restDays[column.id]}
                    aria-label={`Add exercise to ${column.label}`}
                  >
                    ＋
                  </button>
                </div>
              </header>

              {!restDays[column.id] && stats.sets > 0 && (
                <p className="day-load">
                  {stats.sets} sets · ~{stats.minutes} min · {stats.muscles.size} group
                  {stats.muscles.size === 1 ? "" : "s"}
                </p>
              )}

              {restDays[column.id] ? (
                <div className="rest-block">
                  <strong>Rest &amp; recover.</strong>
                  <span>
                    Adding, moving, and dropping exercises is locked for {column.label}. Existing
                    exercises stay safely stored.
                  </span>
                </div>
              ) : (
                <div className="kanban-cards">
                  {cards.map((exercise) => {
                    const isSelected = selected.includes(exercise.id);
                    return (
                      <article
                        className={`workout-card ${exercise.done ? "done" : ""} ${isSelected ? "selected-card" : ""}`}
                        draggable={!isSelected}
                        onDragStart={(event) => startDrag(event, "scheduled", exercise.id)}
                        key={exercise.id}
                      >
                        <div className="card-status">
                          <label>
                            <input
                              type="checkbox"
                              disabled={!isSelected}
                              checked={exercise.done}
                              onChange={(event) => update(exercise.id, { done: event.target.checked })}
                            />
                            <span>{exercise.done ? "Complete" : "Routine task"}</span>
                          </label>
                          <button
                            type="button"
                            className="select-workout"
                            onClick={() => toggleSelected(exercise.id)}
                          >
                            {isSelected ? "DONE" : "SELECT"}
                          </button>
                        </div>
                        <input
                          className="card-name"
                          aria-label="Exercise name"
                          readOnly={!isSelected}
                          value={exercise.name}
                          onChange={(event) =>
                            update(exercise.id, {
                              name: event.target.value,
                              muscle: inferMuscles(event.target.value, exercise.muscle).primary,
                            })
                          }
                        />
                        <p>
                          {exercise.sets} sets × {exercise.reps} reps targeting{" "}
                          {exercise.muscle.toLowerCase()}.
                        </p>
                        <ExerciseMuscleMap name={exercise.name} muscle={exercise.muscle} />
                        {isSelected && (
                          <div className="card-fields">
                            <label>
                              TARGET MUSCLE
                              <input
                                value={exercise.muscle}
                                readOnly
                                aria-label="Target muscle, detected from exercise name"
                              />
                            </label>
                            <label>
                              SETS
                              <input
                                type="number"
                                min="1"
                                value={exercise.sets}
                                onChange={(event) =>
                                  update(exercise.id, { sets: Number(event.target.value) })
                                }
                              />
                            </label>
                            <label>
                              REPS
                              <input
                                value={exercise.reps}
                                onChange={(event) => update(exercise.id, { reps: event.target.value })}
                              />
                            </label>
                          </div>
                        )}
                        <div className="card-foot">
                          <span className="avatar" aria-hidden="true">
                            VM
                          </span>
                          {isSelected ? (
                            <select
                              aria-label={`Move ${exercise.name}`}
                              value={column.id}
                              onChange={(event) => move(exercise, event.target.value)}
                            >
                              {COLUMNS.map((entry) => (
                                <option value={entry.id} key={entry.id}>
                                  {entry.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{column.label}</span>
                          )}
                          <span>◷ {estimatedMinutes(exercise)}m</span>
                          {isSelected ? (
                            <button
                              type="button"
                              aria-label={`Remove ${exercise.name}`}
                              onClick={() => {
                                const day = statuses[exercise.id] ?? "monday";
                                remove(exercise.id);
                                setSelected((list) => list.filter((id) => id !== exercise.id));
                                notify(`${exercise.name} removed.`, {
                                  tone: "warn",
                                  undo: () => restore([exercise], { [exercise.id]: day }),
                                });
                              }}
                            >
                              ×
                            </button>
                          ) : (
                            <span />
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {!cards.length && (
                    <p className="column-empty">Nothing scheduled. Drop a suggestion here.</p>
                  )}
                </div>
              )}

              <button
                className="column-add"
                type="button"
                disabled={restDays[column.id]}
                onClick={() => addToDay(column.id)}
              >
                {restDays[column.id]
                  ? "Rest day — exercise adds locked"
                  : `＋ Add exercise to ${column.label}`}
              </button>
            </section>
          );
        })}
      </div>

      <div className="board-footer">
        <div>
          <span>AUTO-SAVED LOCALLY</span>
          <small>
            {exercises.length} exercises · {new Set(exercises.map((e) => e.muscle)).size} muscle groups
          </small>
        </div>
        <button type="button" onClick={() => notify("Routine saved. Momentum secured.", { tone: "success" })}>
          Save routine <span className="cta-arrow">↗︎</span>
        </button>
      </div>
    </div>
  );
}
