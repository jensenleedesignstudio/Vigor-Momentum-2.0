"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Screen = "account" | "intro" | "profile" | "plan" | "home";
type Tab = "today" | "routine" | "progress";
type Exercise = { id: number; name: string; muscle: string; sets: number; reps: string; weight: number; duration: number; difficulty: number; done: boolean };

const MUSCLES = ["Chest", "Upper Back", "Mid-Back", "Lower Back", "Shoulders", "Biceps", "Triceps", "Core", "Glutes", "Quadriceps", "Hamstrings", "Calves"];
const MUSCLE_INFO: Record<string,string> = {
  Chest:"Front upper torso · pushing", "Upper Back":"Traps & rhomboids · posture", "Mid-Back":"Lats · pulling", "Lower Back":"Erector spinae · torso support", Shoulders:"Deltoids · raises the arms", Biceps:"Front upper arm · bends the elbow", Triceps:"Back upper arm · straightens the elbow", Core:"Abs & obliques · spine stability", Glutes:"Hip drive and extension", Quadriceps:"Front thigh · straightens the knee", Hamstrings:"Back thigh · bends the knee", Calves:"Lower leg · jumping and plantar flexion"
};
const ROUTINES: Record<string, Omit<Exercise, "id" | "done" | "weight" | "duration" | "difficulty">[]> = {
  Chest: [{ name: "Incline dumbbell press", muscle: "Chest", sets: 4, reps: "8–10" }, { name: "Cable fly", muscle: "Chest", sets: 3, reps: "12–15" }],
  "Upper Back": [{ name: "Face pull", muscle: "Upper Back", sets: 3, reps: "12–15" }], "Mid-Back": [{ name: "Lat pulldown", muscle: "Mid-Back", sets: 4, reps: "8–12" }, { name: "Chest-supported row", muscle: "Mid-Back", sets: 3, reps: "10–12" }], "Lower Back": [{ name: "Back extension", muscle: "Lower Back", sets: 3, reps: "12" }],
  Shoulders:[{name:"Dumbbell shoulder press",muscle:"Shoulders",sets:3,reps:"8–10"}], Biceps:[{name:"Hammer curl",muscle:"Biceps",sets:3,reps:"10–12"}], Triceps:[{name:"Cable pushdown",muscle:"Triceps",sets:3,reps:"10–12"}], Core:[{name:"Plank",muscle:"Core",sets:3,reps:"45 sec"}],
  Quadriceps: [{ name: "Back squat", muscle: "Quadriceps", sets: 4, reps: "6–8" }, { name: "Walking lunge", muscle: "Quadriceps", sets: 3, reps: "10 / side" }],
  Glutes: [{ name: "Barbell hip thrust", muscle: "Glutes", sets: 4, reps: "8–10" }, { name: "Bulgarian split squat", muscle: "Glutes", sets: 3, reps: "10 / side" }],
  Hamstrings:[{name:"Romanian deadlift",muscle:"Hamstrings",sets:4,reps:"8–10"}], Calves:[{name:"Standing calf raise",muscle:"Calves",sets:4,reps:"12–15"}]
};

const seed: Exercise[] = [
  { id: 1, name: "Barbell back squat", muscle: "Quadriceps", sets: 4, reps: "8", weight: 82.5, duration: 0, difficulty: 7, done: true },
  { id: 2, name: "Incline dumbbell press", muscle: "Chest", sets: 3, reps: "10", weight: 27.5, duration: 0, difficulty: 8, done: true },
  { id: 3, name: "Chest-supported row", muscle: "Mid-Back", sets: 3, reps: "12", weight: 45, duration: 0, difficulty: 7, done: false },
];

function Mark() { return <span className="mark">VM<span>●</span></span>; }

function TypeText({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    setVisible(0);
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      timer = setInterval(() => setVisible(count => {
        if (count >= text.length) { if (timer) clearInterval(timer); return count; }
        return count + 1;
      }), 105);
    }, delay * 1000);
    return () => { clearTimeout(start); if (timer) clearInterval(timer); };
  }, [text, delay]);
  return <span className={`typed-text ${className}`} aria-label={text}><span aria-hidden="true">{text.slice(0, visible).replaceAll(" ", "\u00a0")}</span><i className={visible >= text.length ? "typed-caret done" : "typed-caret"} aria-hidden="true" /></span>;
}

