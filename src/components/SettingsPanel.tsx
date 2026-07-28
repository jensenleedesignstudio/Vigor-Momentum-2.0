import { useRef } from "react";
import type { Preferences, Profile } from "../types";
import { useDialog } from "./charts";

/**
 * Account, appearance and data panel.
 *
 * Export/import writes the whole local dataset to a JSON file — the only backup
 * route for an app that deliberately keeps everything on-device.
 */
export function SettingsPanel({
  profile,
  setProfile,
  preferences,
  setPreferences,
  onClose,
  onExport,
  onImport,
  onReset,
  storageNote,
}: {
  profile: Profile;
  setProfile: (patch: Partial<Profile>) => void;
  preferences: Preferences;
  setPreferences: (patch: Partial<Preferences>) => void;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  storageNote: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const dialogRef = useDialog(true, onClose);

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        ref={dialogRef}
      >
        <header>
          <div>
            <span className="eyebrow">ACCOUNT SETTINGS</span>
            <h2 id="settings-title">Your baseline.</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </header>

        <div className="settings-fields">
          <label>
            Username
            <input value={profile.name} onChange={(event) => setProfile({ name: event.target.value })} />
          </label>
          <div className="settings-measure">
            <label>
              Weight
              <input
                type="number"
                min="1"
                value={profile.weight}
                onChange={(event) => setProfile({ weight: Number(event.target.value) })}
              />
            </label>
            <label>
              Unit
              <select
                value={profile.weightUnit}
                onChange={(event) => setProfile({ weightUnit: event.target.value })}
              >
                <option>kg</option>
                <option>lb</option>
              </select>
            </label>
          </div>
          <div className="settings-measure">
            <label>
              Height
              <input
                type="number"
                min="1"
                value={profile.height}
                onChange={(event) => setProfile({ height: Number(event.target.value) })}
              />
            </label>
            <label>
              Unit
              <select
                value={profile.heightUnit}
                onChange={(event) => setProfile({ heightUnit: event.target.value })}
              >
                <option>cm</option>
                <option>ft/in</option>
              </select>
            </label>
          </div>
          <label>
            Primary goal
            <select value={profile.goal} onChange={(event) => setProfile({ goal: event.target.value })}>
              <option>Build muscle</option>
              <option>Get stronger</option>
              <option>Lose fat</option>
              <option>Improve endurance</option>
              <option>Move better</option>
            </select>
          </label>
          <label>
            Experience
            <select
              value={profile.experience}
              onChange={(event) => setProfile({ experience: event.target.value })}
            >
              <option>Some experience</option>
              <option>Just starting</option>
              <option>Advanced</option>
            </select>
          </label>
        </div>

        <div className="settings-group">
          <span className="eyebrow">APPEARANCE</span>
          <div className="segmented" role="group" aria-label="Theme">
            {(["light", "dark", "system"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={preferences.theme === option ? "active" : ""}
                aria-pressed={preferences.theme === option}
                onClick={() => setPreferences({ theme: option })}
              >
                {option === "light" ? "☀ Light" : option === "dark" ? "☾ Dark" : "⌗ System"}
              </button>
            ))}
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(event) => setPreferences({ reduceMotion: event.target.checked })}
            />
            <span>
              Reduce motion
              <small>Turns off typewriter headlines and card transitions.</small>
            </span>
          </label>
        </div>

        <div className="settings-group">
          <span className="eyebrow">YOUR DATA</span>
          <p className="settings-note">{storageNote}</p>
          <div className="settings-data-actions">
            <button type="button" onClick={onExport}>
              Export backup ↓
            </button>
            <button type="button" onClick={() => fileInput.current?.click()}>
              Import backup ↑
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.target.value = "";
              }}
            />
          </div>
          <button type="button" className="settings-danger" onClick={onReset}>
            Erase everything on this device
          </button>
        </div>

        <button className="primary settings-save" type="button" onClick={onClose}>
          Done <b>✓</b>
        </button>
      </section>
    </div>
  );
}
