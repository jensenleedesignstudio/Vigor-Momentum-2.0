import { useEffect, useState, type ReactNode } from "react";
import { MUSCLE_INFO, MUSCLE_POINTS, inferMuscles, muscleClass } from "../data/muscles";

/** Reusable wordmark; it becomes a button only when a click handler is supplied. */
export function Mark({ onClick }: { onClick?: () => void } = {}) {
  const logo = (
    <span className="mark">
      VM<span>●</span>
    </span>
  );
  return onClick ? (
    <button className="mark-button" onClick={onClick} aria-label="Return to main menu">
      {logo}
    </button>
  ) : (
    logo
  );
}

/**
 * Reveals a heading character by character.
 *
 * The full string is always in the accessibility tree, and the animation is
 * skipped entirely when the user has asked for reduced motion — otherwise the
 * headline would appear to stutter for anyone sensitive to it.
 */
export function TypeText({
  text,
  delay = 0,
  className = "",
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const reduced =
    typeof document !== "undefined" && document.documentElement.dataset.motion === "reduced";
  const [visible, setVisible] = useState(reduced ? text.length : 0);

  useEffect(() => {
    if (reduced) {
      setVisible(text.length);
      return;
    }
    setVisible(0);
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        setVisible((count) => {
          if (count >= text.length) {
            if (timer) clearInterval(timer);
            return count;
          }
          return count + 1;
        });
      }, 105);
    }, delay * 1000);
    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
    };
  }, [text, delay, reduced]);

  return (
    <span className={`typed-text ${className}`} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, visible).replace(/ /g, " ")}</span>
      <i className={visible >= text.length ? "typed-caret done" : "typed-caret"} aria-hidden="true" />
    </span>
  );
}

export type BodyMapContext = "default" | "today" | "stats" | "recovery";

/**
 * Draws muscle overlays on the anatomy artwork.
 *
 * In `today`/`stats` mode a repeated muscle stacks into a darker green, so more
 * work on one group reads as more intensity. In `recovery` mode the same shapes
 * carry a readiness state instead of a count.
 */
export function BodyMap({
  active = [],
  context = "default",
  states,
  caption,
}: {
  active?: string[];
  context?: BodyMapContext;
  /** muscle → readiness state, used by the recovery view. */
  states?: Record<string, "fresh" | "recovering" | "stale">;
  caption?: ReactNode;
}) {
  const counts = active.reduce<Record<string, number>>(
    (all, muscle) => ({ ...all, [muscle]: (all[muscle] || 0) + 1 }),
    {},
  );
  const summary = Object.entries(counts).map(
    ([muscle, count]) => `${muscle}${count > 1 ? ` ×${count}` : ""}`,
  );

  return (
    <div
      className={`body-wrap clinical-body body-map-${context}`}
      aria-label={`Muscles trained: ${summary.join(", ") || "none"}`}
    >
      <div className="clinical-anatomy">
        {active.flatMap((muscle, index) => {
          const hit = active.slice(0, index + 1).filter((entry) => entry === muscle).length;
          const state = states?.[muscle];
          return (MUSCLE_POINTS[muscle] || []).map((point, pointIndex) => (
            <i
              className={`muscle-hit hit-${Math.min(hit, 4)}${state ? ` state-${state}` : ""} ${muscleClass(muscle)}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              key={`${muscle}-${index}-${pointIndex}`}
            />
          ));
        })}
      </div>
      <div className="clinical-legend">
        <span>FRONT</span>
        <b>{caption ?? (summary.length ? summary.join(" · ") : "No training logged")}</b>
        <span>BACK</span>
      </div>
    </div>
  );
}

/** Anatomy preview and movement-demo link shared by routine exercise cards. */
export function ExerciseMuscleMap({ name, muscle }: { name: string; muscle: string }) {
  const detected = inferMuscles(name, muscle);
  const all = [detected.primary, ...detected.secondary];

  return (
    <>
      <div className="exercise-map">
        <div className="anatomy-image">
          {all.flatMap((entry, index) =>
            (MUSCLE_POINTS[entry] || []).map((point, pointIndex) => (
              <i
                className={`${index === 0 ? "primary" : "secondary"} ${muscleClass(entry)}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                key={`${entry}-${pointIndex}`}
              />
            )),
          )}
        </div>
        <div>
          <span>MUSCLE MATCH</span>
          <b>{detected.primary}</b>
          <small>{MUSCLE_INFO[detected.primary]}</small>
          {detected.secondary.length > 0 && <small>Supports: {detected.secondary.join(" + ")}</small>}
        </div>
      </div>
      <a
        className="youtube-demo"
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form tutorial`)}`}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="plain-icon">▶︎</span>
        <b>Watch movement demo</b>
        <small>
          YouTube · proper form <span className="plain-icon">↗︎</span>
        </small>
      </a>
    </>
  );
}

/** Consistent zero state: what is missing, why it matters, and the way out. */
export function EmptyState({
  icon = "○",
  title,
  copy,
  action,
}: {
  icon?: string;
  title: string;
  copy: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="empty-state">
      <b aria-hidden="true">{icon}</b>
      <strong>{title}</strong>
      <p>{copy}</p>
      {action && (
        <button type="button" onClick={action.onClick}>
          {action.label} <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}

/** Section heading used by every card so titles stay on one rhythm. */
export function SectionHead({
  eyebrow,
  title,
  copy,
  aside,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        {copy && <p>{copy}</p>}
      </div>
      {aside}
    </header>
  );
}