function BodyMap({ active = ["Chest", "Mid-Back", "Quadriceps"] }: { active?: string[] }) {
  return <div className="body-wrap clinical-body" aria-label={`Muscles trained: ${active.join(", ")}`}><div className="clinical-anatomy">{active.flatMap((m,mi)=>(MUSCLE_POINTS[m]||[]).map((p,i)=><i className={`${mi===0?"primary ":""}${m.toLowerCase().replaceAll(" ","-")}`} style={{left:`${p.x}%`,top:`${p.y}%`}} key={`${m}-${i}`}/>))}</div><div className="clinical-legend"><span>FRONT</span><b>{active.length ? active.join(" · ") : "No training logged"}</b><span>BACK</span></div></div>;
}

const MUSCLE_POINTS: Record<string, {x:number;y:number}[]> = {
  Chest:[{x:28,y:25}], "Upper Back":[{x:72,y:23}], "Mid-Back":[{x:72,y:32}], "Lower Back":[{x:72,y:42}], Shoulders:[{x:22,y:23},{x:34,y:23},{x:66,y:23},{x:78,y:23}], Biceps:[{x:20,y:32},{x:36,y:32}], Triceps:[{x:64,y:32},{x:80,y:32}], Core:[{x:28,y:37}], Glutes:[{x:72,y:51}], Quadriceps:[{x:25,y:59},{x:31,y:59}], Hamstrings:[{x:69,y:61},{x:75,y:61}], Calves:[{x:69,y:76},{x:75,y:76}], Back:[{x:72,y:31}], Quads:[{x:25,y:59},{x:31,y:59}], Arms:[{x:20,y:32},{x:36,y:32}]
};

function inferMuscles(name:string, fallback:string) {
  const n=name.toLowerCase();
  const rules:[RegExp,string,string[]][]=[
    [/bench|chest press|push.?up|fly|pec/,"Chest",["Shoulders","Triceps"]],
    [/shrug|face pull|reverse fly|high row|trap|rhomboid/,"Upper Back",["Shoulders"]],
    [/row|pulldown|pull.?up|chin.?up|lat /,"Mid-Back",["Biceps","Upper Back"]],
    [/back extension|hyperextension|superman|good morning/,"Lower Back",["Hamstrings","Glutes"]],
    [/shoulder|overhead|military|lateral raise|front raise|arnold/,"Shoulders",["Triceps"]],
    [/curl|hammer|preacher|chin.?up/,"Biceps",["Mid-Back"]],
    [/tricep|pushdown|dip|skull|close.grip/,"Triceps",["Chest","Shoulders"]],
    [/crunch|plank|sit.?up|ab |oblique|russian twist|leg raise/,"Core",[]],
    [/hip thrust|glute|kickback|bridge/,"Glutes",["Hamstrings"]],
    [/squat|leg press|lunge|step.?up|leg extension/,"Quadriceps",["Glutes"]],
    [/romanian|rdl|hamstring|leg curl|deadlift/,"Hamstrings",["Glutes","Lower Back"]],
    [/calf|toe raise|jump rope|box jump/,"Calves",["Quadriceps"]]
  ];
  const match=rules.find(([pattern])=>pattern.test(n));
  return match?{primary:match[1],secondary:match[2]}:{primary:fallback,secondary:[]};
}

