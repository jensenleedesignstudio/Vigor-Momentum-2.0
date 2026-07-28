import { useEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "../types";
import { estimatedMinutes, exerciseVolume, progression, repInfo } from "../lib/metrics";
import { useDialog } from "./charts";

const REST_PRESETS = [60, 90, 120, 180];

/**
 * Guided workout runner.
 *
 * The old flow only offered a single "done" checkbox per exercise, so effort and
 * load were recorded from memory after the fact. Ticking sets as they happen
 * gives the coaching engine honest RPE and weight data, and the rest timer
 * starts itself the moment a set is banked.
 */
export function SessionRunner({
  exercises,
  onUpdate,
  onFinish,
  onClose,
}: {
  exercises: Exercise[];
  onUpdate: (id: number, patch: Partial<Exercise>) => void;
  onFinish: (elapsedMinutes: number) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() => {
    const firstUnfinished = exercises.findIndex((exercise) => !exercise.done);
    return firstUnfinished === -1 ? 0 : firstUnfinished;
  });
  const [restLength, setRestLength] = useState(90);
  const [restLeft, setRestLeft] = useState(0);
  const startedAt = useRef(Date.now());
  const dialogRef = useDialog(true, onClose);

  const current = exercises[index];
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const doneSets = exercises.reduce(
    (sum, exercise) => sum + (exercise.setLog ?? []).filter(Boolean).length,
    0,
  );
  const sessionVolume = Math.round(exercises.reduce((sum, e) => sum + (e.done ? exerciseVolume(e) : 0), 0));

  useEffect(() => {
    if (restLeft <= 0) return;
    const timer = setInterval(() => setRestLeft((left) => Math.max(0, left - 1)), 1000);
    return () => clearInterval(timer);
  }, [restLeft]);

  const suggestion = useMemo(() => (current ? progression(current) : null), [current]);

  if (!current) {
    return (
      <div className="runner-backdrop">
        <div className="runner" role="dialog" aria-modal="true" aria-label="Session runner" ref={dialogRef}>
          <header>
            <span className="eyebrow">GUIDED SESSION</span>
            <button type="button" onClick={onClose} aria-label="Close session runner">
              ×
            </button>
          </header>
          <p className="runner-empty">
            There are no exercises scheduled for today. Add some in the routine builder first.
          </p>
        </div>
      </div>
    );
  }

  const setLog = current.setLog ?? Array.from({ length: current.sets }, () => false);
  const info = repInfo(current.reps);

  const toggleSet = (setIndex: number) => {
    const next = Array.from({ length: current.sets }, (_, i) => setLog[i] ?? false);
    next[setIndex] = !next[setIndex];
    const allDone = next.every(Boolean);
    onUpdate(current.id, { setLog: next, done: allDone });
    if (next[setIndex]) setRestLeft(restLength);
  };

  const finishExercise = () => {
    onUpdate(current.id, {
      setLog: Array.from({ length: current.sets }, () => true),
      done: true,
    });
    setRestLeft(0);
    const nextIndex = exercises.findIndex((exercise, i) => i > index && !exercise.done);
    if (nextIndex !== -1) setIndex(nextIndex);
  };

  const minutes = () => Math.max(1, Math.round((Date.now() - startedAt.current) / 60_000));

  return (
    <div className="runner-backdrop">
      <div className="runner" role="dialog" aria-modal="true" aria-label="Session runner" ref={dialogRef}>
        <header>
          <div>
            <span className="eyebrow">GUIDED SESSION</span>
            <h2>{current.name}</h2>
            <p>
              {current.muscle} · exercise {index + 1} of {exercises.length}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close session runner">
            ×
          </button>
        </header>

        <div className="runner-progress" aria-label={`${doneSets} of ${totalSets} sets complete`}>
          <i style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
          <span>
            {doneSets}/{totalSets} SETS · {sessionVolume.toLocaleString()} KG
          </span>
        </div>

        <section className="runner-sets">
          <span className="eyebrow">
            TARGET · {current.sets} × {current.reps}
            {info.estimated && " (AMRAP — logged as 10)"}
          </span>
          <div className="set-row">
            {Array.from({ length: current.sets }, (_, setIndex) => (
              <button
                key={setIndex}
                type="button"
                className={setLog[setIndex] ? "set-chip done" : "set-chip"}
                onClick={() => toggleSet(setIndex)}
                aria-pressed={Boolean(setLog[setIndex])}
              >
                <b>{setIndex + 1}</b>
                <small>{setLog[setIndex] ? "DONE" : "SET"}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="runner-inputs">
          <label>
            WEIGHT / KG
            <input
              type="number"
              min="0"
              step="0.5"
              value={current.weight}
              onChange={(event) => onUpdate(current.id, { weight: Number(event.target.value) })}
            />
          </label>
          <label>
            EFFORT / RPE
            <input
              type="range"
              min="1"
              max="10"
              value={current.difficulty}
              onChange={(event) => onUpdate(current.id, { difficulty: Number(event.target.value) })}
            />
            <b>{current.difficulty}/10</b>
          </label>
          <label>
            MINUTES
            <input
              type="number"
              min="0"
              value={current.duration || estimatedMinutes(current)}
              onChange={(event) => onUpdate(current.id, { duration: Number(event.target.value) })}
            />
          </label>
        </section>

        {suggestion && suggestion.delta !== 0 && (
          <p className="runner-coach">
            <b>Coach:</b> {suggestion.reason}{" "}
            <button
              type="button"
              onClick={() => onUpdate(current.id, { weight: suggestion.weight })}
            >
              Set {suggestion.weight} kg
            </button>
          </p>
        )}

        <section className={`runner-rest${restLeft > 0 ? " active" : ""}`}>
          <div>
            <span className="eyebrow">REST TIMER</span>
            <strong>
              {String(Math.floor(restLeft / 60)).padStart(2, "0")}:
              {String(restLeft % 60).padStart(2, "0")}
            </strong>
          </div>
          <div className="rest-presets">
            {REST_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={restLength === preset ? "active" : ""}
                onClick={() => {
                  setRestLength(preset);
                  setRestLeft(preset);
                }}
              >
                {preset}s
              </button>
            ))}
            <button type="button" onClick={() => setRestLeft(0)} disabled={restLeft === 0}>
              Skip
            </button>
          </div>
        </section>

        <footer className="runner-foot">
          <button
            type="button"
            className="ghost"
            disabled={index === 0}
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
          >
            ← Previous
          </button>
          <button type="button" className="ghost" onClick={finishExercise}>
            Mark exercise complete
          </button>
          {index < exercises.length - 1 ? (
            <button type="button" onClick={() => setIndex((value) => value + 1)}>
              Next exercise →
            </button>
          ) : (
            <button type="button" onClick={() => onFinish(minutes())}>
              Finish &amp; log session ↗
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
