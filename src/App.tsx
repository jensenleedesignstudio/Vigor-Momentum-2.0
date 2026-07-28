import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ActivityRecord,
  Exercise,
  FoodItem,
  FoodLog,
  Preferences,
  Profile,
  Screen,
  Snapshot,
  StatEntry,
  Tab,
  CatalogueItem,
  WeightEntry,
} from "./types";
import { ROUTINES, inferMuscles, normaliseMuscle } from "./data/muscles";
import { CATALOGUE, catalogueFallbackMuscle } from "./data/catalogue";
import { FOOD_CATALOGUE } from "./data/foods";
import { DAY_IDS, dateKey, dayLabel, greeting } from "./lib/dates";
import { detectPersonalRecords } from "./lib/metrics";
import {
  DEFAULT_PREFERENCES,
  SNAPSHOT_VERSION,
  STORAGE_KEYS,
  downloadSnapshot,
  parseArray,
  parseSnapshot,
  readJSON,
  usePersistentState,
  writeJSON,
} from "./lib/storage";
import { useToasts } from "./hooks/useToasts";
import { useTheme } from "./hooks/useTheme";
import { Mark, TypeText } from "./components/primitives";
import { Toasts } from "./components/Toasts";
import { CommandPalette, type Command } from "./components/CommandPalette";
import { SettingsPanel } from "./components/SettingsPanel";
import { SessionRunner } from "./components/SessionRunner";
import { AccountScreen, IntroScreen, PlanScreen, ProfileScreen } from "./screens/Onboarding";
import { Today } from "./features/Today";
import { RoutineBuilder } from "./features/RoutineBuilder";
import { Catalogue } from "./features/Catalogue";
import { Progress } from "./features/Progress";
import { CalendarTab } from "./features/CalendarTab";

const DEFAULT_PROFILE: Profile = {
  name: "Jensen",
  weight: 75,
  weightUnit: "kg",
  height: 178,
  heightUnit: "cm",
  goal: "Build muscle",
  experience: "Some experience",
};

const SEED_EXERCISES: Exercise[] = [
  { id: 1, name: "Barbell back squat", muscle: "Quadriceps", sets: 4, reps: "8", weight: 82.5, duration: 0, difficulty: 7, done: true },
  { id: 2, name: "Incline dumbbell press", muscle: "Chest", sets: 3, reps: "10", weight: 27.5, duration: 0, difficulty: 8, done: true },
  { id: 3, name: "Chest-supported row", muscle: "Mid-Back", sets: 3, reps: "12", weight: 45, duration: 0, difficulty: 7, done: false },
];

const TABS: [Tab, string, string][] = [
  ["today", "Today", "⌁"],
  ["routine", "Routine builder", "＋"],
  ["catalogue", "Catalogue", "▦"],
  ["snackbar", "Snack Bar", "◇"],
  ["progress", "Stat tracker", "↗"],
  ["calendar", "Calendar", "□"],
];

const TAB_HEADINGS: Record<Tab, string> = {
  today: "",
  routine: "Routine builder.",
  catalogue: "Exercise catalogue.",
  snackbar: "Snack Bar.",
  progress: "Progress, made visible.",
  calendar: "Your training calendar.",
};

/** One saved blob, matching the key earlier versions wrote so data survives updates. */
type CoreState = {
  exercises: Exercise[];
  journal: string;
  records: ActivityRecord[];
  schedule: Record<number, string>;
  restDays: Record<string, boolean>;
  profile: Profile;
};