function ExerciseMuscleMap({ name, muscle }: { name:string; muscle:string }) {
  const detected=inferMuscles(name,muscle); const all=[detected.primary,...detected.secondary];
  return <div className="exercise-map"><div className="anatomy-image">{all.flatMap((m,mi)=>(MUSCLE_POINTS[m]||[]).map((p,i)=><i className={`${mi===0?"primary":"secondary"} ${m.toLowerCase().replaceAll(" ","-")}`} style={{left:`${p.x}%`,top:`${p.y}%`}} key={`${m}-${i}`}/>))}</div><div><span>AI MUSCLE MATCH</span><b>{detected.primary}</b><small>{MUSCLE_INFO[detected.primary]}</small>{detected.secondary.length>0&&<small>Supports: {detected.secondary.join(" + ")}</small>}</div></div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("account");
  const [tab, setTab] = useState<Tab>("today");
  const [name, setName] = useState("Alex");
  const [days, setDays] = useState(4);
  const [targets, setTargets] = useState<string[]>(["Chest", "Mid-Back", "Quadriceps"]);
  const [exercises, setExercises] = useState<Exercise[]>(seed);
  const [volume, setVolume] = useState(28);
  const [muted, setMuted] = useState(true);
  const [musicOpen, setMusicOpen] = useState(false);
  const [journal, setJournal] = useState("Felt strong today. Squats moved cleanly and I had more in the tank.");
  const [photos, setPhotos] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const player = useRef<HTMLIFrameElement>(null);

  useEffect(() => { if (screen === "intro") { const t = setTimeout(() => {}, 10); return () => clearTimeout(t); } }, [screen]);
  useEffect(() => { try { const saved = localStorage.getItem("vm-state"); if (saved) { const p = JSON.parse(saved); if (p.exercises) setExercises(p.exercises.map((e:Exercise)=>({...e,muscle:e.muscle==="Back"?"Mid-Back":e.muscle==="Quads"?"Quadriceps":e.muscle==="Arms"?inferMuscles(e.name,"Biceps").primary:e.muscle}))); if (p.journal) setJournal(p.journal); } } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("vm-state", JSON.stringify({ exercises, journal })); } catch {} }, [exercises, journal]);
  const trained = useMemo(() => Array.from(new Set(exercises.filter(e => e.done).map(e => e.muscle))), [exercises]);
  const momentum = Math.round((exercises.filter(e => e.done).length / Math.max(exercises.length, 1)) * 100);
  const msgPlayer = (func: string, args: number[] = []) => player.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  const toggleMusic = () => { const next = !muted; setMuted(next); msgPlayer(next ? "mute" : "unMute"); if (!next) msgPlayer("playVideo"); };
  const changeVolume = (v: number) => { setVolume(v); msgPlayer("setVolume", [v]); if (v > 0 && muted) { setMuted(false); msgPlayer("unMute"); msgPlayer("playVideo"); } };
  const notify = (s: string) => { setToast(s); setTimeout(() => setToast(""), 2400); };

  const createPlan = (goHome = false) => {
    if (!goHome) {
      const picked = targets.flatMap(m => ROUTINES[m] || []).slice(0, Math.max(4, days + 1));
      if (picked.length) setExercises(picked.map((e, i) => ({ ...e, id: Date.now() + i, done: false, weight: 0, duration: 0, difficulty: 6 })));
    }
    setScreen("home"); setTab(goHome ? "routine" : "today");
  };
  const addExercise = () => setExercises(x => [...x, { id: Date.now(), name: "New exercise", muscle: "Chest", sets: 3, reps: "10", weight: 0, duration: 0, difficulty: 6, done: false }]);
  const update = (id: number, patch: Partial<Exercise>) => setExercises(x => x.map(e => e.id === id ? { ...e, ...patch } : e));
  const remove = (id: number) => setExercises(x => x.filter(e => e.id !== id));
  const upload = (files: FileList | null) => { if (!files) return; [...files].slice(0, 3).forEach(f => { const r = new FileReader(); r.onload = () => setPhotos(x => [...x, String(r.result)]); r.readAsDataURL(f); }); };

  return <main>
    <iframe ref={player} className="audio-frame" title="Vigor Momentum music" allow="autoplay" src="https://www.youtube.com/embed/-RcPZdihrp4?enablejsapi=1&loop=1&playlist=-RcPZdihrp4&controls=0" />
    {toast && <div className="toast">{toast}</div>}

    {screen === "account" && <section className="account-screen slide-in">
      <header><Mark /><span className="micro">01 — START</span></header>
      <div className="account-grid">
        <div><p className="eyebrow">YOUR TRAINING, COMPOUNDED.</p><h1 className="letter-headline"><TypeText text="Build strength." delay={0.2} /><br /><TypeText text="Keep " delay={1.75} /><em><TypeText text="momentum." delay={2.25} /></em></h1><p className="lede">A focused place for your routines, sessions, and every small win between them.</p></div>
        <form className="account-card" onSubmit={e => { e.preventDefault(); setScreen("intro"); }}>
          <span className="step">EXAMPLE ACCOUNT</span><h2>Good to meet you.</h2>
          <label>Your name<input value={name} onChange={e => setName(e.target.value)} required /></label>
          <label>Email<input value="alex@example.com" readOnly /></label>
          <button className="primary">Create my space <b>↗</b></button><small>No password needed — this is a preview account.</small>
        </form>
      </div>
    </section>}

    {screen === "intro" && <section className="intro-screen">
      <div className="intro-top"><Mark /><span>EST. FOR THE NEXT REP</span></div>
      <div className="intro-center"><p className="eyebrow">YOUR PRACTICE. YOUR PACE.</p><h1><TypeText text="VIGOR MOMENTUM" delay={0.15} /></h1><p>every rep. every set. more momentum.<br />progress without limits.</p><button className="primary light" onClick={() => setScreen("profile")}>Build momentum <b>↗</b></button></div>
      <div className="intro-foot"><span>STRONGER / STEADIER / YOURS</span><span>SCROLL TO NOTHING. START HERE.</span></div>
    </section>}

    {screen === "profile" && <section className="onboard slide-in">
      <TopBar step="02 — YOUR BASELINE" />
      <div className="onboard-copy"><p className="eyebrow">LET’S MAKE IT YOURS</p><h1 className="letter-headline"><TypeText text="Start where" delay={0.35} /><br /><TypeText text="you " delay={1.12} /><em><TypeText text="are." delay={1.38} /></em></h1><p>A few simple details help us shape training that fits your body and your direction.</p></div>
      <div className="form-panel">
        <div className="measure"><label>Weight</label><div><input defaultValue="75" type="number" /><select><option>kg</option><option>lb</option></select></div></div>
        <div className="measure"><label>Height</label><div><input defaultValue="178" type="number" /><select><option>cm</option><option>ft/in</option></select></div></div>
        <label>Primary goal<select><option>Build muscle</option><option>Get stronger</option><option>Lose fat</option><option>Improve endurance</option><option>Move better</option></select></label>
        <label>Experience<select><option>Some experience</option><option>Just starting</option><option>Advanced</option></select></label>
        <button className="primary" onClick={() => setScreen("plan")}>Build vigor <b>→</b></button>
      </div>
      <div className="big-index">02</div>
    </section>}

    {screen === "plan" && <section className="plan-screen slide-in">
      <TopBar step="03 — YOUR RHYTHM" />
      <div className="plan-copy"><p className="eyebrow">ALMOST THERE</p><h1 className="letter-headline"><TypeText text="Make room" delay={0.35} /><br /><TypeText text="for " delay={1.35} /><em><TypeText text="progress." delay={1.8} /></em></h1><p>Choose the rhythm and focus. We’ll give you a practical starting routine.</p></div>
      <div className="plan-panel">
        <label className="section-label">Days available each week</label><div className="day-row">{[2,3,4,5,6].map(d => <button key={d} className={days === d ? "selected" : ""} onClick={() => setDays(d)}>{d}<small>{d === 2 ? "LIGHT" : d === 6 ? "FOCUSED" : "DAYS"}</small></button>)}</div>
        <label className="section-label">Muscle groups to prioritize</label><div className="chips">{MUSCLES.map(m => <button key={m} className={targets.includes(m) ? "selected" : ""} onClick={() => setTargets(x => x.includes(m) ? x.filter(y => y !== m) : [...x, m])}><span>{targets.includes(m) ? "●" : "○"}</span>{m}</button>)}</div>
        <button className="primary wide" onClick={() => createPlan(false)}>Create my routine <b>→</b></button>
        <button className="text-button" onClick={() => createPlan(true)}>Want to build your own routine? <u>Start from scratch ↗</u></button>
      </div>
      <div className="big-index">03</div>
    </section>}

    {screen === "home" && <section className="app-shell">
      <aside>
        <Mark />
        <nav>{([["today","Today","⌁"],["routine","Routine builder","＋"],["progress","Progress","↗"]] as [Tab,string,string][]).map(([id,label,icon]) => <button key={id} onClick={() => setTab(id)} className={tab === id ? "active" : ""}><span>{icon}</span>{label}</button>)}</nav>
        <div className="streak"><span>CONSISTENCY</span><strong>6 <small>WEEK<br />STREAK</small></strong><div>{[1,2,3,4,5,6,7].map((x,i)=><i key={x} className={i<6?"on":""}/>)}</div></div>
        <button className="profile"><span>{name.slice(0,1).toUpperCase()}</span><b>{name}<small>Example account</small></b><i>•••</i></button>
      </aside>
      <div className="workspace">
        <header className="app-header"><div><span className="eyebrow">VIGOR MOMENTUM / {tab}</span><h2>{tab === "today" ? `Good morning, ${name}.` : tab === "routine" ? "Routine builder." : "Progress, made visible."}</h2></div><div className="header-actions"><button>⌕</button><button className="sound-btn" onClick={() => setMusicOpen(!musicOpen)}>{muted ? "♪̸" : "♫"}</button><span>{new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric" }).toUpperCase()}</span></div></header>
        {musicOpen && <div className="music-pop"><div><span>NOW PLAYING</span><b>Momentum mix</b></div><button onClick={toggleMusic}>{muted ? "PLAY" : "PAUSE"}</button><input aria-label="Music volume" type="range" min="0" max="100" value={volume} onChange={e=>changeVolume(+e.target.value)} /><small>{volume}%</small></div>}

        {tab === "today" && <Today exercises={exercises} update={update} momentum={momentum} trained={trained} setTab={setTab} />}
        {tab === "routine" && <Routine exercises={exercises} update={update} remove={remove} add={addExercise} targets={targets} notify={notify} />}
        {tab === "progress" && <Progress exercises={exercises} update={update} trained={trained} journal={journal} setJournal={setJournal} photos={photos} upload={upload} notify={notify} />}
      </div>
    </section>}
  </main>;
}

