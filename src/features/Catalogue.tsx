import { useEffect, useMemo, useState } from "react";
import type { CatalogueItem, FoodItem } from "../types";
import { CATALOGUE, CATALOGUE_CATEGORIES, catalogueFallbackMuscle } from "../data/catalogue";
import { FOOD_CATALOGUE, foodSprite } from "../data/foods";
import { MUSCLE_POINTS, inferMuscles, muscleClass } from "../data/muscles";
import { DAY_IDS, dateKey, dayLabel } from "../lib/dates";
import { EmptyState } from "../components/primitives";

type Library = "exercise" | "food";
type ExerciseSort = "default" | "name" | "sets";
type FoodSort = "default" | "protein" | "calories-asc" | "calories-desc";

/**
 * The two libraries share one shell: search, category chips, a destination
 * control, and a results grid.
 *
 * Food photography is positioned from the data model now — the previous build
 * reached into the DOM after paint and parsed card text to patch sprite offsets,
 * which broke whenever the grid re-ordered.
 */
export function Catalogue({
  addExercise,
  addFood,
  restDays,
  defaultLibrary = "exercise",
}: {
  addExercise: (item: CatalogueItem, day: string) => void;
  addFood: (item: FoodItem, date: string, servings: number) => void;
  restDays: Record<string, boolean>;
  defaultLibrary?: Library;
}) {
  const [library, setLibrary] = useState<Library>(defaultLibrary);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [day, setDay] = useState("monday");
  const [foodDate, setFoodDate] = useState(dateKey());
  const [servings, setServings] = useState(1);
  const [exerciseSort, setExerciseSort] = useState<ExerciseSort>("default");
  const [foodSort, setFoodSort] = useState<FoodSort>("default");

  // Never leave the destination pointing at a rest day.
  useEffect(() => {
    if (!restDays[day]) return;
    const open = DAY_IDS.find((id) => !restDays[id]);
    if (open) setDay(open);
  }, [day, restDays]);

  const results = useMemo(() => {
    const needle = query.toLowerCase();
    const filtered = CATALOGUE.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        `${item.name} ${item.equipment} ${item.muscles}`.toLowerCase().includes(needle),
    );
    if (exerciseSort === "name") return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (exerciseSort === "sets") return [...filtered].sort((a, b) => b.sets - a.sets);
    return filtered;
  }, [category, query, exerciseSort]);

  const foods = useMemo(() => {
    const needle = query.toLowerCase();
    const filtered = FOOD_CATALOGUE.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        `${item.name} ${item.ingredients} ${item.benefits}`.toLowerCase().includes(needle),
    );
    if (foodSort === "protein") return [...filtered].sort((a, b) => b.protein - a.protein);
    if (foodSort === "calories-asc") return [...filtered].sort((a, b) => a.calories - b.calories);
    if (foodSort === "calories-desc") return [...filtered].sort((a, b) => b.calories - a.calories);
    return filtered;
  }, [category, query, foodSort]);

  const switchLibrary = (next: Library) => {
    setLibrary(next);
    setCategory("All");
    setQuery("");
  };

  return (
    <div className="catalogue-page fade-up">
      <div className="section-switch" role="tablist" aria-label="Library">
        <button
          type="button"
          role="tab"
          aria-selected={library === "exercise"}
          className={library === "exercise" ? "active" : ""}
          onClick={() => switchLibrary("exercise")}
        >
          Exercise catalogue <span>{CATALOGUE.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={library === "food"}
          className={library === "food" ? "active" : ""}
          onClick={() => switchLibrary("food")}
        >
          Snack Bar <span>{FOOD_CATALOGUE.length}</span>
        </button>
      </div>

      {library === "exercise" ? (
        <>
          <section className="catalogue-hero">
            <div>
              <span className="eyebrow">EXERCISE LIBRARY / {CATALOGUE.length} MOVEMENTS</span>
              <h1>
                Find the next
                <br />
                <em>movement.</em>
              </h1>
              <p>
                Search the complete strength catalogue, inspect the target area, then add any
                movement directly to your week.
              </p>
            </div>
            <div className="catalogue-controls">
              <label className="catalogue-search">
                <span aria-hidden="true">⌕</span>
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search exercise, equipment, or muscle…"
                  aria-label="Search exercises"
                />
              </label>
              <div className="catalogue-control-row">
                <label>
                  ADD EXERCISES TO
                  <select value={day} onChange={(event) => setDay(event.target.value)}>
                    {DAY_IDS.map((id) => (
                      <option value={id} key={id} disabled={restDays[id]}>
                        {dayLabel(id)}
                        {restDays[id] ? " (rest)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  SORT BY
                  <select
                    value={exerciseSort}
                    onChange={(event) => setExerciseSort(event.target.value as ExerciseSort)}
                  >
                    <option value="default">Default</option>
                    <option value="name">Name A–Z</option>
                    <option value="sets">Sets ↓</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <nav className="catalogue-categories" aria-label="Exercise categories">
            {CATALOGUE_CATEGORIES.map((entry) => (
              <button
                type="button"
                className={category === entry ? "active" : ""}
                onClick={() => setCategory(entry)}
                key={entry}
                aria-pressed={category === entry}
              >
                {entry}
                <span>
                  {entry === "All"
                    ? CATALOGUE.length
                    : CATALOGUE.filter((item) => item.category === entry).length}
                </span>
              </button>
            ))}
          </nav>

          <div className="catalogue-result-head">
            <span>{results.length} RESULTS</span>
            <span>IDEAL WORKING SETS</span>
          </div>

          <section className="catalogue-grid">
            {results.map((item) => {
              const muscle = inferMuscles(item.name, catalogueFallbackMuscle(item.category)).primary;
              return (
                <article className="catalogue-card" key={item.id}>
                  <div className="catalogue-number">
                    {String(item.id).padStart(3, "0")}
                    <span>{item.category}</span>
                  </div>
                  <div className="catalogue-thumb">
                    <div className="anatomy-image">
                      {(MUSCLE_POINTS[muscle] || []).map((point, index) => (
                        <i
                          className={`primary ${muscleClass(muscle)}`}
                          style={{ left: `${point.x}%`, top: `${point.y}%` }}
                          key={index}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="catalogue-info">
                    <h3>{item.name}</h3>
                    <dl>
                      <div>
                        <dt>EQUIPMENT</dt>
                        <dd>{item.equipment}</dd>
                      </div>
                      <div>
                        <dt>PRIMARY MUSCLES</dt>
                        <dd>{item.muscles}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="catalogue-prescription">
                    <strong>
                      {item.sets}
                      <small>SETS</small>
                    </strong>
                    <b aria-hidden="true">×</b>
                    <strong>
                      {item.reps}
                      <small>REPS</small>
                    </strong>
                  </div>
                  <button type="button" onClick={() => addExercise(item, day)}>
                    ＋ Add to {dayLabel(day).slice(0, 3)}.
                  </button>
                </article>
              );
            })}
          </section>

          {!results.length && (
            <EmptyState
              icon="⌕"
              title="Nothing found"
              copy="Try another movement name, equipment type, or muscle group."
              action={{ label: "Clear the search", onClick: () => { setQuery(""); setCategory("All"); } }}
            />
          )}
        </>
      ) : (
        <>
          <section className="catalogue-hero food-hero">
            <div>
              <span className="eyebrow">SNACK BAR / {FOOD_CATALOGUE.length} FOODS</span>
              <h1>
                Fuel your next
                <br />
                <em>move.</em>
              </h1>
              <p>
                Browse curated snacks and healthy meals, see the macro split, and log a serving
                directly to your tracker.
              </p>
            </div>
            <div className="catalogue-controls">
              <label className="catalogue-search">
                <span aria-hidden="true">⌕</span>
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search food, ingredient, or benefit…"
                  aria-label="Search foods"
                />
              </label>
              <div className="catalogue-control-row">
                <label>
                  LOG FOOD ON
                  <input
                    type="date"
                    value={foodDate}
                    onChange={(event) => setFoodDate(event.target.value)}
                  />
                </label>
                <label>
                  SERVINGS
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={servings}
                    onChange={(event) => setServings(Math.max(0.25, Number(event.target.value)))}
                  />
                </label>
                <label>
                  SORT BY
                  <select value={foodSort} onChange={(event) => setFoodSort(event.target.value as FoodSort)}>
                    <option value="default">Default</option>
                    <option value="protein">Protein ↓</option>
                    <option value="calories-asc">Calories ↑</option>
                    <option value="calories-desc">Calories ↓</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <nav className="catalogue-categories" aria-label="Food categories">
            {["All", "Snack", "Meal"].map((entry) => (
              <button
                type="button"
                className={category === entry ? "active" : ""}
                onClick={() => setCategory(entry)}
                key={entry}
                aria-pressed={category === entry}
              >
                {entry}
                <span>
                  {entry === "All"
                    ? FOOD_CATALOGUE.length
                    : FOOD_CATALOGUE.filter((item) => item.category === entry).length}
                </span>
              </button>
            ))}
          </nav>

          <div className="catalogue-result-head">
            <span>{foods.length} RESULTS</span>
            <span>MACROS / SERVING</span>
          </div>

          <section className="catalogue-grid food-grid">
            {foods.map((item) => {
              const sprite = foodSprite(item);
              return (
                <article className="catalogue-card food-card" key={item.id}>
                  <div className="catalogue-number">
                    {String(item.id).padStart(3, "0")}
                    <span>{item.category}</span>
                  </div>
                  <div
                    className={`food-monogram ${sprite.className}`}
                    style={sprite.style}
                    role="img"
                    aria-label={`Photo of ${item.name}`}
                  />
                  <div className="catalogue-info">
                    <h3>{item.name}</h3>
                    <dl>
                      <div>
                        <dt>MAIN INGREDIENTS</dt>
                        <dd>{item.ingredients}</dd>
                      </div>
                      <div>
                        <dt>RECIPE / TUTORIAL</dt>
                        <dd>{item.tutorial}</dd>
                      </div>
                    </dl>
                    <p>{item.benefits}</p>
                  </div>
                  <div className="food-macros">
                    <strong>
                      {item.calories}
                      <small>KCAL</small>
                    </strong>
                    <span>
                      <b>{item.protein}g</b>P
                    </span>
                    <span>
                      <b>{item.carbs}g</b>C
                    </span>
                    <span>
                      <b>{item.fat}g</b>F
                    </span>
                  </div>
                  <button type="button" onClick={() => addFood(item, foodDate, servings)}>
                    ＋ Log {servings === 1 ? "a serving" : `${servings} servings`}
                  </button>
                </article>
              );
            })}
          </section>

          {!foods.length && (
            <EmptyState
              icon="⌕"
              title="Nothing found"
              copy="Try another name, ingredient, or benefit."
              action={{ label: "Clear the search", onClick: () => { setQuery(""); setCategory("All"); } }}
            />
          )}
        </>
      )}
    </div>
  );
}
