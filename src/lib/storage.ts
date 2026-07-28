import { useEffect, useRef, useState } from "react";
import type { Preferences, Snapshot } from "../types";

/**
 * Every persisted slice lives under one of these keys. The first three match the
 * keys used by earlier builds so existing data keeps loading after an update.
 */
export const STORAGE_KEYS = {
  core: "vm-state",
  foodLogs: "vm-food-logs",
  statEntries: "vm-stat-entries",
  preferences: "vm-preferences",
  weightEntries: "vm-weight-entries",
} as const;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  reduceMotion: false,
  onboarded: false,
  lastTab: "today",
  macroTargets: { calories: 2200, protein: 160, carbs: 240, fat: 70 },
};

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Array slices are stored verbatim, so they need a plain parse rather than the
 * object merge `readJSON` performs. Anything that is not an array is discarded.
 */
export function parseArray<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota is the realistic failure here — progress photos are stored inline.
    return false;
  }
}

/**
 * State that mirrors itself into localStorage.
 *
 * The initialiser runs lazily so a large saved routine is parsed once, and the
 * first write is skipped so a failed read can never overwrite good data.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  load: (raw: string) => T = (raw) => JSON.parse(raw) as T,
) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? load(raw) : initial;
    } catch {
      return initial;
    }
  });

  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    writeJSON(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

export const SNAPSHOT_VERSION = 1;

/** Serialises a full backup and hands it to the browser as a download. */
export function downloadSnapshot(snapshot: Snapshot) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vigor-momentum-${snapshot.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Validates an uploaded backup before any of it reaches application state. */
export function parseSnapshot(raw: string): Snapshot {
  const parsed = JSON.parse(raw) as Partial<Snapshot>;
  if (!parsed || typeof parsed !== "object") throw new Error("That file is not a Vigor backup.");
  if (!Array.isArray(parsed.exercises) || !Array.isArray(parsed.records)) {
    throw new Error("That backup is missing its training data.");
  }
  return {
    version: parsed.version ?? SNAPSHOT_VERSION,
    exportedAt: parsed.exportedAt ?? new Date().toISOString(),
    profile: parsed.profile as Snapshot["profile"],
    preferences: { ...DEFAULT_PREFERENCES, ...(parsed.preferences ?? {}) },
    exercises: parsed.exercises,
    schedule: parsed.schedule ?? {},
    restDays: parsed.restDays ?? {},
    records: parsed.records,
    foodLogs: parsed.foodLogs ?? [],
    statEntries: parsed.statEntries ?? [],
    weightEntries: parsed.weightEntries ?? [],
    journal: parsed.journal ?? "",
  };
}