function TopBar({ step }: { step: string }) { return <header className="topbar"><Mark /><span><TypeText text={step} delay={0.05} /></span><span><TypeText text="VIGOR / MOMENTUM" delay={0.55} /></span></header>; }

function Today({ exercises, update, momentum, trained, setTab }: { exercises: Exercise[]; update:(id:number,p:Partial<Exercise>)=>void; momentum:number; trained:string[]; setTab:(x:Tab)=>void }) {
  return <div className="dashboard fade-up">
    <section className="hero-stat"><div><span className="eyebrow">TODAY’S MOMENTUM</span><strong>{momentum}<sup>%</sup></strong><p>{momentum === 100 ? "Session complete. Momentum earned." : "A little further than yesterday."}</p></div><div className="ring" style={{"--p": `${momentum * 3.6}deg`} as React.CSSProperties}><span>{exercises.filter(e=>e.done).length}<small>OF {exercises.length}<br />MOVES</small></span></div></section>
    <section className="session-card"><div className="card-head"><div><span className="eyebrow">TODAY / FULL BODY</span><h3>Strength foundation</h3></div><button onClick={()=>setTab("routine")}>Edit routine ↗</button></div>
      <div className="exercise-list">{exercises.map((e,i)=><button key={e.id} onClick={()=>update(e.id,{done:!e.done})} className={e.done?"done":""}><span className="check">{e.done?"✓":""}</span><b>{String(i+1).padStart(2,"0")}</b><strong>{e.name}<small>{e.muscle}</small></strong><span>{e.sets} SETS</span><span>{e.reps} REPS</span><i>↗</i></button>)}</div>
    </section>
    <section className="body-card"><div><span className="eyebrow">THIS WEEK / BODY MAP</span><h3>Work, mapped.</h3><p>Trained muscles illuminate as you log your sessions.</p><div className="legend"><i/> TRAINED <i/> RECOVERING</div></div><BodyMap active={trained}/></section>
    <section className="quote-card"><span>“</span><p>We are what we repeatedly do. Excellence, then, is not an act, but a habit.</p><small>— ARISTOTLE</small></section>
  </div>;
}

