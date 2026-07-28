import { useMemo, useState } from "react";
import type { ActivityRecord, Exercise, FoodLog } from "../types";
import { dateKey, longDate } from "../lib/dates";
import { completedVolume, sumMacros, sessionExercises } from "../lib/metrics";
import { EmptyState } from "../components/primitives";

/**
 * Training archive.
 *
 * Each cell carries a volume-derived intensity so a month reads as a heatmap at
 * a glance, while the badges keep the exact activity types legible without
 * relying on colour.
 */
export function CalendarTab({
  records,
  foodLogs,
}: {
  records: ActivityRecord[];
  foodLogs: FoodLog[];
}) {
  const today = new Date();
  const todayKey = dateKey(today);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(todayKey);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  /** Session volume per date, used for the heat intensity of each cell. */
  const volumeByDate = useMemo(() => {
    const totals: Record<string, number> = {};
    records
      .filter((record) => record.type === "session")
      .forEach((record) => {
        totals[record.date] = (totals[record.date] ?? 0) + completedVolume(sessionExercises(record));
      });
    return totals;
  }, [records]);
  const peakVolume = Math.max(1, ...Object.values(volumeByDate));

  const keyFor = (day: number) => dateKey(new Date(year, month, day));
  const selectedRecords = records.filter((record) => record.date === selected);
  const selectedFood = foodLogs.filter((log) => log.date === selected);
  const foodTotals = sumMacros(selectedFood);
  const selectedPhotos = selectedRecords.filter((record) => record.type === "photo" && record.data);
  const selectedNotes = selectedRecords.filter((record) => record.type === "note");
  const selectedSessions = selectedRecords.filter((record) => record.type === "session");
  const detailExercises: Exercise[] = selectedSessions.flatMap(sessionExercises);
  const selectedLabel = longDate(selected);

  const trackedDays = new Set([...records.map((r) => r.date), ...foodLogs.map((l) => l.date)]).size;

  /** Arrow-key navigation across the month grid. */
  const moveSelection = (event: React.KeyboardEvent, key: string) => {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const next = new Date(`${key}T12:00:00`);
    next.setDate(next.getDate() + offset);
    setSelected(dateKey(next));
    if (next.getMonth() !== month) setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <div className="calendar-page fade-up">
      <div className="calendar-hero">
        <div>
          <span className="eyebrow">
            TRAINING + NUTRITION ARCHIVE / {records.length + foodLogs.length} ENTRIES
          </span>
          <h1>
            Every day,
            <br />
            <em>remembered.</em>
          </h1>
        </div>
        <div className="calendar-summary">
          <strong>{trackedDays}</strong>
          <span>TRACKED DAYS</span>
          <strong>{records.filter((record) => record.type === "session").length}</strong>
          <span>SESSIONS LOGGED</span>
        </div>
      </div>

      <section className="calendar-shell">
        <div className="calendar-toolbar">
          <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">
            ←
          </button>
          <h2>{cursor.toLocaleDateString("en-CA", { month: "long", year: "numeric" })}</h2>
          <div className="calendar-toolbar-right">
            <button
              type="button"
              className="calendar-today"
              onClick={() => {
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelected(todayKey);
              }}
            >
              Today
            </button>
            <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">
              →
            </button>
          </div>
        </div>

        <div className="calendar-weekdays">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-grid" role="grid" aria-label="Training calendar">
          {cells.map((day, index) => {
            if (!day) return <div className="calendar-empty" key={`empty-${index}`} />;
            const key = keyFor(day);
            const events = records.filter((record) => record.date === key);
            const dayFoods = foodLogs.filter((log) => log.date === key);
            const calories = Math.round(
              dayFoods.reduce((sum, log) => sum + log.calories * log.servings, 0),
            );
            const volume = volumeByDate[key] ?? 0;
            const heat = volume ? Math.min(4, Math.ceil((volume / peakVolume) * 4)) : 0;
            const visibleBadges = calories > 0 ? 2 : 3;
            return (
              <button
                key={key}
                type="button"
                className={`${key === selected ? "selected" : ""} ${key === todayKey ? "today-date" : ""} heat-${heat}`}
                onClick={() => setSelected(key)}
                onKeyDown={(event) => moveSelection(event, key)}
                aria-pressed={key === selected}
                aria-label={`${longDate(key)}${volume ? `, ${Math.round(volume).toLocaleString()} kilograms` : ""}${events.length ? `, ${events.length} entries` : ""}`}
              >
                <b>{day}</b>
                <div>
                  {calories > 0 && <span className="calories">{calories.toLocaleString()} KCAL</span>}
                  {events.slice(0, visibleBadges).map((event) => (
                    <span className={event.type} key={event.id}>
                      {event.type === "session" ? "SESSION" : event.type === "note" ? "NOTE" : "PHOTO"}
                    </span>
                  ))}
                </div>
                {events.length > visibleBadges && <small>+{events.length - visibleBadges} more</small>}
              </button>
            );
          })}
        </div>

        <div className="calendar-heat-legend">
          <span>LIGHTER</span>
          {[1, 2, 3, 4].map((step) => (
            <i key={step} className={`heat-${step}`} />
          ))}
          <span>HEAVIER SESSION</span>
        </div>
      </section>

      <aside className="day-detail">
        <span className="eyebrow">SELECTED DAY</span>
        <h3>{selectedLabel}</h3>

        {selectedFood.length > 0 && (
          <section className="calendar-nutrition">
            <span>CALORIES TRACKED</span>
            <strong>
              {Math.round(foodTotals.calories).toLocaleString()} <small>KCAL</small>
            </strong>
            <div>
              <b>
                {Math.round(foodTotals.protein)}g <small>PROTEIN</small>
              </b>
              <b>
                {Math.round(foodTotals.carbs)}g <small>CARBS</small>
              </b>
              <b>
                {Math.round(foodTotals.fat)}g <small>FAT</small>
              </b>
            </div>
            <p>
              {selectedFood.length} food entr{selectedFood.length === 1 ? "y" : "ies"}
            </p>
          </section>
        )}

        {selectedRecords.length ? (
          <>
            <div className="calendar-events">
              {selectedSessions.map((record) => (
                <article key={record.id}>
                  <i className={record.type} />
                  <div>
                    <span>SESSION</span>
                    <b>{record.title}</b>
                    <p>{record.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            {selectedPhotos.length > 0 && (
              <section className="selected-media">
                <span className="eyebrow">PROGRESS PHOTOS</span>
                <div className="selected-photo-grid">
                  {selectedPhotos.map((record) => (
                    <figure key={record.id}>
                      <img src={record.data} alt={`Progress logged on ${selectedLabel}`} />
                      <figcaption>{record.detail}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {selectedNotes.length > 0 && (
              <section className="selected-notes">
                <span className="eyebrow">ADDITIONAL NOTES</span>
                {selectedNotes.map((record) => (
                  <article key={record.id}>
                    <p>{record.detail || "No written note."}</p>
                  </article>
                ))}
              </section>
            )}
          </>
        ) : (
          selectedFood.length === 0 && (
            <EmptyState
              icon="○"
              title="Nothing logged this day"
              copy="Sessions, notes, photos and food entries all land here automatically once you save them."
            />
          )
        )}
      </aside>

      <section className="calendar-session-log">
        <div className="card-head">
          <div>
            <span className="eyebrow">
              SESSION LOG · {selected === todayKey ? "TODAY’S" : "SELECTED DAY’S"} DETAIL
            </span>
            <h3>{selectedLabel}</h3>
          </div>
          <span>
            {selectedSessions.length} {selectedSessions.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        {detailExercises.length > 0 ? (
          <div className="calendar-log-table">
            <div className="calendar-log-head">
              <span>EXERCISE</span>
              <span>MUSCLE</span>
              <span>SETS</span>
              <span>REPS</span>
              <span>KG</span>
              <span>MIN</span>
              <span>RPE</span>
            </div>
            {detailExercises.map((exercise, index) => (
              <div className="calendar-log-row" key={`${exercise.id}-${index}`}>
                <b>{exercise.name}</b>
                <span>{exercise.muscle}</span>
                <span>{exercise.sets}</span>
                <span>{exercise.reps}</span>
                <span>{exercise.weight}</span>
                <span>{exercise.duration}</span>
                <span>{exercise.difficulty}/10</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-log-empty">
            <b>No detailed session logged.</b>
            <p>Log a workout from the stat tracker to save every exercise and metric here.</p>
            {selectedSessions.length > 0 && (
              <small>
                Older session summaries remain above, but were saved before detailed snapshots were
                enabled.
              </small>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
