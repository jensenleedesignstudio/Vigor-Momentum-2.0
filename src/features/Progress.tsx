import { useMemo, useState } from "react";
import type {
  ActivityRecord,
  Exercise,
  FoodLog,
  Macros,
  Profile,
  StatEntry,
  WeightEntry,
} from "../types";
import { MUSCLES } from "../data/muscles";
import { DAY_IDS, dayLabel, shortDate } from "../lib/dates";
import {
  completedVolume,
  estimatedMinutes,
  progression,
  readiness,
  weekdayVolume,
  weeklyVolumeHistory,
} from "../lib/metrics";
import type { NotifyOptions } from "../hooks/useToasts";
import { BarChart } from "../components/charts";
import { BodyMap, EmptyState } from "../components/primitives";
import { MacroTracker } from "./MacroTracker";
import { StatTracker } from "./StatTracker";
import { Achievements } from "./Achievements";

const READINESS_COPY: Record<string, string> = {
  fresh: "Ready",
  recovering: "Recovering",
  stale: "Overdue",
};

/**
 * Performance view.
 *
 * Weekly and eight-week charts read from logged sessions, so the weekday a bar
 * belongs to is the day the work actually happened rather than the position of
 * an exercise in an array.
 */
export function Progress({
  exercises,
  update,
  trained,
  records,
  journal,
  setJournal,
  upload,
  notify,
  addRecord,
  foodLogs,
  setFoodLogs,
  macroTargets,
  setMacroTargets,
  statEntries,
  setStatEntries,
  weightEntries,
  setWeightEntries,
  profile,
  onLogSession,
  onBrowseFood,
  onResetWeek,
}: {
  exercises: Exercise[];
  update: (id: number, patch: Partial<Exercise>) => void;
  trained: string[];
  records: ActivityRecord[];
  journal: string;
  setJournal: (value: string) => void;
  upload: (files: FileList | null) => void;
  notify: (message: string, options?: NotifyOptions) => void;
  addRecord: (type: ActivityRecord["type"], title: string, detail: string, data?: string) => void;
  foodLogs: FoodLog[];
  setFoodLogs: React.Dispatch<React.SetStateAction<FoodLog[]>>;
  macroTargets: Macros;
  setMacroTargets: (targets: Macros) => void;
  statEntries: StatEntry[];
  setStatEntries: React.Dispatch<React.SetStateAction<StatEntry[]>>;
  weightEntries: WeightEntry[];
  setWeightEntries: React.Dispatch<React.SetStateAction<WeightEntry[]>>;
  profile: Profile;
  onLogSession: () => void;
  onBrowseFood: () => void;
  onResetWeek: () => void;
}) {
  const history = useMemo(() => weeklyVolumeHistory(records), [records]);
  const [selectedWeek, setSelectedWeek] = useState(history[history.length - 1]?.key ?? "");

  const weekdays = useMemo(() => weekdayVolume(records), [records]);
  const liveVolume = Math.round(completedVolume(exercises));
  const loggedThisWeek = weekdays.reduce((sum, day) => sum + day.volume, 0);
  const hasHistory = history.some((point) => point.volume > 0);

  const selected = history.find((point) => point.key === selectedWeek) ?? history[history.length - 1];
  const selectedIndex = history.findIndex((point) => point.key === selected?.key);
  const previous = selectedIndex > 0 ? history[selectedIndex - 1] : undefined;
  const weekChange =
    previous && previous.volume
      ? Math.round(((selected!.volume - previous.volume) / previous.volume) * 100)
      : 0;

  // Groups with real history come first, most overdue at the top; never-logged
  // groups trail behind so the rows that carry information are the visible ones.
  const recovery = readiness(records, [...MUSCLES]).sort((a, b) => {
    if (a.days === null && b.days === null) return a.muscle.localeCompare(b.muscle);
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    return b.days - a.days;
  });
  const photos = records.filter((record) => record.type === "photo" && record.data);

  const sessionSummary = `${exercises.length} exercises · ${liveVolume.toLocaleString()} kg volume`;

  return (
    <div className="progress-page fade-up">
      <div className="progress-grid">
        <section className="chart-card">
          <div className="volume-head">
            <div>
              <span className="eyebrow">TRAINING VOLUME / THIS WEEK</span>
              <strong className="hero-figure">
                {(loggedThisWeek || liveVolume).toLocaleString()} <small>KG</small>
              </strong>
              <p>
                {loggedThisWeek
                  ? `From ${weekdays.filter((day) => day.volume > 0).length} logged session${weekdays.filter((day) => day.volume > 0).length === 1 ? "" : "s"}.`
                  : `${liveVolume.toLocaleString()} kg is completed but not yet logged — log the session to bank it.`}
              </p>
            </div>
            <button
              className="volume-reset"
              type="button"
              onClick={onResetWeek}
              title="Mark every exercise as incomplete"
            >
              ↻ <span>RESET WEEK</span>
            </button>
          </div>
          <BarChart
            data={weekdays.map((day, index) => ({
              key: day.key,
              label: DAY_IDS[index].slice(0, 3).toUpperCase(),
              value: day.volume,
              sub: `${dayLabel(DAY_IDS[index])} ${shortDate(day.key)}`,
            }))}
            unit="KG"
            caption="Volume by weekday, from logged sessions"
            emptyMessage="Log a session and your week fills in here."
          />
        </section>

        <section className="body-progress">
          <div>
            <span className="eyebrow">MUSCLE BALANCE</span>
            <h3>{trained.length} groups</h3>
            <p>trained this cycle</p>
          </div>
          <BodyMap active={trained} context="stats" />
        </section>
      </div>

      <section className="recovery-card">
        <div className="stat-tracker-head">
          <span className="eyebrow">RECOVERY / DAYS SINCE LAST TRAINED</span>
          <h3>What’s fresh, what’s waiting.</h3>
          <p>Measured from logged sessions. Each row states its status in words, not colour alone.</p>
        </div>
        {recovery.some((entry) => entry.days !== null) ? (
          <ul className="recovery-list">
            {recovery.slice(0, 8).map((entry) => (
              <li key={entry.muscle} className={`state-${entry.days === null ? "none" : entry.state}`}>
                <b>{entry.muscle}</b>
                <span>{entry.days === null ? "Never logged" : `${entry.days}d ago`}</span>
                <em>{entry.days === null ? "No data" : READINESS_COPY[entry.state]}</em>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="◷"
            title="No recovery timeline yet"
            copy="Once you log a session, each muscle group starts counting the days since it was last trained."
            action={{ label: "Log today’s session", onClick: onLogSession }}
          />
        )}
      </section>

      <section className="history-card">
        <div className="history-copy">
          <span className="eyebrow">TOTAL VOLUME / 8-WEEK VIEW</span>
          <h3>Volume over time.</h3>
          <p>Select any week to inspect the exact training load recorded that week.</p>
          {selected && (
            <div className="selected-week-stat">
              <span>WEEK OF {selected.label.toUpperCase()}</span>
              <strong>
                {selected.volume.toLocaleString()} <small>KG</small>
              </strong>
              {previous && previous.volume > 0 ? (
                <b className={weekChange >= 0 ? "up" : "down"}>
                  {weekChange >= 0 ? "+" : ""}
                  {weekChange}% vs previous week
                </b>
              ) : (
                <b className="up">
                  {selected.sessions} session{selected.sessions === 1 ? "" : "s"} logged
                </b>
              )}
            </div>
          )}
        </div>
        <div className="history-visual">
          {hasHistory ? (
            <BarChart
              data={history.map((point) => ({
                key: point.key,
                label: point.label,
                value: point.volume,
                sub: `Week of ${point.label} · ${point.sessions} session${point.sessions === 1 ? "" : "s"}`,
              }))}
              unit="KG"
              height={240}
              selectedKey={selected?.key}
              onSelect={setSelectedWeek}
              caption="Weekly training volume over the last eight weeks"
            />
          ) : (
            <EmptyState
              icon="↗"
              title="Your history starts with the first logged session"
              copy="This chart shows real weekly volume rather than sample data, so it stays empty until you log a workout below."
              action={{ label: "Log today’s session", onClick: onLogSession }}
            />
          )}
        </div>
      </section>

      <StatTracker
        exercises={exercises}
        records={records}
        statEntries={statEntries}
        setStatEntries={setStatEntries}
        weightEntries={weightEntries}
        setWeightEntries={setWeightEntries}
        weightUnit={profile.weightUnit}
        notify={notify}
      />

      <MacroTracker
        foodLogs={foodLogs}
        setFoodLogs={setFoodLogs}
        macroTargets={macroTargets}
        setMacroTargets={setMacroTargets}
        onBrowseFood={onBrowseFood}
      />

      <section className="log-card">
        <div className="card-head">
          <div>
            <span className="eyebrow">SESSION LOG</span>
            <h3>Today’s details</h3>
            <p>
              Fill in load and effort and the coach can tell you when to progress. Suggested next
              loads appear once an exercise has both.
            </p>
          </div>
          <span>Difficulty / 10</span>
        </div>

        {exercises.length === 0 ? (
          <EmptyState
            icon="＋"
            title="No exercises to log"
            copy="Build a routine and its movements appear here ready to record."
          />
        ) : (
          <>
            <div className="log-head">
              <span>EXERCISE</span>
              <span>SETS</span>
              <span>REPS</span>
              <span>KG</span>
              <span>MIN</span>
              <span>RPE</span>
            </div>
            {exercises.map((exercise) => {
              const suggestion = exercise.done ? progression(exercise) : null;
              return (
                <div className="log-row" key={exercise.id}>
                  <b>
                    {exercise.name}
                    <small>{exercise.muscle}</small>
                    {suggestion && suggestion.delta !== 0 && (
                      <button
                        type="button"
                        className="progress-chip"
                        onClick={() => {
                          const before = exercise.weight;
                          update(exercise.id, { weight: suggestion.weight });
                          notify(`${exercise.name} set to ${suggestion.weight} kg.`, {
                            tone: "success",
                            undo: () => update(exercise.id, { weight: before }),
                          });
                        }}
                        title={suggestion.reason}
                      >
                        {suggestion.delta > 0 ? "↑" : "↓"} Next: {suggestion.weight} kg
                      </button>
                    )}
                  </b>
                  <input
                    type="number"
                    aria-label={`Sets for ${exercise.name}`}
                    value={exercise.sets}
                    onChange={(event) => update(exercise.id, { sets: Number(event.target.value) })}
                  />
                  <input
                    aria-label={`Reps for ${exercise.name}`}
                    value={exercise.reps}
                    onChange={(event) => update(exercise.id, { reps: event.target.value })}
                  />
                  <input
                    type="number"
                    aria-label={`Weight for ${exercise.name}`}
                    value={exercise.weight}
                    onChange={(event) => update(exercise.id, { weight: Number(event.target.value) })}
                  />
                  <input
                    type="number"
                    aria-label={`Minutes for ${exercise.name}`}
                    placeholder={String(estimatedMinutes(exercise))}
                    value={exercise.duration || ""}
                    onChange={(event) => update(exercise.id, { duration: Number(event.target.value) })}
                  />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    aria-label={`Effort for ${exercise.name}`}
                    value={exercise.difficulty}
                    onChange={(event) =>
                      update(exercise.id, { difficulty: Number(event.target.value) })
                    }
                  />
                </div>
              );
            })}
            <button className="log-save" type="button" onClick={onLogSession}>
              Log session ↗ <small>{sessionSummary}</small>
            </button>
          </>
        )}
      </section>

      <Achievements records={records} foodLogs={foodLogs} statEntries={statEntries} />

      <div className="journal-grid">
        <section className="journal">
          <span className="eyebrow">DAILY NOTE / {shortDate(new Date().toISOString().slice(0, 10)).toUpperCase()}</span>
          <h3>How did it feel?</h3>
          <textarea
            value={journal}
            onChange={(event) => setJournal(event.target.value)}
            aria-label="Daily training note"
          />
          <button
            type="button"
            onClick={() => {
              if (!journal.trim()) {
                notify("Write something first — an empty note is not worth saving.", { tone: "warn" });
                return;
              }
              addRecord("note", "Daily fitness note", journal);
              notify("Journal entry saved to Calendar.", { tone: "success" });
            }}
          >
            Save entry ↗
          </button>
        </section>

        <section className="photos">
          <span className="eyebrow">PROGRESS PHOTOS / OPTIONAL</span>
          <h3>See the long game.</h3>
          <div className="photo-row">
            {photos.slice(-6).map((record) => (
              <img key={record.id} src={record.data} alt={`Progress photo from ${shortDate(record.date)}`} />
            ))}
            {!photos.length && <p className="photo-empty">No photos yet.</p>}
          </div>
          <label className="upload">
            <input type="file" accept="image/*" multiple onChange={(event) => upload(event.target.files)} />
            <span aria-hidden="true">＋</span>
            <b>
              Add photos
              <small>Private to this device · saved to Calendar</small>
            </b>
          </label>
        </section>
      </div>
    </div>
  );
}