function Routine({ exercises, update, remove, add, targets, notify }: { exercises:Exercise[]; update:(id:number,p:Partial<Exercise>)=>void; remove:(id:number)=>void; add:()=>void; targets:string[]; notify:(x:string)=>void }) {
  const [prompt,setPrompt]=useState("");
  const columnInfo = [{id:"backlog",label:"Backlog",dot:"gray"},{id:"todo",label:"To do",dot:"blue"},{id:"progress",label:"In progress",dot:"amber"},{id:"done",label:"Done",dot:"green"}] as const;
  const [statuses,setStatuses]=useState<Record<number,string>>(()=>Object.fromEntries(exercises.map((e,i)=>[e.id,e.done?"done":i===0?"progress":i<3?"todo":"backlog"])));
  useEffect(()=>setStatuses(old=>{const next={...old};exercises.forEach(e=>{if(!next[e.id])next[e.id]="backlog"});return next}),[exercises]);
  const move=(e:Exercise,status:string)=>{setStatuses(x=>({...x,[e.id]:status}));update(e.id,{done:status==="done"})};
  return <div className="builder board-builder fade-up">
    <div className="board-title"><div><span className="eyebrow">ROUTINE BUILDER / WEEKLY PROGRAM</span><h1>Shape the work.</h1><p>Move each exercise from possibility to complete. Select any card to edit it.</p></div><button className="board-add" onClick={add}>＋ <b>Add task</b></button></div>
    <div className="board-tools"><div className="view-tabs"><button className="active">Board</button><button>Timeline</button></div><div><button>▽ Filter</button><button>☷ Group: Status</button></div></div>
    <section className="board-ai"><span>✦</span><div><label>BUILD WITH AI</label><input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe the routine you want to build…" onKeyDown={e=>{if(e.key==="Enter"){notify("AI routine drafted — ready to refine.");setPrompt("")}}}/></div><button onClick={()=>{notify("AI routine drafted — ready to refine.");setPrompt("")}}>Generate →</button></section>
    <div className="kanban">{columnInfo.map(col=>{const cards=exercises.filter(e=>(statuses[e.id]||"backlog")===col.id);return <section className="kanban-column" key={col.id}>
      <header><div><i className={col.dot}/><b>{col.label}</b><span>{cards.length}</span></div><button onClick={add}>＋</button></header>
      <div className="kanban-cards">{cards.map((e,i)=><article className={`workout-card ${col.id}`} key={e.id}>
        <div className="card-status"><label><input type="checkbox" checked={col.id==="done"} onChange={x=>move(e,x.target.checked?"done":"todo")}/><span>{col.id==="done"?"Complete":"Routine task"}</span></label><b className={e.difficulty>7?"high":e.difficulty>5?"medium":"low"}>{e.difficulty>7?"HIGH":e.difficulty>5?"MEDIUM":"LOW"}</b></div>
        <input className="card-name" value={e.name} onChange={x=>{const detected=inferMuscles(x.target.value,e.muscle);update(e.id,{name:x.target.value,muscle:detected.primary})}}/>
        <p>{e.sets} sets × {e.reps} reps targeting {e.muscle.toLowerCase()}.</p>
        <ExerciseMuscleMap name={e.name} muscle={e.muscle}/>
        <div className="card-fields"><select value={e.muscle} onChange={x=>update(e.id,{muscle:x.target.value})}>{MUSCLES.map(m=><option key={m}>{m}</option>)}</select><label>SETS<input type="number" min="1" value={e.sets} onChange={x=>update(e.id,{sets:+x.target.value})}/></label><label>REPS<input value={e.reps} onChange={x=>update(e.id,{reps:x.target.value})}/></label></div>
        <div className="card-foot"><span className="avatar">VM</span><select aria-label={`Move ${e.name}`} value={col.id} onChange={x=>move(e,x.target.value)}>{columnInfo.map(c=><option value={c.id} key={c.id}>{c.label}</option>)}</select><span>◷ {Math.max(30,e.sets*12)}m</span><button aria-label={`Remove ${e.name}`} onClick={()=>remove(e.id)}>×</button></div>
      </article>)}</div>
      <button className="column-add" onClick={add}>＋ Add exercise</button>
    </section>})}</div>
    <div className="board-footer"><div><span>AUTO-SAVED LOCALLY</span><small>{exercises.length} exercises · {Array.from(new Set(exercises.map(e=>e.muscle))).length} muscle groups</small></div><button onClick={()=>notify("Routine saved. Momentum secured.")}>Save routine ↗</button></div>
  </div>;
}

