import type { ActivityRecord, FoodLog, StatEntry } from "../types";
import { achievements } from "../lib/coach";
import { Meter } from "../components/charts";

/**
 * Milestones computed from real history. Locked badges show how far away they
 * are rather than hiding the goal, which is the part that actually motivates.
 */
export function Achievements({
  records,
  foodLogs,
  statEntries,
}: {
  records: ActivityRecord[];
  foodLogs: FoodLog[];
  statEntries: StatEntry[];
}) {
  const badges = achievements(records, foodLogs, statEntries);
  const unlocked = badges.filter((badge) => badge.unlocked).length;

  return (
    <section className="achievements">
      <div className="stat-tracker-head">
        <span className="eyebrow">MILESTONES / {unlocked} OF {badges.length} UNLOCKED</span>
        <h3>Proof of the long game.</h3>
        <p>Each one is earned from logged history — nothing is awarded for opening the app.</p>
      </div>
      <ul className="badge-grid">
        {badges.map((badge) => (
          <li key={badge.id} className={badge.unlocked ? "unlocked" : ""}>
            <b aria-hidden="true">{badge.unlocked ? "★" : "☆"}</b>
            <strong>{badge.name}</strong>
            <small>{badge.detail}</small>
            {!badge.unlocked && (
              <Meter
                value={badge.progress * 100}
                max={100}
                status="in-range"
                label={`${badge.name}: ${Math.round(badge.progress * 100)}% complete`}
              />
            )}
            <em>{badge.unlocked ? "Unlocked" : `${Math.round(badge.progress * 100)}%`}</em>
          </li>
        ))}
      </ul>
    </section>
  );
}
