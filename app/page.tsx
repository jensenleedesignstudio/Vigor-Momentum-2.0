import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | Vigor Momentum",
  description: "Train with intention. Progress with proof.",
};

const nav = ["Overview", "Training", "Plans", "Analytics", "Journal"];
const days = [
  { day: "MON", date: "21", done: true },
  { day: "TUE", date: "22", active: true },
  { day: "WED", date: "23" },
  { day: "THU", date: "24" },
  { day: "FRI", date: "25" },
  { day: "SAT", date: "26" },
  { day: "SUN", date: "27" },
];

const exercises = [
  ["01", "Barbell bench press", "4 × 6–8", "Chest · Triceps", "72.5 kg"],
  ["02", "Chest-supported row", "4 × 8–10", "Upper back · Lats", "60 kg"],
  ["03", "Seated dumbbell press", "3 × 8–10", "Deltoids · Triceps", "22 kg"],
  ["04", "Cable lateral raise", "3 × 12–15", "Side deltoids", "7.5 kg"],
];

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Vigor Momentum home">
          <span className="brand-mark">VM</span>
          <span>VIGOR <b>MOMENTUM</b></span>
        </Link>
        <nav aria-label="Primary navigation">
          {nav.map((item, index) => (
            <Link className={index === 0 ? "active" : ""} href={index === 0 ? "/" : `#${item.toLowerCase()}`} key={item}>{item}</Link>
          ))}
        </nav>
        <div className="profile"><button aria-label="Notifications">●</button><span className="avatar">JD</span><span><b>Jordan Davis</b><small>Intermediate</small></span></div>
      </header>

      <section className="content">
        <div className="eyebrow"><span>WEEK 8 OF 12</span><i /></div>
        <div className="hero-copy">
          <div><p className="date">TUESDAY, JULY 22</p><h1>Keep the<br /><em>momentum.</em></h1></div>
          <p className="hero-note">Your consistency is building. You&apos;ve trained <b>3 of 4 days</b> this week—one session left to close it out.</p>
        </div>

        <div className="week-strip" aria-label="Weekly calendar">
          <div className="week-label"><span>JUL</span><b>21—27</b></div>
          {days.map((day) => <div className={`day ${day.active ? "today" : ""}`} key={day.day}><span>{day.day}</span><b>{day.date}</b><small>{day.done ? "✓" : day.active ? "TODAY" : ""}</small></div>)}
          <div className="streak"><span>↗</span><div><b>6 WEEK</b><small>TRAINING STREAK</small></div></div>
        </div>

        <section className="stats" aria-label="Weekly statistics">
          <article><small>SESSIONS</small><strong>3<span>/4</span></strong><p><b>↑ 1</b> vs. last week</p></article>
          <article><small>TRAINING TIME</small><strong>3<sup>h</sup> 42<sup>m</sup></strong><p><b>↑ 18m</b> vs. last week</p></article>
          <article><small>VOLUME LOAD</small><strong>18.4<span>k</span></strong><p><b>↑ 6.2%</b> vs. last week</p></article>
          <article><small>RECOVERY</small><strong>78<span>/100</span></strong><p className="good">GOOD TO TRAIN</p></article>
        </section>

        <section className="dashboard-grid">
          <article className="workout-card">
            <div className="section-heading"><div><small>TODAY&apos;S TRAINING</small><h2>Upper Strength</h2></div><div className="duration">≈ 62 MIN<br /><span>7 EXERCISES</span></div></div>
            <div className="focus-row"><span>PRIMARY FOCUS</span><b>CHEST</b><b>UPPER BACK</b><b>DELTOIDS</b></div>
            <div className="exercise-list">
              {exercises.map(([n, name, sets, muscles, weight]) => <div className="exercise" key={n}><span>{n}</span><div><b>{name}</b><small>{muscles}</small></div><strong>{sets}</strong><i>{weight}</i></div>)}
            </div>
            <div className="workout-actions"><button>START WORKOUT <span>→</span></button><Link href="#training">VIEW FULL SESSION</Link></div>
          </article>

          <article className="insight-card">
            <div className="section-heading"><div><small>TRAINING EMPHASIS</small><h2>This week</h2></div><button>•••</button></div>
            <div className="body-map" aria-label="Estimated weekly muscle emphasis">
              <div className="silhouette"><span className="head"/><span className="torso"/><span className="arm left"/><span className="arm right"/><span className="leg left"/><span className="leg right"/><i className="chest"/><i className="shoulder l"/><i className="shoulder r"/></div>
              <div className="muscle-bars">
                {[["CHEST",92],["UPPER BACK",81],["DELTOIDS",76],["QUADS",64],["HAMSTRINGS",42]].map(([label,value]) => <div key={label as string}><span>{label}<b>{value}</b></span><i><em style={{width:`${value}%`}} /></i></div>)}
              </div>
            </div>
            <p className="disclaimer">Estimated training emphasis based on logged exercises—not a physiological measurement.</p>
          </article>

          <article className="coach-card"><small>VIGOR COACH · WEEKLY INSIGHT</small><blockquote>“Your pressing strength is trending up, but pulling volume is 14% below target. Today&apos;s rows bring you back into balance.”</blockquote><p><span>RECOMMENDATION</span> Keep all four rowing sets at RPE 8 or below.</p><button>VIEW ANALYSIS →</button></article>
          <article className="progress-card"><div className="section-heading"><div><small>STRENGTH TREND</small><h2>Bench press</h2></div><b>+7.8% <span>12 WEEKS</span></b></div><div className="chart"><span>105</span><span>95</span><span>85</span><i className="chart-line"/><div className="chart-fill"/><em className="point"/></div><div className="chart-labels"><span>APR</span><span>MAY</span><span>JUN</span><span>JUL</span></div></article>
        </section>
      </section>
      <footer><span>VIGOR MOMENTUM</span><p>Training guidance is educational and does not replace advice from a qualified health or fitness professional.</p><span>v0.1 · FOUNDATION</span></footer>
    </main>
  );
}