function Progress({ exercises, update, trained, journal, setJournal, photos, upload, notify }: { exercises:Exercise[];update:(id:number,p:Partial<Exercise>)=>void;trained:string[];journal:string;setJournal:(x:string)=>void;photos:string[];upload:(x:FileList|null)=>void;notify:(x:string)=>void }) {
  const chart=[38,44,42,53,57,65,61,74,82,88];
  return <div className="progress-page fade-up">
    <div className="progress-grid"><section className="chart-card"><span className="eyebrow">TOTAL VOLUME / 8 WEEKS</span><div className="chart-title"><strong>12,840 <small>KG</small></strong><span>+18.4% ↗</span></div><div className="chart">{chart.map((v,i)=><i key={i} style={{height:`${v}%`}}><b>{i===9?"12.8K":""}</b></i>)}</div><div className="axis"><span>MAY 04</span><span>MAY 25</span><span>JUN 15</span><span>JUN 29</span></div></section>
      <section className="body-progress"><div><span className="eyebrow">MUSCLE BALANCE</span><h3>{trained.length || 0} groups</h3><p>trained this cycle</p></div><BodyMap active={trained}/></section></div>
    <section className="log-card"><div className="card-head"><div><span className="eyebrow">SESSION LOG</span><h3>Today’s details</h3></div><span>Difficulty / 10</span></div><div className="log-head"><span>EXERCISE</span><span>SETS</span><span>REPS</span><span>KG</span><span>MIN</span><span>RPE</span></div>{exercises.map(e=><div className="log-row" key={e.id}><b>{e.name}<small>{e.muscle}</small></b><input type="number" value={e.sets} onChange={x=>update(e.id,{sets:+x.target.value})}/><input value={e.reps} onChange={x=>update(e.id,{reps:x.target.value})}/><input type="number" value={e.weight} onChange={x=>update(e.id,{weight:+x.target.value})}/><input type="number" value={e.duration} onChange={x=>update(e.id,{duration:+x.target.value})}/><input type="number" min="1" max="10" value={e.difficulty} onChange={x=>update(e.id,{difficulty:+x.target.value})}/></div>)}<button className="log-save" onClick={()=>notify("Session details logged.")}>Log session ↗</button></section>
    <div className="journal-grid"><section className="journal"><span className="eyebrow">DAILY NOTE / {new Date().toLocaleDateString("en-CA",{month:"short",day:"2-digit"}).toUpperCase()}</span><h3>How did it feel?</h3><textarea value={journal} onChange={e=>setJournal(e.target.value)} /><button onClick={()=>notify("Journal entry saved.")}>Save entry ↗</button></section><section className="photos"><span className="eyebrow">PROGRESS PHOTOS / OPTIONAL</span><h3>See the long game.</h3><div className="photo-row">{photos.map((p,i)=><img key={i} src={p} alt={`Progress upload ${i+1}`}/>)}</div><label className="upload"><input type="file" accept="image/*" multiple onChange={e=>upload(e.target.files)}/><span>＋</span><b>Add photos<small>Private to this device</small></b></label></section></div>
  </div>;
}