function loadCore(): CoreState {
  const fallback: CoreState = {
    exercises: SEED_EXERCISES,
    journal: "Felt strong today. Squats moved cleanly and I had more in the tank.",
    records: [],
    schedule: { 1: "monday", 2: "wednesday", 3: "friday" },
    restDays: {},
    profile: DEFAULT_PROFILE,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.core);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<CoreState>;
    return {
      exercises: Array.isArray(saved.exercises)
        ? saved.exercises.map((exercise) => ({
            ...exercise,
            muscle: normaliseMuscle(exercise.muscle, exercise.name),
          }))
        : fallback.exercises,
      journal: saved.journal ?? fallback.journal,
      records: Array.isArray(saved.records) ? saved.records : [],
      schedule: saved.schedule ?? {},
      restDays: saved.restDays ?? {},
      profile: { ...DEFAULT_PROFILE, ...(saved.profile ?? {}) },
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const initial = useRef(loadCore());

  const [preferences, setPreferences] = useState<Preferences>(() =>
    readJSON(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES),
  );
  const [screen, setScreen] = useState<Screen>(() =>
    readJSON(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES).onboarded ? "home" : "account",
  );
  const [tab, setTab] = useState<Tab>(preferences.lastTab);

  const [profile, setProfileState] = useState<Profile>(initial.current.profile);
  const [exercises, setExercises] = useState<Exercise[]>(initial.current.exercises);
  const [schedule, setSchedule] = useState<Record<number, string>>(initial.current.schedule);
  const [restDays, setRestDays] = useState<Record<string, boolean>>(initial.current.restDays);
  const [records, setRecords] = useState<ActivityRecord[]>(initial.current.records);
  const [journal, setJournal] = useState(initial.current.journal);

  const [foodLogs, setFoodLogs] = usePersistentState<FoodLog[]>(
    STORAGE_KEYS.foodLogs,
    [],
    parseArray<FoodLog>,
  );
  const [statEntries, setStatEntries] = usePersistentState<StatEntry[]>(
    STORAGE_KEYS.statEntries,
    [],
    parseArray<StatEntry>,
  );
  const [weightEntries, setWeightEntries] = usePersistentState<WeightEntry[]>(
    STORAGE_KEYS.weightEntries,
    [],
    parseArray<WeightEntry>,
  );

  const [days, setDays] = useState(4);
  const [targets, setTargets] = useState<string[]>(["Chest", "Mid-Back", "Quadriceps"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [volume, setVolume] = useState(28);
  const [muted, setMuted] = useState(true);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicMounted, setMusicMounted] = useState(false);
  const player = useRef<HTMLIFrameElement>(null);

  const { toasts, notify, dismiss, runUndo } = useToasts();
  useTheme(preferences.theme, preferences.reduceMotion);

  // ── Persistence ──────────────────────────────────────────────────────────
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    const ok = writeJSON(STORAGE_KEYS.core, {
      exercises,
      journal,
      records,
      schedule,
      restDays,
      profile,
    });
    if (!ok) {
      notify("Storage is full — export a backup and remove some progress photos.", { tone: "warn" });
    }
  }, [exercises, journal, records, schedule, restDays, profile, notify]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.preferences, preferences);
  }, [preferences]);

  useEffect(() => {
    if (screen === "home") setPreferences((current) => ({ ...current, lastTab: tab }));
  }, [tab, screen]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const trained = useMemo(
    () => Array.from(new Set(exercises.filter((exercise) => exercise.done).map((e) => e.muscle))),
    [exercises],
  );

  const patchProfile = useCallback(
    (patch: Partial<Profile>) => setProfileState((current) => ({ ...current, ...patch })),
    [],
  );
  const patchPreferences = useCallback(
    (patch: Partial<Preferences>) => setPreferences((current) => ({ ...current, ...patch })),
    [],
  );

  // ── Music ────────────────────────────────────────────────────────────────
  const msgPlayer = (func: string, args: number[] = []) =>
    player.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "https://www.youtube.com",
    );
  const toggleMusic = () => {
    const next = !muted;
    setMuted(next);
    msgPlayer(next ? "mute" : "unMute");
    if (!next) msgPlayer("playVideo");
  };
  const changeVolume = (value: number) => {
    setVolume(value);
    msgPlayer("setVolume", [value]);
    if (value > 0 && muted) {
      setMuted(false);
      msgPlayer("unMute");
      msgPlayer("playVideo");
    }
  };
  const openMusic = () => {
    setMusicMounted(true);
    setMusicOpen((open) => !open);
  };

  // ── Routine actions ──────────────────────────────────────────────────────
  const update = useCallback(
    (id: number, patch: Partial<Exercise>) =>
      setExercises((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item))),
    [],
  );

  const removeExercise = useCallback((id: number) => {
    setExercises((list) => list.filter((item) => item.id !== id));
    setSchedule((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  /** Puts deleted or duplicated exercises back, used by every undo path. */
  const restoreExercises = useCallback((items: Exercise[], days: Record<number, string>) => {
    setExercises((list) => [...list, ...items.filter((item) => !list.some((e) => e.id === item.id))]);
    setSchedule((current) => ({ ...current, ...days }));
  }, []);

  const addExercise = useCallback(() => {
    const id = Date.now();
    setExercises((list) => [
      ...list,
      {
        id,
        name: "New exercise",
        muscle: "Chest",
        sets: 3,
        reps: "10",
        weight: 0,
        duration: 0,
        difficulty: 6,
        done: false,
      },
    ]);
    return id;
  }, []);

  const addFromCatalogue = useCallback(
    (item: CatalogueItem, day: string) => {
      if (restDays[day]) {
        notify(`${dayLabel(day)} is a rest day. Turn training back on before adding exercises.`, {
          tone: "warn",
        });
        return;
      }
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const muscle = inferMuscles(item.name, catalogueFallbackMuscle(item.category)).primary;
      setExercises((list) => [
        ...list,
        {
          id,
          name: item.name,
          muscle,
          sets: item.sets,
          reps: item.reps,
          weight: 0,
          duration: 0,
          difficulty: 6,
          done: false,
        },
      ]);
      setSchedule((current) => ({ ...current, [id]: day }));
      notify(`${item.name} added to ${dayLabel(day)}.`, {
        tone: "success",
        undo: () => removeExercise(id),
      });
    },
    [restDays, notify, removeExercise],
  );

  const addFood = useCallback(
    (item: FoodItem, date: string, servings = 1) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setFoodLogs((logs) => [
        ...logs,
        {
          id,
          foodId: item.id,
          name: item.name,
          date,
          servings,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        },
      ]);
      notify(`${item.name} logged to your macro tracker.`, {
        tone: "success",
        undo: () => setFoodLogs((logs) => logs.filter((log) => log.id !== id)),
      });
    },
    [notify, setFoodLogs],
  );

  const addRecord = useCallback(
    (type: ActivityRecord["type"], title: string, detail: string, data?: string) => {
      const record: ActivityRecord = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: dateKey(),
        type,
        title,
        detail,
        data,
      };
      setRecords((list) => [record, ...list]);
      return record;
    },
    [],
  );

  const upload = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      [...files].slice(0, 3).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => addRecord("photo", "Progress photo added", file.name, String(reader.result));
        reader.readAsDataURL(file);
      });
    },
    [addRecord],
  );

  /** Saves a full snapshot of the current session and celebrates any new records. */
  const logSession = useCallback(() => {
    const completed = exercises.filter((exercise) => exercise.done);
    if (!completed.length) {
      notify("Mark at least one exercise complete before logging the session.", { tone: "warn" });
      return;
    }
    const personalRecords = detectPersonalRecords(exercises, records);
    const volumeTotal = Math.round(
      completed.reduce((sum, exercise) => {
        const reps = Number.parseFloat(exercise.reps) || 0;
        return sum + exercise.sets * reps * exercise.weight;
      }, 0),
    );
    const record = addRecord(
      "session",
      "Workout session logged",
      `${completed.length} exercises · ${volumeTotal.toLocaleString()} kg volume`,
      JSON.stringify(exercises),
    );

    if (personalRecords.length) {
      const best = personalRecords[0];
      notify(
        `New personal record: ${best.name} at ${best.weight} kg${personalRecords.length > 1 ? ` (+${personalRecords.length - 1} more)` : ""}.`,
        { tone: "success" },
      );
    } else {
      notify("Session logged to your calendar.", {
        tone: "success",
        undo: () => setRecords((list) => list.filter((item) => item.id !== record.id)),
      });
    }
  }, [exercises, records, addRecord, notify]);

  const resetWeek = useCallback(() => {
    const snapshot = exercises;
    setExercises((list) => list.map((exercise) => ({ ...exercise, done: false, setLog: undefined })));
    notify("Week reset — every exercise is open again.", {
      tone: "warn",
      undo: () => setExercises(snapshot),
    });
  }, [exercises, notify]);

  const createPlan = (fromScratch = false) => {
    setPreferences((current) => ({ ...current, onboarded: true }));
    if (fromScratch) {
      setExercises([]);
      setSchedule({});
      setScreen("home");
      setTab("routine");
      return;
    }
    if (!targets.length) {
      notify("Select at least one muscle group to create your routine.", { tone: "warn" });
      return;
    }
    const prescriptions: Record<string, { sets: number; reps: string; difficulty: number }> = {
      "Build muscle": { sets: 4, reps: "8–12", difficulty: 7 },
      "Get stronger": { sets: 5, reps: "4–6", difficulty: 8 },
      "Lose fat": { sets: 3, reps: "10–15", difficulty: 7 },
      "Improve endurance": { sets: 3, reps: "15–20", difficulty: 6 },
      "Move better": { sets: 3, reps: "8–12", difficulty: 5 },
    };
    const base = prescriptions[profile.goal] ?? prescriptions["Build muscle"];
    const beginner = profile.experience === "Just starting";
    const advanced = profile.experience === "Advanced";
    const picked = targets.flatMap((muscle) => ROUTINES[muscle] ?? []);
    const created = picked.map((exercise, index) => ({
      ...exercise,
      id: Date.now() + index,
      sets: beginner ? Math.min(2, base.sets) : advanced ? base.sets + 1 : base.sets,
      reps: base.reps,
      done: false,
      weight: 0,
      duration: 0,
      difficulty: beginner ? 5 : advanced ? Math.max(8, base.difficulty) : base.difficulty,
    }));
    const trainingDays: Record<number, string[]> = {
      2: ["monday", "thursday"],
      3: ["monday", "wednesday", "friday"],
      4: ["monday", "tuesday", "thursday", "saturday"],
      5: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      6: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    };
    const plan = trainingDays[days] ?? trainingDays[4];
    setExercises(created);
    setSchedule(Object.fromEntries(created.map((exercise, index) => [exercise.id, plan[index % plan.length]])));
    setRestDays(Object.fromEntries(DAY_IDS.filter((id) => !plan.includes(id)).map((id) => [id, true])));
    setScreen("home");
    setTab("today");
    notify(`${created.length} movements scheduled across ${plan.length} training days.`, {
      tone: "success",
    });
  };

  // ── Backup ───────────────────────────────────────────────────────────────
  const exportData = () => {
    downloadSnapshot({
      version: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      profile,
      preferences,
      exercises,
      schedule,
      restDays,
      records,
      foodLogs,
      statEntries,
      weightEntries,
      journal,
    });
    notify("Backup downloaded.", { tone: "success" });
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const snapshot: Snapshot = parseSnapshot(String(reader.result));
        setProfileState(snapshot.profile ?? DEFAULT_PROFILE);
        setPreferences({ ...DEFAULT_PREFERENCES, ...snapshot.preferences, onboarded: true });
        setExercises(snapshot.exercises);
        setSchedule(snapshot.schedule);
        setRestDays(snapshot.restDays);
        setRecords(snapshot.records);
        setFoodLogs(snapshot.foodLogs);
        setStatEntries(snapshot.statEntries);
        setWeightEntries(snapshot.weightEntries);
        setJournal(snapshot.journal);
        setSettingsOpen(false);
        notify("Backup restored.", { tone: "success" });
      } catch (error) {
        notify(error instanceof Error ? error.message : "That file could not be read.", {
          tone: "warn",
        });
      }
    };
    reader.readAsText(file);
  };

  const eraseEverything = () => {
    const snapshot = { exercises, records, foodLogs, statEntries, weightEntries, journal };
    setExercises([]);
    setSchedule({});
    setRestDays({});
    setRecords([]);
    setFoodLogs([]);
    setStatEntries([]);
    setWeightEntries([]);
    setJournal("");
    setSettingsOpen(false);
    notify("Everything erased on this device.", {
      tone: "warn",
      undo: () => {
        setExercises(snapshot.exercises);
        setRecords(snapshot.records);
        setFoodLogs(snapshot.foodLogs);
        setStatEntries(snapshot.statEntries);
        setWeightEntries(snapshot.weightEntries);
        setJournal(snapshot.journal);
      },
    });
  };

  // ── Command palette ──────────────────────────────────────────────────────
  const commands = useMemo<Command[]>(() => {
    const navigation: Command[] = TABS.map(([id, label]) => ({
      id: `tab-${id}`,
      group: "Go to",
      label,
      hint: `Tab ${TABS.findIndex(([tabId]) => tabId === id) + 1}`,
      run: () => setTab(id),
    }));

    const actions: Command[] = [
      {
        id: "action-session",
        group: "Action",
        label: "Start guided session",
        hint: "Walk through today's movements",
        run: () => {
          setTab("today");
          setRunnerOpen(true);
        },
      },
      { id: "action-log", group: "Action", label: "Log today's session", run: logSession },
      { id: "action-reset", group: "Action", label: "Reset this week", run: resetWeek },
      {
        id: "action-settings",
        group: "Action",
        label: "Open settings",
        run: () => setSettingsOpen(true),
      },
      { id: "action-export", group: "Action", label: "Export a backup", run: exportData },
      {
        id: "action-theme",
        group: "Action",
        label: `Switch to ${preferences.theme === "dark" ? "light" : "dark"} theme`,
        run: () => patchPreferences({ theme: preferences.theme === "dark" ? "light" : "dark" }),
      },
    ];

    const exerciseCommands: Command[] = CATALOGUE.map((item) => ({
      id: `exercise-${item.id}`,
      group: "Add exercise",
      label: item.name,
      hint: `${item.equipment} · ${item.sets} × ${item.reps}`,
      keywords: `${item.category} ${item.muscles}`,
      run: () => {
        const day = DAY_IDS.find((id) => !restDays[id]) ?? "monday";
        addFromCatalogue(item, day);
      },
    }));

    const foodCommands: Command[] = FOOD_CATALOGUE.map((item) => ({
      id: `food-${item.id}`,
      group: "Log food",
      label: item.name,
      hint: `${item.calories} kcal · ${item.protein}g protein`,
      keywords: `${item.category} ${item.ingredients}`,
      run: () => addFood(item, dateKey(), 1),
    }));

    return [...navigation, ...actions, ...exerciseCommands, ...foodCommands];
  }, [logSession, resetWeek, preferences.theme, patchPreferences, restDays, addFromCatalogue, addFood]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (screen !== "home") return;

      const index = Number(event.key);
      if (index >= 1 && index <= TABS.length) {
        event.preventDefault();
        setTab(TABS[index - 1][0]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen]);

  const storageNote = `${exercises.length} exercises · ${records.length} archive entries · ${foodLogs.length} food logs · ${statEntries.length} data points, all stored in this browser.`;

  const todaysExercises = exercises.filter(
    (exercise) => (schedule[exercise.id] ?? "monday") === DAY_IDS[(new Date().getDay() + 6) % 7],
  );

  return (
    <main>
      {musicMounted && (
        <iframe
          ref={player}
          className="audio-frame"
          title="Vigor Momentum music"
          allow="autoplay"
          src="https://www.youtube.com/embed/-RcPZdihrp4?enablejsapi=1&loop=1&playlist=-RcPZdihrp4&controls=0"
        />
      )}

      <Toasts toasts={toasts} onUndo={runUndo} onDismiss={dismiss} />

      {screen === "account" && (
        <AccountScreen
          name={profile.name}
          setName={(name) => patchProfile({ name })}
          onNext={() => setScreen("intro")}
        />
      )}

      {screen === "intro" && <IntroScreen onNext={() => setScreen("profile")} />}

      {screen === "profile" && (
        <ProfileScreen profile={profile} setProfile={patchProfile} onNext={() => setScreen("plan")} />
      )}

      {screen === "plan" && (
        <PlanScreen
          days={days}
          setDays={setDays}
          targets={targets}
          setTargets={setTargets}
          onCreate={() => createPlan(false)}
          onSkip={() => createPlan(true)}
        />
      )}

      {screen === "home" && (
        <section className="app-shell">
          <aside className={mobileNavOpen ? "open" : ""}>
            <Mark onClick={() => setScreen("account")} />
            <nav aria-label="Sections">
              {TABS.map(([id, label, icon], index) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    setMobileNavOpen(false);
                  }}
                  className={tab === id ? "active" : ""}
                  aria-current={tab === id ? "page" : undefined}
                >
                  <span aria-hidden="true">{icon}</span>
                  <TypeText text={label} delay={0.12 + index * 0.12} className="sidebar-type" />
                  <kbd aria-hidden="true">{index + 1}</kbd>
                </button>
              ))}
            </nav>

            <div className="sidebar-tip">
              <span>SHORTCUT</span>
              <b>
                <kbd>Ctrl</kbd>
                <kbd>K</kbd>
              </b>
              <small>Search anything</small>
            </div>

            <button className="profile" type="button" onClick={() => setSettingsOpen(true)}>
              <span aria-hidden="true">{profile.name.slice(0, 1).toUpperCase()}</span>
              <b>
                {profile.name}
                <small>
                  {profile.height} {profile.heightUnit} · {profile.weight} {profile.weightUnit}
                </small>
              </b>
              <i aria-hidden="true">•••</i>
            </button>
          </aside>

          <div className="workspace">
            <header className="app-header">
              <div key={tab}>
                <span className="eyebrow">
                  <TypeText text={`VIGOR MOMENTUM / ${tab}`} className="tab-heading-type" />
                </span>
                <h2>
                  <TypeText
                    text={tab === "today" ? `${greeting()}, ${profile.name}.` : TAB_HEADINGS[tab]}
                    delay={0.18}
                    className="tab-heading-type"
                  />
                </h2>
              </div>
              <div className="header-actions">
                <button
                  className="header-search"
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  aria-label="Open command palette"
                >
                  <span aria-hidden="true">⌕</span>
                  <b>Search</b>
                  <kbd aria-hidden="true">⌘K</kbd>
                </button>
                <button
                  className="sound-btn"
                  type="button"
                  onClick={openMusic}
                  aria-label={musicOpen ? "Close music controls" : "Open music controls"}
                  aria-expanded={musicOpen}
                >
                  {muted ? "♪̸" : "♫"}
                </button>
                <span>
                  {new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric" }).toUpperCase()}
                </span>
              </div>
            </header>

            {musicOpen && (
              <div className="music-pop">
                <div>
                  <span>NOW PLAYING</span>
                  <b>Momentum mix</b>
                </div>
                <button type="button" onClick={toggleMusic}>
                  {muted ? "PLAY" : "PAUSE"}
                </button>
                <input
                  aria-label="Music volume"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => changeVolume(Number(event.target.value))}
                />
                <small>{volume}%</small>
              </div>
            )}

            {tab === "today" && (
              <Today
                exercises={exercises}
                schedule={schedule}
                restDays={restDays}
                records={records}
                foodLogs={foodLogs}
                macroTargets={preferences.macroTargets}
                profile={profile}
                weightEntries={weightEntries}
                update={update}
                setTab={setTab}
                onStartSession={() => setRunnerOpen(true)}
              />
            )}

            {tab === "routine" && (
              <RoutineBuilder
                exercises={exercises}
                update={update}
                remove={removeExercise}
                restore={restoreExercises}
                add={addExercise}
                targets={targets}
                notify={notify}
                statuses={schedule}
                setStatuses={setSchedule}
                restDays={restDays}
                setRestDays={setRestDays}
              />
            )}

            {tab === "catalogue" && (
              <Catalogue
                key="exercise-catalogue"
                addExercise={addFromCatalogue}
                addFood={addFood}
                restDays={restDays}
                defaultLibrary="exercise"
              />
            )}

            {tab === "snackbar" && (
              <Catalogue
                key="snack-bar"
                addExercise={addFromCatalogue}
                addFood={addFood}
                restDays={restDays}
                defaultLibrary="food"
              />
            )}

            {tab === "progress" && (
              <Progress
                exercises={exercises}
                update={update}
                trained={trained}
                records={records}
                journal={journal}
                setJournal={setJournal}
                upload={upload}
                notify={notify}
                addRecord={addRecord}
                foodLogs={foodLogs}
                setFoodLogs={setFoodLogs}
                macroTargets={preferences.macroTargets}
                setMacroTargets={(macroTargets) => patchPreferences({ macroTargets })}
                statEntries={statEntries}
                setStatEntries={setStatEntries}
                weightEntries={weightEntries}
                setWeightEntries={setWeightEntries}
                profile={profile}
                onLogSession={logSession}
                onBrowseFood={() => setTab("snackbar")}
                onResetWeek={resetWeek}
              />
            )}

            {tab === "calendar" && <CalendarTab records={records} foodLogs={foodLogs} />}
          </div>

          <button
            className="mobile-nav-toggle"
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileNavOpen ? "×" : "☰"}
          </button>

          {settingsOpen && (
            <SettingsPanel
              profile={profile}
              setProfile={patchProfile}
              preferences={preferences}
              setPreferences={patchPreferences}
              onClose={() => setSettingsOpen(false)}
              onExport={exportData}
              onImport={importData}
              onReset={eraseEverything}
              storageNote={storageNote}
            />
          )}

          {runnerOpen && (
            <SessionRunner
              exercises={todaysExercises}
              onUpdate={update}
              onClose={() => setRunnerOpen(false)}
              onFinish={(minutes) => {
                todaysExercises
                  .filter((exercise) => exercise.done && !exercise.duration)
                  .forEach((exercise, _index, list) =>
                    update(exercise.id, { duration: Math.round(minutes / list.length) }),
                  );
                setRunnerOpen(false);
                logSession();
              }}
            />
          )}
        </section>
      )}

      <CommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </main>
  );
}
