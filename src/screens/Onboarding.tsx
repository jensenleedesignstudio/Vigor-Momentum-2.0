import type { Profile, Screen } from "../types";
import { MUSCLES } from "../data/muscles";
import { Mark, TypeText } from "../components/primitives";

function TopBar({ step }: { step: string }) {
  return (
    <header className="topbar">
      <Mark />
      <span>
        <TypeText text={step} delay={0.05} />
      </span>
      <span>
        <TypeText text="VIGOR / MOMENTUM" delay={0.55} />
      </span>
    </header>
  );
}

/** Screen 01 — the example account. */
export function AccountScreen({
  name,
  setName,
  onNext,
}: {
  name: string;
  setName: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <section className="account-screen slide-in">
      <header>
        <Mark />
        <span className="micro">01 — START</span>
      </header>
      <div className="account-grid">
        <div>
          <p className="eyebrow">YOUR TRAINING, COMPOUNDED.</p>
          <h1 className="letter-headline">
            <TypeText text="Build strength." delay={0.2} />
            <br />
            <TypeText text="Keep " delay={1.75} />
            <em>
              <TypeText text="momentum." delay={2.25} />
            </em>
          </h1>
          <p className="lede">
            A focused place for your routines, sessions, and every small win between them.
          </p>
        </div>
        <form
          className="account-card"
          onSubmit={(event) => {
            event.preventDefault();
            onNext();
          }}
        >
          <span className="step">EXAMPLE ACCOUNT</span>
          <h2>Good to meet you.</h2>
          <label>
            Your name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Email
            <input value="jensen@example.ca" readOnly />
          </label>
          <button className="primary" type="submit">
            Create my space <span className="cta-arrow">↗︎</span>
          </button>
          <small>No password needed — this is a preview account.</small>
        </form>
      </div>
    </section>
  );
}

/** Screen 01b — the full-bleed brand moment. */
export function IntroScreen({ onNext }: { onNext: () => void }) {
  return (
    <section className="intro-screen">
      <div className="intro-top">
        <Mark />
        <span>EST. FOR THE NEXT REP</span>
      </div>
      <div className="intro-center">
        <p className="eyebrow">YOUR PRACTICE. YOUR PACE.</p>
        <h1>
          <TypeText text="VIGOR MOMENTUM" delay={0.15} />
        </h1>
        <p>
          every rep. every set. more momentum.
          <br />
          progress without limits.
        </p>
        <button className="primary light" type="button" onClick={onNext}>
          Build momentum <span className="cta-arrow">↗︎</span>
        </button>
      </div>
      <div className="intro-foot">
        <span>STRONGER / STEADIER / YOURS</span>
        <span>SCROLL TO NOTHING. START HERE.</span>
      </div>
    </section>
  );
}

/** Screen 02 — measurements, goal, experience. */
export function ProfileScreen({
  profile,
  setProfile,
  onNext,
}: {
  profile: Profile;
  setProfile: (patch: Partial<Profile>) => void;
  onNext: () => void;
}) {
  return (
    <section className="onboard slide-in">
      <TopBar step="02 — YOUR BASELINE" />
      <div className="onboard-copy">
        <p className="eyebrow">LET’S MAKE IT YOURS</p>
        <h1 className="letter-headline">
          <TypeText text="Start where" delay={0.35} />
          <br />
          <TypeText text="you " delay={1.12} />
          <em>
            <TypeText text="are." delay={1.38} />
          </em>
        </h1>
        <p>A few simple details help us shape training that fits your body and your direction.</p>
      </div>
      <div className="form-panel">
        <div className="measure">
          <label htmlFor="onboard-weight">Weight</label>
          <div>
            <input
              id="onboard-weight"
              value={profile.weight}
              onChange={(event) => setProfile({ weight: Number(event.target.value) })}
              type="number"
              min="1"
            />
            <select
              value={profile.weightUnit}
              onChange={(event) => setProfile({ weightUnit: event.target.value })}
              aria-label="Weight unit"
            >
              <option>kg</option>
              <option>lb</option>
            </select>
          </div>
        </div>
        <div className="measure">
          <label htmlFor="onboard-height">Height</label>
          <div>
            <input
              id="onboard-height"
              value={profile.height}
              onChange={(event) => setProfile({ height: Number(event.target.value) })}
              type="number"
              min="1"
            />
            <select
              value={profile.heightUnit}
              onChange={(event) => setProfile({ heightUnit: event.target.value })}
              aria-label="Height unit"
            >
              <option>cm</option>
              <option>ft/in</option>
            </select>
          </div>
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
        <button className="primary" type="button" onClick={onNext}>
          Build vigor <b>→</b>
        </button>
      </div>
      <div className="big-index" aria-hidden="true">
        02
      </div>
    </section>
  );
}

/** Screen 03 — weekly rhythm and muscle priorities. */
export function PlanScreen({
  days,
  setDays,
  targets,
  setTargets,
  onCreate,
  onSkip,
}: {
  days: number;
  setDays: (value: number) => void;
  targets: string[];
  setTargets: React.Dispatch<React.SetStateAction<string[]>>;
  onCreate: () => void;
  onSkip: () => void;
}) {
  return (
    <section className="plan-screen slide-in">
      <TopBar step="03 — YOUR RHYTHM" />
      <div className="plan-copy">
        <p className="eyebrow">ALMOST THERE</p>
        <h1 className="letter-headline">
          <TypeText text="Make room" delay={0.35} />
          <br />
          <TypeText text="for " delay={1.35} />
          <em>
            <TypeText text="progress." delay={1.8} />
          </em>
        </h1>
        <p>Choose the rhythm and focus. We’ll give you a practical starting routine.</p>
      </div>
      <div className="plan-panel">
        <span className="section-label">Days available each week</span>
        <div className="day-row">
          {[2, 3, 4, 5, 6].map((value) => (
            <button
              key={value}
              type="button"
              className={days === value ? "selected" : ""}
              onClick={() => setDays(value)}
              aria-pressed={days === value}
            >
              {value}
              <small>{value === 2 ? "LIGHT" : value === 6 ? "FOCUSED" : "DAYS"}</small>
            </button>
          ))}
        </div>

        <span className="section-label">Muscle groups to prioritize</span>
        <div className="chips">
          {MUSCLES.map((muscle) => (
            <button
              key={muscle}
              type="button"
              className={targets.includes(muscle) ? "selected" : ""}
              aria-pressed={targets.includes(muscle)}
              onClick={() =>
                setTargets((current) =>
                  current.includes(muscle)
                    ? current.filter((entry) => entry !== muscle)
                    : [...current, muscle],
                )
              }
            >
              <span aria-hidden="true">{targets.includes(muscle) ? "●" : "○"}</span>
              {muscle}
            </button>
          ))}
        </div>

        <button className="primary wide" type="button" onClick={onCreate}>
          Create my routine <b>→</b>
        </button>
        <button className="text-button" type="button" onClick={onSkip}>
          Want to build your own routine? <u>Start from scratch ↗</u>
        </button>
      </div>
      <div className="big-index" aria-hidden="true">
        03
      </div>
    </section>
  );
}

export const ONBOARDING_ORDER: Screen[] = ["account", "intro", "profile", "plan", "home"];
