import type { FoodLog, Macros } from "../types";
import { addDays, dateKey, startOfWeek } from "../lib/dates";
import { sumMacros } from "../lib/metrics";
import { Meter } from "../components/charts";
import { EmptyState } from "../components/primitives";

const MACRO_ROWS = [
  { key: "calories", label: "Calories", unit: "KCAL", series: 0 },
  { key: "protein", label: "Protein", unit: "G", series: 1 },
  { key: "carbs", label: "Carbs", unit: "G", series: 2 },
  { key: "fat", label: "Fat", unit: "G", series: 3 },
] as const;

/**
 * Weekly nutrition view.
 *
 * Targets are daily and persisted with the rest of the preferences, so the
 * weekly comparison is `target × 7` rather than a number that resets on reload.
 */
export function MacroTracker({
  foodLogs,
  setFoodLogs,
  macroTargets,
  setMacroTargets,
  onBrowseFood,
}: {
  foodLogs: FoodLog[];
  setFoodLogs: React.Dispatch<React.SetStateAction<FoodLog[]>>;
  macroTargets: Macros;
  setMacroTargets: (targets: Macros) => void;
  onBrowseFood: () => void;
}) {
  const monday = startOfWeek();
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const todayKey = dateKey();
  const weekKeySet = new Set(weekDays.map((day) => dateKey(day)));
  const weekLogs = foodLogs.filter((log) => weekKeySet.has(log.date));
  const weekMacros = sumMacros(weekLogs);

  const weeklyTargets: Macros = {
    calories: macroTargets.calories * 7,
    protein: macroTargets.protein * 7,
    carbs: macroTargets.carbs * 7,
    fat: macroTargets.fat * 7,
  };

  const updateServing = (id: number, value: number) =>
    setFoodLogs((logs) =>
      logs.map((log) => (log.id === id ? { ...log, servings: Math.max(0.25, value) } : log)),
    );

  return (
    <section className="macro-tracker">
      <div className="macro-head">
        <div>
          <span className="eyebrow">MACRO TRACKER / THIS WEEK</span>
          <h3>Fuel, made visible.</h3>
          <p>
            Foods logged from Snack Bar appear here automatically. Adjust portions, compare weekly
            intake against your targets, and spot low-fuel days before they cost you a session.
          </p>
        </div>
        <div className="macro-date">
          <span>WEEK OF</span>
          <b>
            {monday.toLocaleDateString("en-CA", { month: "short", day: "numeric" }).toUpperCase()} —{" "}
            {weekDays[6].toLocaleDateString("en-CA", { month: "short", day: "numeric" }).toUpperCase()}
          </b>
        </div>
      </div>

      <div className="macro-targets">
        {MACRO_ROWS.map((row) => (
          <label key={row.key}>
            {row.label.toUpperCase()} / DAILY
            <input
              type="number"
              min="0"
              value={macroTargets[row.key]}
              onChange={(event) =>
                setMacroTargets({ ...macroTargets, [row.key]: Math.max(0, Number(event.target.value)) })
              }
            />
            <span>{row.unit}</span>
          </label>
        ))}
      </div>

      <div className="macro-summary">
        {MACRO_ROWS.map((row) => {
          const total = weekMacros[row.key];
          const target = weeklyTargets[row.key];
          const share = target ? Math.round((total / target) * 100) : 0;
          return (
            <article key={row.key} data-series={row.series}>
              <span className="eyebrow">{row.label.toUpperCase()}</span>
              <strong>
                {Math.round(total).toLocaleString()} <small>{row.unit}</small>
              </strong>
              <Meter
                value={total}
                max={target || 1}
                status={share > 115 ? "over" : share >= 80 ? "good" : "under"}
                label={`${row.label}: ${Math.round(total)} of ${target} ${row.unit}`}
              />
              <p>
                {share}% of {target.toLocaleString()} {row.unit.toLowerCase()}
              </p>
            </article>
          );
        })}
      </div>

      {weekLogs.length === 0 ? (
        <EmptyState
          icon="◇"
          title="No food logged this week"
          copy="Log a snack or meal from the Snack Bar and this week fills in automatically — including the calendar and the weekly report."
          action={{ label: "Open Snack Bar", onClick: onBrowseFood }}
        />
      ) : (
        <div className="macro-week">
          {weekDays.map((day) => {
            const key = dateKey(day);
            const logs = weekLogs.filter((log) => log.date === key);
            const totals = sumMacros(logs);
            return (
              <article className={`macro-day ${key === todayKey ? "today" : ""}`} key={key}>
                <header>
                  <div>
                    <span>{day.toLocaleDateString("en-CA", { weekday: "short" }).toUpperCase()}</span>
                    <b>{day.getDate()}</b>
                  </div>
                  <strong>
                    {Math.round(totals.calories)}
                    <small>KCAL</small>
                  </strong>
                </header>
                <div className="macro-mini">
                  <span>
                    <b>{Math.round(totals.protein)}g</b>P
                  </span>
                  <span>
                    <b>{Math.round(totals.carbs)}g</b>C
                  </span>
                  <span>
                    <b>{Math.round(totals.fat)}g</b>F
                  </span>
                </div>
                <div className="macro-food-list">
                  {logs.map((log) => (
                    <div key={log.id}>
                      <span>{log.name}</span>
                      <label>
                        <input
                          aria-label={`Servings of ${log.name}`}
                          type="number"
                          min="0.25"
                          step="0.25"
                          value={log.servings}
                          onChange={(event) => updateServing(log.id, Number(event.target.value))}
                        />
                        ×
                      </label>
                      <button
                        type="button"
                        onClick={() => setFoodLogs((items) => items.filter((item) => item.id !== log.id))}
                        aria-label={`Remove ${log.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {!logs.length && <p>No food logged</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <button className="macro-catalogue-link" type="button" onClick={onBrowseFood}>
        Browse Snack Bar <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
