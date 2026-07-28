import { useState } from "react";
import type { ActivityRecord, Exercise, FoodLog, Macros, Profile, Tab, WeightEntry } from "../types";
import { weeklyReview } from "../lib/coach";
import { muscleBalance } from "../lib/metrics";
import { Meter } from "../components/charts";

const TONE_ICON: Record<string, string> = {
  positive: "✓",
  focus: "!",
  neutral: "•",
  alert: "▲",
};

const STATUS_COPY: Record<string, string> = {
  none: "Not trained",
  under: "Under range",
  "in-range": "In range",
  over: "Above range",
};

/**
 * The weekly coaching report.
 *
 * Every card is generated from live data by `weeklyReview`, ranked by how much
 * attention it needs, and carries the tab it would send you to. The score is
 * expandable so the number can always be explained rather than just asserted.
 */
export function WeeklyReport({
  exercises,
  records,
  foodLogs,
  macroTargets,
  profile,
  weightEntries,
  setTab,
}: {
  exercises: Exercise[];
  records: ActivityRecord[];
  foodLogs: FoodLog[];
  macroTargets: Macros;
  profile: Profile;
  weightEntries: WeightEntry[];
  setTab: (tab: Tab) => void;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const review = weeklyReview({ exercises, records, foodLogs, macroTargets, profile, weightEntries });
  const balance = muscleBalance(exercises).filter((row) => row.sets > 0);
  const visible = showAll ? review.insights : review.insights.slice(0, 4);

  return (
    <section className="weekly-report">
      <header>
        <div>
          <span className="eyebrow">WEEKLY REPORT / COACHING FEEDBACK</span>
          <h3>{review.headline}</h3>
          <p>
            Generated from your routine, completed work, effort, recovery gaps and nutrition logs —
            recalculated every time you log something.
          </p>
        </div>
        <button
          type="button"
          className="weekly-score"
          onClick={() => setShowBreakdown((open) => !open)}
          aria-expanded={showBreakdown}
          aria-label={`Weekly score ${review.score} out of 100. Show how it is calculated.`}
        >
          <strong>{review.score}</strong>
          <span>
            / 100
            <br />
            WEEK SCORE
          </span>
        </button>
      </header>

      {showBreakdown && (
        <div className="score-breakdown">
          {review.parts.map((part) => (
            <div key={part.key}>
              <div className="score-breakdown-top">
                <b>{part.label}</b>
                <span>
                  {part.value}/{part.weight}
                </span>
              </div>
              <Meter
                value={part.value}
                max={part.weight}
                status={part.value / part.weight >= 0.75 ? "good" : part.value === 0 ? "under" : "in-range"}
                label={`${part.label}: ${part.value} of ${part.weight} points`}
              />
              <small>{part.hint}</small>
            </div>
          ))}
        </div>
      )}

      <div className="weekly-report-stats">
        {review.parts.map((part) => (
          <div key={part.key}>
            <strong>
              {part.value}
              <small>/{part.weight}</small>
            </strong>
            <span>{part.label.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <div className="weekly-feedback">
        {visible.map((insight, index) => (
          <article className={insight.tone} key={insight.id}>
            <span>
              <i aria-hidden="true">{TONE_ICON[insight.tone]}</i>
              {String(index + 1).padStart(2, "0")} / {insight.label}
            </span>
            <h4>{insight.title}</h4>
            <p>{insight.copy}</p>
            {insight.action && (
              <button type="button" onClick={() => setTab(insight.action!.tab)}>
                {insight.action.label} <span aria-hidden="true">→</span>
              </button>
            )}
          </article>
        ))}
      </div>

      {review.insights.length > 4 && (
        <button type="button" className="weekly-more" onClick={() => setShowAll((open) => !open)}>
          {showAll
            ? "Show fewer insights"
            : `Show ${review.insights.length - 4} more insight${review.insights.length - 4 === 1 ? "" : "s"}`}
        </button>
      )}

      {balance.length > 0 && (
        <section className="balance-panel">
          <div className="balance-head">
            <span className="eyebrow">WEEKLY SET VOLUME / VS LANDMARKS</span>
            <p>
              Planned working sets per muscle group against the weekly range most lifters progress
              inside. Bars are labelled, so the state never depends on colour alone.
            </p>
          </div>
          <ul className="balance-list">
            {balance.map((row) => (
              <li key={row.muscle}>
                <b>{row.muscle}</b>
                <Meter
                  value={row.sets}
                  max={row.max}
                  threshold={row.min}
                  status={row.status}
                  label={`${row.muscle}: ${row.sets} sets, target ${row.min} to ${row.max}`}
                />
                <span className="balance-value">
                  {row.sets}
                  <small>
                    /{row.min}–{row.max}
                  </small>
                </span>
                <em className={`balance-status status-${row.status}`}>{STATUS_COPY[row.status]}</em>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer>
        <p>
          <b>Next best move:</b> {review.nextMove.copy}
        </p>
        {review.nextMove.action && (
          <button type="button" onClick={() => setTab(review.nextMove.action!.tab)}>
            {review.nextMove.action.label} <span aria-hidden="true">→</span>
          </button>
        )}
      </footer>
    </section>
  );
}
