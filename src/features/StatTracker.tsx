import { useMemo, useState } from "react";
import type { ActivityRecord, Exercise, StatEntry, StatMetric, WeightEntry } from "../types";
import { CATALOGUE } from "../data/catalogue";
import { dateKey, shortDate } from "../lib/dates";
import { bestLifts, trendDelta } from "../lib/metrics";
import type { NotifyOptions } from "../hooks/useToasts";
import { BarChart, StatTile } from "../components/charts";
import { EmptyState } from "../components/primitives";

const METRICS: { metric: StatMetric; label: string; unit: string; upIsGood: boolean }[] = [
  { metric: "TOTAL VOLUME", label: "TOTAL VOLUME", unit: "KG", upIsGood: true },
  { metric: "BEST PR", label: "BEST PR", unit: "KG", upIsGood: true },
  { metric: "REPS", label: "AVG REPS", unit: "REPS", upIsGood: true },
  { metric: "TIME", label: "TOTAL TIME", unit: "MIN", upIsGood: true },
];

/**
 * Per-exercise performance history.
 *
 * Every number here comes from something the user saved: manual data points for
 * the four metrics, and personal records read straight out of logged sessions.
 * Nothing is seeded with placeholder trend data.
 */
export function StatTracker({
  exercises,
  records,
  statEntries,
  setStatEntries,
  weightEntries,
  setWeightEntries,
  weightUnit,
  notify,
}: {
  exercises: Exercise[];
  records: ActivityRecord[];
  statEntries: StatEntry[];
  setStatEntries: React.Dispatch<React.SetStateAction<StatEntry[]>>;
  weightEntries: WeightEntry[];
  setWeightEntries: React.Dispatch<React.SetStateAction<WeightEntry[]>>;
  weightUnit: string;
  notify: (message: string, options?: NotifyOptions) => void;
}) {
  const exerciseOptions = useMemo(
    () =>
      Array.from(new Set([...exercises.map((e) => e.name), ...CATALOGUE.map((e) => e.name)])).sort(),
    [exercises],
  );

  const [tracked, setTracked] = useState(exercises[0]?.name || exerciseOptions[0] || "");
  const [metric, setMetric] = useState<StatMetric>("TOTAL VOLUME");
  const [entryDate, setEntryDate] = useState(dateKey());
  const [entryValue, setEntryValue] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [bodyDate, setBodyDate] = useState(dateKey());

  const units: Record<StatMetric, string> = {
    "TOTAL VOLUME": "KG",
    "BEST PR": "KG",
    REPS: "REPS",
    TIME: "MIN",
  };

  const pointsFor = (which: StatMetric) =>
    statEntries
      .filter(
        (entry) =>
          entry.exercise.toLowerCase() === tracked.trim().toLowerCase() && entry.metric === which,
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  const tiles = METRICS.map((definition) => {
    const points = pointsFor(definition.metric);
    const current = points.at(-1)?.value ?? 0;
    const previous = points.at(-2)?.value ?? 0;
    return {
      ...definition,
      current,
      previous,
      latestDate: points.at(-1)?.date ?? "",
      delta: trendDelta(current, previous),
      series: points.slice(-8).map((point) => point.value),
    };
  });

  const visible = pointsFor(metric);
  const chartData = visible.slice(-10).map((entry) => ({
    key: String(entry.id),
    label: shortDate(entry.date),
    value: entry.value,
    sub: entry.date,
  }));

  const addEntry = () => {
    const exercise = tracked.trim();
    const value = Number(entryValue);
    if (!exercise) {
      notify("Choose or type an exercise first.", { tone: "warn" });
      return;
    }
    if (!entryDate || !Number.isFinite(value) || value < 0) {
      notify("Add a valid date and a number that is zero or higher.", { tone: "warn" });
      return;
    }
    const entry: StatEntry = { id: Date.now(), exercise, metric, value, date: entryDate };
    setStatEntries((entries) => [...entries, entry]);
    setEntryValue("");
    notify(`${metric.toLowerCase()} saved for ${exercise}.`, {
      tone: "success",
      undo: () => setStatEntries((entries) => entries.filter((item) => item.id !== entry.id)),
    });
  };

  const records8 = useMemo(() => bestLifts(records), [records]);
  const prRows = Object.entries(records8)
    .map(([key, value]) => ({
      key,
      name:
        exercises.find((exercise) => exercise.name.toLowerCase() === key)?.name ??
        CATALOGUE.find((item) => item.name.toLowerCase() === key)?.name ??
        key,
      ...value,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);

  const sortedWeights = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date));
  const weightChart = sortedWeights.slice(-12).map((entry) => ({
    key: String(entry.id),
    label: shortDate(entry.date),
    value: entry.value,
    sub: entry.date,
  }));
  const weightDelta =
    sortedWeights.length >= 2
      ? sortedWeights.at(-1)!.value - sortedWeights.at(-2)!.value
      : 0;

  const addWeight = () => {
    const value = Number(bodyWeight);
    if (!Number.isFinite(value) || value <= 0) {
      notify("Enter a body weight above zero.", { tone: "warn" });
      return;
    }
    const entry: WeightEntry = { id: Date.now(), date: bodyDate, value, unit: weightUnit };
    setWeightEntries((entries) => [...entries.filter((item) => item.date !== bodyDate), entry]);
    setBodyWeight("");
    notify(`Body weight saved for ${shortDate(bodyDate)}.`, {
      tone: "success",
      undo: () => setWeightEntries((entries) => entries.filter((item) => item.id !== entry.id)),
    });
  };

  return (
    <>
      <section className="stat-tracker">
        <div className="stat-tracker-head">
          <span className="eyebrow">STAT TRACKER / PERFORMANCE</span>
          <h3>Track the numbers you’re stacking.</h3>
          <p>
            Choose an exercise, pick the measurement, then add a dated result. Select any tile to
            switch the chart below. History stays on this device.
          </p>
        </div>

        <div className="stat-entry-form">
          <label>
            EXERCISE
            <input
              list="stat-exercises"
              value={tracked}
              onChange={(event) => setTracked(event.target.value)}
              placeholder="Type or choose an exercise…"
            />
            <datalist id="stat-exercises">
              {exerciseOptions.map((name) => (
                <option value={name} key={name} />
              ))}
            </datalist>
          </label>
          <label>
            DATE
            <input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
          </label>
          <label>
            VALUE / {units[metric]}
            <input
              type="number"
              min="0"
              step="any"
              value={entryValue}
              onChange={(event) => setEntryValue(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addEntry()}
              placeholder="Enter result"
            />
          </label>
          <button type="button" onClick={addEntry}>
            ＋ Add data point
          </button>
        </div>

        <div className="stat-grid">
          {tiles.map((tile) => (
            <StatTile
              key={tile.metric}
              label={tile.label}
              value={tile.current ? tile.current.toLocaleString() : "—"}
              unit={tile.current ? tile.unit : undefined}
              delta={tile.previous ? tile.delta : undefined}
              deltaLabel="vs previous"
              upIsGood={tile.upIsGood}
              trend={tile.series}
              footnote={
                tile.latestDate
                  ? `${tracked || "No exercise"} · latest ${shortDate(tile.latestDate)}`
                  : `${tracked || "Choose an exercise"} · no entries yet`
              }
              selected={metric === tile.metric}
              onClick={() => setMetric(tile.metric)}
            />
          ))}
        </div>

        <div className="tracked-history">
          <div className="tracked-history-head">
            <div>
              <span className="eyebrow">
                {metric} / {tracked || "SELECT EXERCISE"}
              </span>
              <h4>
                {visible.length
                  ? `${visible.length} saved data point${visible.length === 1 ? "" : "s"}`
                  : "No data yet"}
              </h4>
            </div>
            {visible.length > 0 && (
              <strong>
                {visible.at(-1)?.value.toLocaleString()} <small>{units[metric]}</small>
              </strong>
            )}
          </div>

          {chartData.length ? (
            <>
              <BarChart
                data={chartData}
                unit={units[metric]}
                caption={`${metric.toLowerCase()} for ${tracked}, last ${chartData.length} entries`}
              />
              <ul className="entry-list">
                {[...visible]
                  .reverse()
                  .slice(0, 6)
                  .map((entry) => (
                    <li key={entry.id}>
                      <b>{shortDate(entry.date)}</b>
                      <span>
                        {entry.value.toLocaleString()} {units[metric].toLowerCase()}
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete entry from ${shortDate(entry.date)}`}
                        onClick={() => {
                          setStatEntries((entries) => entries.filter((item) => item.id !== entry.id));
                          notify("Data point removed.", {
                            tone: "warn",
                            undo: () => setStatEntries((entries) => [...entries, entry]),
                          });
                        }}
                      >
                        ×
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          ) : (
            <EmptyState
              icon="↗"
              title="No data for this metric yet"
              copy="Add the first dated result above and this chart starts drawing your trend."
            />
          )}
        </div>
      </section>

      <section className="pr-card">
        <div className="stat-tracker-head">
          <span className="eyebrow">PERSONAL RECORDS / FROM LOGGED SESSIONS</span>
          <h3>Your heaviest work.</h3>
          <p>Read automatically from every session you log — no separate entry needed.</p>
        </div>
        {prRows.length ? (
          <table className="pr-table">
            <thead>
              <tr>
                <th scope="col">Exercise</th>
                <th scope="col">Best load</th>
                <th scope="col">Set on</th>
              </tr>
            </thead>
            <tbody>
              {prRows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.name}</th>
                  <td>{row.weight.toLocaleString()} kg</td>
                  <td>{shortDate(row.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon="★"
            title="No records yet"
            copy="Log a session with a weight against at least one exercise and your personal records appear here."
          />
        )}
      </section>

      <section className="weight-card">
        <div className="stat-tracker-head">
          <span className="eyebrow">BODY WEIGHT / TREND</span>
          <h3>The slow-moving number.</h3>
          <p>
            Weigh in at the same time of day. One reading means nothing; the direction over weeks is
            the signal.
          </p>
        </div>
        <div className="weight-form">
          <label>
            DATE
            <input type="date" value={bodyDate} onChange={(event) => setBodyDate(event.target.value)} />
          </label>
          <label>
            WEIGHT / {weightUnit.toUpperCase()}
            <input
              type="number"
              min="0"
              step="0.1"
              value={bodyWeight}
              onChange={(event) => setBodyWeight(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addWeight()}
              placeholder="e.g. 75.4"
            />
          </label>
          <button type="button" onClick={addWeight}>
            ＋ Save weigh-in
          </button>
          {sortedWeights.length >= 2 && (
            <p className="weight-delta">
              {weightDelta === 0
                ? "No change since the last weigh-in."
                : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} ${weightUnit} since your last weigh-in.`}
            </p>
          )}
        </div>
        {weightChart.length > 1 ? (
          <BarChart
            data={weightChart}
            unit={weightUnit.toUpperCase()}
            height={190}
            caption={`Body weight, last ${weightChart.length} weigh-ins`}
          />
        ) : (
          <EmptyState
            icon="⚖"
            title="Two weigh-ins draw a trend"
            copy="Save today’s reading and one more later in the week to start the line."
          />
        )}
      </section>
    </>
  );
}
