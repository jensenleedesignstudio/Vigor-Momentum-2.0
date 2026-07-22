"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Screen = "account" | "intro" | "profile" | "plan" | "home";
type Tab = "today" | "routine" | "catalogue" | "progress" | "calendar";
type Exercise = { id: number; name: string; muscle: string; sets: number; reps: string; weight: number; duration: number; difficulty: number; done: boolean };
type ActivityRecord = { id:number; date:string; type:"session"|"note"|"photo"; title:string; detail:string; data?:string };
type CatalogueItem={id:number;category:string;name:string;equipment:string;muscles:string;sets:number;reps:string};

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

const CATALOGUE:CatalogueItem[]=`
Chest|Barbell Bench Press|Barbell + Bench|Mid Chest, Triceps, Front Delts|4|6–8
Chest|Incline Barbell Press|Barbell + Incline Bench|Upper Chest|4|6–10
Chest|Decline Barbell Press|Barbell + Decline Bench|Lower Chest|3|8–10
Chest|Flat Dumbbell Press|Dumbbells|Chest|3|8–12
Chest|Incline Dumbbell Press|Dumbbells|Upper Chest|3|8–12
Chest|Decline Dumbbell Press|Dumbbells|Lower Chest|3|8–12
Chest|Machine Chest Press|Chest Press Machine|Chest|3|10–12
Chest|Pec Deck Fly|Pec Deck Machine|Chest|3|12–15
Chest|Cable Fly (High→Low)|Cable Machine|Lower Chest|3|12–15
Chest|Cable Fly (Low→High)|Cable Machine|Upper Chest|3|12–15
Chest|Flat Cable Fly|Cable Machine|Chest|3|12–15
Chest|Push-up|Bodyweight|Chest|3|AMRAP
Chest|Weighted Push-up|Weight Plate|Chest|3|8–15
Chest|Chest Dips|Dip Bars|Lower Chest|3|8–12
Chest|Smith Machine Bench|Smith Machine|Chest|3|8–10
Back|Conventional Deadlift|Barbell|Entire Posterior Chain|4|3–6
Back|Bent Over Row|Barbell|Lats, Rhomboids|4|6–10
Back|Pendlay Row|Barbell|Upper Back|4|5–8
Back|T-Bar Row|T-Bar Machine|Mid Back|3|8–12
Back|Chest Supported Row|Machine|Upper Back|3|10–12
Back|Single Arm DB Row|Dumbbell|Lats|3|10
Back|Lat Pulldown (Wide)|Cable|Lats|3|8–12
Back|Lat Pulldown (Close)|Cable|Lower Lats|3|10–12
Back|Neutral Grip Pulldown|Cable|Lats|3|10–12
Back|Pull-up|Pull-up Bar|Lats|3|AMRAP
Back|Chin-up|Pull-up Bar|Lats, Biceps|3|AMRAP
Back|Straight Arm Pulldown|Cable|Lats|3|12–15
Back|Seated Cable Row|Cable|Mid Back|3|10–12
Back|Machine Row|Machine|Back|3|10–12
Back|Rack Pull|Barbell|Upper Back, Traps|4|5–8
Shoulders|Standing Overhead Press|Barbell|Front Delts|4|6–8
Shoulders|Seated Dumbbell Press|Dumbbells|Shoulders|3|8–12
Shoulders|Arnold Press|Dumbbells|All Delts|3|10–12
Shoulders|Machine Shoulder Press|Machine|Front Delts|3|10
Shoulders|Lateral Raise|Dumbbells|Side Delts|3|12–15
Shoulders|Cable Lateral Raise|Cable|Side Delts|3|12–15
Shoulders|Machine Lateral Raise|Machine|Side Delts|3|12–15
Shoulders|Front Raise|Plate/Dumbbell|Front Delts|3|12
Shoulders|Cable Front Raise|Cable|Front Delts|3|12
Shoulders|Rear Delt Fly|Machine|Rear Delts|3|12–15
Shoulders|Reverse Pec Deck|Machine|Rear Delts|3|12–15
Shoulders|Face Pull|Cable|Rear Delts, Rotator Cuff|3|12–15
Shoulders|Upright Row|Barbell/EZ Bar|Side Delts, Traps|3|10
Shoulders|Landmine Press|Landmine|Front Delts|3|10
Shoulders|Cable Y Raise|Cable|Upper Traps, Rear Delts|3|12
Biceps|Barbell Curl|Barbell|Biceps|3|8–10
Biceps|EZ Bar Curl|EZ Bar|Biceps|3|10
Biceps|Alternating DB Curl|Dumbbells|Biceps|3|10
Biceps|Hammer Curl|Dumbbells|Brachialis|3|10–12
Biceps|Incline Curl|Dumbbells|Long Head|3|10–12
Biceps|Preacher Curl|EZ Bar|Biceps|3|10–12
Biceps|Machine Preacher Curl|Machine|Biceps|3|10
Biceps|Cable Curl|Cable|Biceps|3|12
Biceps|Bayesian Curl|Cable|Long Head|3|12
Biceps|Spider Curl|Bench + EZ Bar|Short Head|3|10
Biceps|Concentration Curl|Dumbbell|Peak|3|12
Biceps|Reverse Curl|EZ Bar|Brachioradialis|3|12
Biceps|Cross Body Hammer Curl|Dumbbell|Brachialis|3|10
Triceps|Close Grip Bench|Barbell|Triceps|4|6–8
Triceps|Skull Crushers|EZ Bar|Long Head|3|10
Triceps|Overhead EZ Extension|EZ Bar|Long Head|3|10
Triceps|Overhead DB Extension|Dumbbell|Long Head|3|10–12
Triceps|Cable Pushdown|Cable|Triceps|3|12
Triceps|Rope Pushdown|Cable|Triceps|3|12
Triceps|Reverse Grip Pushdown|Cable|Medial Head|3|12
Triceps|Single Arm Pushdown|Cable|Triceps|3|12
Triceps|Bench Dips|Bench|Triceps|3|AMRAP
Triceps|Weighted Dips|Dip Belt|Chest/Triceps|3|8–12
Triceps|Machine Dip|Machine|Triceps|3|10
Triceps|Kickbacks|Dumbbell|Triceps|3|15
Legs|Back Squat|Barbell|Quads, Glutes|4|6–8
Legs|Front Squat|Barbell|Quads|4|6–8
Legs|Hack Squat|Machine|Quads|3|8–12
Legs|Leg Press|Machine|Quads|3|10
Legs|Bulgarian Split Squat|Dumbbells|Quads, Glutes|3|10
Legs|Walking Lunges|Dumbbells|Legs|3|12
Legs|Reverse Lunges|Dumbbells|Glutes|3|10
Legs|Romanian Deadlift|Barbell|Hamstrings|4|8
Legs|Stiff Leg Deadlift|Barbell|Hamstrings|3|8
Legs|Leg Extension|Machine|Quads|3|12–15
Legs|Seated Leg Curl|Machine|Hamstrings|3|12
Legs|Lying Leg Curl|Machine|Hamstrings|3|12
Legs|Nordic Curl|Bodyweight|Hamstrings|3|6–8
Legs|Hip Thrust|Barbell|Glutes|4|8–10
Legs|Cable Kickback|Cable|Glutes|3|15
Legs|Glute Bridge|Barbell|Glutes|3|10
Legs|Standing Calf Raise|Machine|Calves|4|12–15
Legs|Seated Calf Raise|Machine|Soleus|4|15
Legs|Donkey Calf Raise|Machine|Calves|3|15
Legs|Goblet Squat|Dumbbell|Quads|3|12
Core|Hanging Leg Raise|Pull-up Bar|Lower Abs|3|10–15
Core|Captain's Chair Raise|Machine|Lower Abs|3|12
Core|Cable Crunch|Cable|Abs|3|15
Core|Decline Sit-up|Bench|Abs|3|15
Core|Ab Wheel Rollout|Ab Wheel|Core|3|10–15
Core|Plank|Bodyweight|Core|3|30–90 sec
Core|Side Plank|Bodyweight|Obliques|3|30–60 sec
Core|Russian Twist|Plate|Obliques|3|20
Core|Pallof Press|Cable|Core Stability|3|12
Core|Wood Chop|Cable|Obliques|3|12`.trim().split("\n").map((line,i)=>{const [category,name,equipment,muscles,sets,reps]=line.split("|");return{id:i+1,category,name,equipment,muscles,sets:+sets,reps}});

const seed: Exercise[] = [
  { id: 1, name: "Barbell back squat", muscle: "Quadriceps", sets: 4, reps: "8", weight: 82.5, duration: 0, difficulty: 7, done: true },
  { id: 2, name: "Incline dumbbell press", muscle: "Chest", sets: 3, reps: "10", weight: 27.5, duration: 0, difficulty: 8, done: true },
  { id: 3, name: "Chest-supported row", muscle: "Mid-Back", sets: 3, reps: "12", weight: 45, duration: 0, difficulty: 7, done: false },
];

function Mark({onClick}:{onClick?:()=>void}={}) { const logo=<span className="mark">VM<span>●</span></span>; return onClick?<button className="mark-button" onClick={onClick} aria-label="Return to main menu">{logo}</button>:logo; }

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
  return <><div className="exercise-map"><div className="anatomy-image">{all.flatMap((m,mi)=>(MUSCLE_POINTS[m]||[]).map((p,i)=><i className={`${mi===0?"primary":"secondary"} ${m.toLowerCase().replaceAll(" ","-")}`} style={{left:`${p.x}%`,top:`${p.y}%`}} key={`${m}-${i}`}/>))}</div><div><span>AI MUSCLE MATCH</span><b>{detected.primary}</b><small>{MUSCLE_INFO[detected.primary]}</small>{detected.secondary.length>0&&<small>Supports: {detected.secondary.join(" + ")}</small>}</div></div><a className="youtube-demo" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form tutorial`)}`} target="_blank" rel="noreferrer" onClick={event=>event.stopPropagation()}><span>▶</span><b>Watch movement demo</b><small>YouTube · proper form ↗</small></a></>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("account");
  const [tab, setTab] = useState<Tab>("today");
  const [name, setName] = useState("Alex");
  const [days, setDays] = useState(4);
  const [targets, setTargets] = useState<string[]>(["Chest", "Mid-Back", "Quadriceps"]);
  const [goal,setGoal]=useState("Build muscle");
  const [experience,setExperience]=useState("Some experience");
  const [weight,setWeight]=useState(75);
  const [weightUnit,setWeightUnit]=useState("kg");
  const [height,setHeight]=useState(178);
  const [heightUnit,setHeightUnit]=useState("cm");
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [exercises, setExercises] = useState<Exercise[]>(seed);
  const [schedule,setSchedule]=useState<Record<number,string>>({1:"monday",2:"wednesday",3:"friday"});
  const [volume, setVolume] = useState(28);
  const [muted, setMuted] = useState(true);
  const [musicOpen, setMusicOpen] = useState(false);
  const [journal, setJournal] = useState("Felt strong today. Squats moved cleanly and I had more in the tank.");
  const [photos, setPhotos] = useState<string[]>([]);
  const [records,setRecords]=useState<ActivityRecord[]>([]);
  const [toast, setToast] = useState("");
  const player = useRef<HTMLIFrameElement>(null);

  useEffect(() => { if (screen === "intro") { const t = setTimeout(() => {}, 10); return () => clearTimeout(t); } }, [screen]);
  useEffect(() => { try { const saved = localStorage.getItem("vm-state"); if (saved) { const p = JSON.parse(saved); if (p.exercises) setExercises(p.exercises.map((e:Exercise)=>({...e,muscle:e.muscle==="Back"?"Mid-Back":e.muscle==="Quads"?"Quadriceps":e.muscle==="Arms"?inferMuscles(e.name,"Biceps").primary:e.muscle}))); if (p.journal) setJournal(p.journal); if(p.records)setRecords(p.records); if(p.schedule)setSchedule(p.schedule); if(p.profile){setName(p.profile.name||"Alex");setWeight(p.profile.weight||75);setWeightUnit(p.profile.weightUnit||"kg");setHeight(p.profile.height||178);setHeightUnit(p.profile.heightUnit||"cm");setGoal(p.profile.goal||"Build muscle");setExperience(p.profile.experience||"Some experience")} } } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("vm-state", JSON.stringify({ exercises, journal, records, schedule, profile:{name,weight,weightUnit,height,heightUnit,goal,experience} })); } catch {} }, [exercises, journal, records, schedule, name, weight, weightUnit, height, heightUnit, goal, experience]);
  const trained = useMemo(() => Array.from(new Set(exercises.filter(e => e.done).map(e => e.muscle))), [exercises]);
  const momentum = Math.round((exercises.filter(e => e.done).length / Math.max(exercises.length, 1)) * 100);
  const consistencyDays=new Set(exercises.filter(e=>e.done).map(e=>schedule[e.id]||"monday")).size;
  const msgPlayer = (func: string, args: number[] = []) => player.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  const toggleMusic = () => { const next = !muted; setMuted(next); msgPlayer(next ? "mute" : "unMute"); if (!next) msgPlayer("playVideo"); };
  const changeVolume = (v: number) => { setVolume(v); msgPlayer("setVolume", [v]); if (v > 0 && muted) { setMuted(false); msgPlayer("unMute"); msgPlayer("playVideo"); } };
  const notify = (s: string) => { setToast(s); setTimeout(() => setToast(""), 2400); };

  const createPlan = (goHome = false) => {
    if(goHome){setExercises([]);setSchedule({});setScreen("home");setTab("routine");return}
    if(!targets.length){notify("Select at least one muscle group to create your routine.");return}
    const prescriptions:Record<string,{sets:number;reps:string;difficulty:number}>={
      "Build muscle":{sets:4,reps:"8–12",difficulty:7},"Get stronger":{sets:5,reps:"4–6",difficulty:8},"Lose fat":{sets:3,reps:"10–15",difficulty:7},"Improve endurance":{sets:3,reps:"15–20",difficulty:6},"Move better":{sets:3,reps:"8–12",difficulty:5}
    };
    const base=prescriptions[goal]||prescriptions["Build muscle"];
    const picked=targets.flatMap(m=>ROUTINES[m]||[]);
    const created=picked.map((e,i)=>{const beginner=experience==="Just starting",advanced=experience==="Advanced";return{...e,id:Date.now()+i,sets:beginner?Math.min(2,base.sets):advanced?base.sets+1:base.sets,reps:base.reps,done:false,weight:0,duration:0,difficulty:beginner?5:advanced?Math.max(8,base.difficulty):base.difficulty}});
    const trainingDays:Record<number,string[]>={2:["monday","thursday"],3:["monday","wednesday","friday"],4:["monday","tuesday","thursday","saturday"],5:["monday","tuesday","wednesday","thursday","friday"],6:["monday","tuesday","wednesday","thursday","friday","saturday"]};
    setExercises(created);setSchedule(Object.fromEntries(created.map((e,i)=>[e.id,trainingDays[days][i%trainingDays[days].length]])));
    setScreen("home"); setTab(goHome ? "routine" : "today");
  };
  const addExercise = () => { const id=Date.now(); setExercises(x => [...x, { id, name: "New exercise", muscle: "Chest", sets: 3, reps: "10", weight: 0, duration: 0, difficulty: 6, done: false }]); return id; };
  const addFromCatalogue=(item:CatalogueItem,day:string)=>{const id=Date.now()+Math.floor(Math.random()*1000);const fallback=item.category==="Back"?"Mid-Back":item.category==="Legs"?"Quadriceps":item.category;const muscle=inferMuscles(item.name,fallback).primary;setExercises(x=>[...x,{id,name:item.name,muscle,sets:item.sets,reps:item.reps,weight:0,duration:0,difficulty:6,done:false}]);setSchedule(x=>({...x,[id]:day}));notify(`${item.name} added to ${day[0].toUpperCase()+day.slice(1)}.`)};
  const update = (id: number, patch: Partial<Exercise>) => setExercises(x => x.map(e => e.id === id ? { ...e, ...patch } : e));
  const remove = (id: number) => setExercises(x => x.filter(e => e.id !== id));
  const addRecord=(type:ActivityRecord["type"],title:string,detail:string,data?:string)=>setRecords(x=>[{id:Date.now()+Math.random(),date:new Date().toLocaleDateString("en-CA"),type,title,detail,data},...x]);
  const upload = (files: FileList | null) => { if (!files) return; [...files].slice(0, 3).forEach(f => { const r = new FileReader(); r.onload = () => {const data=String(r.result);setPhotos(x => [...x, data]);addRecord("photo","Progress photo added",f.name,data)}; r.readAsDataURL(f); }); };

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
        <div className="measure"><label>Weight</label><div><input value={weight} onChange={e=>setWeight(+e.target.value)} type="number" /><select value={weightUnit} onChange={e=>setWeightUnit(e.target.value)}><option>kg</option><option>lb</option></select></div></div>
        <div className="measure"><label>Height</label><div><input value={height} onChange={e=>setHeight(+e.target.value)} type="number" /><select value={heightUnit} onChange={e=>setHeightUnit(e.target.value)}><option>cm</option><option>ft/in</option></select></div></div>
        <label>Primary goal<select value={goal} onChange={e=>setGoal(e.target.value)}><option>Build muscle</option><option>Get stronger</option><option>Lose fat</option><option>Improve endurance</option><option>Move better</option></select></label>
        <label>Experience<select value={experience} onChange={e=>setExperience(e.target.value)}><option>Some experience</option><option>Just starting</option><option>Advanced</option></select></label>
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
        <Mark onClick={()=>setScreen("account")} />
        <nav>{([["today","Today","⌁"],["routine","Routine builder","＋"],["catalogue","Catalogue","▦"],["progress","Progress","↗"],["calendar","Calendar","□"]] as [Tab,string,string][]).map(([id,label,icon]) => <button key={id} onClick={() => setTab(id)} className={tab === id ? "active" : ""}><span>{icon}</span>{label}</button>)}</nav>
        <div className="streak"><span>CONSISTENCY / THIS WEEK</span><strong>{consistencyDays} <small>DAYS<br />TRAINED</small></strong><div>{[1,2,3,4,5,6,7].map((x,i)=><i key={x} className={i<consistencyDays?"on":""}/>)}</div></div>
        <button className="profile" onClick={()=>setSettingsOpen(true)} aria-label="Open profile settings"><span>{name.slice(0,1).toUpperCase()}</span><b>{name}<small>{height} {heightUnit} · {weight} {weightUnit}</small></b><i>•••</i></button>
      </aside>
      <div className="workspace">
        <header className="app-header"><div><span className="eyebrow">VIGOR MOMENTUM / {tab}</span><h2>{tab === "today" ? `Good morning, ${name}.` : tab === "routine" ? "Routine builder." : tab === "catalogue" ? "Exercise catalogue." : tab === "progress" ? "Progress, made visible." : "Your training calendar."}</h2></div><div className="header-actions"><button onClick={()=>setTab("catalogue")} aria-label="Search exercise catalogue">⌕</button><button className="sound-btn" onClick={() => setMusicOpen(!musicOpen)}>{muted ? "♪̸" : "♫"}</button><span>{new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric" }).toUpperCase()}</span></div></header>
        {musicOpen && <div className="music-pop"><div><span>NOW PLAYING</span><b>Momentum mix</b></div><button onClick={toggleMusic}>{muted ? "PLAY" : "PAUSE"}</button><input aria-label="Music volume" type="range" min="0" max="100" value={volume} onChange={e=>changeVolume(+e.target.value)} /><small>{volume}%</small></div>}

        {tab === "today" && <Today exercises={exercises} update={update} momentum={momentum} trained={trained} setTab={setTab} />}
        {tab === "routine" && <Routine exercises={exercises} update={update} remove={remove} add={addExercise} targets={targets} notify={notify} statuses={schedule} setStatuses={setSchedule} />}
        {tab === "catalogue" && <Catalogue addExercise={addFromCatalogue} />}
        {tab === "progress" && <Progress exercises={exercises} update={update} trained={trained} journal={journal} setJournal={setJournal} photos={photos} upload={upload} notify={notify} addRecord={addRecord} />}
        {tab === "calendar" && <Calendar records={records} />}
      </div>
      {settingsOpen&&<div className="settings-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSettingsOpen(false)}}><section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title"><header><div><span className="eyebrow">ACCOUNT SETTINGS</span><h2 id="settings-title">Your baseline.</h2></div><button onClick={()=>setSettingsOpen(false)} aria-label="Close settings">×</button></header><div className="settings-fields"><label>Username<input value={name} onChange={e=>setName(e.target.value)}/></label><div className="settings-measure"><label>Weight<input type="number" min="1" value={weight} onChange={e=>setWeight(+e.target.value)}/></label><label>Unit<select value={weightUnit} onChange={e=>setWeightUnit(e.target.value)}><option>kg</option><option>lb</option></select></label></div><div className="settings-measure"><label>Height<input type="number" min="1" value={height} onChange={e=>setHeight(+e.target.value)}/></label><label>Unit<select value={heightUnit} onChange={e=>setHeightUnit(e.target.value)}><option>cm</option><option>ft/in</option></select></label></div><label>Primary goal<select value={goal} onChange={e=>setGoal(e.target.value)}><option>Build muscle</option><option>Get stronger</option><option>Lose fat</option><option>Improve endurance</option><option>Move better</option></select></label><label>Experience<select value={experience} onChange={e=>setExperience(e.target.value)}><option>Some experience</option><option>Just starting</option><option>Advanced</option></select></label></div><button className="primary settings-save" onClick={()=>{setSettingsOpen(false);notify("Profile settings saved.")}}>Save settings <b>✓</b></button></section></div>}
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

function Catalogue({addExercise}:{addExercise:(item:CatalogueItem,day:string)=>void}){
  const [query,setQuery]=useState("");const [category,setCategory]=useState("All");const [day,setDay]=useState("monday");
  const categories=["All",...Array.from(new Set(CATALOGUE.map(item=>item.category)))];
  const results=CATALOGUE.filter(item=>(category==="All"||item.category===category)&&`${item.name} ${item.equipment} ${item.muscles}`.toLowerCase().includes(query.toLowerCase()));
  const fallback=(item:CatalogueItem)=>item.category==="Back"?"Mid-Back":item.category==="Legs"?"Quadriceps":item.category;
  return <div className="catalogue-page fade-up"><section className="catalogue-hero"><div><span className="eyebrow">EXERCISE LIBRARY / 100 MOVEMENTS</span><h1>Find the next<br/><em>movement.</em></h1><p>Search the complete strength catalogue, inspect the target area, then add any movement directly to your week.</p></div><div className="catalogue-controls"><label className="catalogue-search"><span>⌕</span><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search exercise, equipment, or muscle…"/></label><label>ADD EXERCISES TO<select value={day} onChange={e=>setDay(e.target.value)}>{["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(d=><option value={d} key={d}>{d[0].toUpperCase()+d.slice(1)}</option>)}</select></label></div></section><nav className="catalogue-categories">{categories.map(cat=><button className={category===cat?"active":""} onClick={()=>setCategory(cat)} key={cat}>{cat}<span>{cat==="All"?CATALOGUE.length:CATALOGUE.filter(item=>item.category===cat).length}</span></button>)}</nav><div className="catalogue-result-head"><span>{results.length} RESULTS</span><span>IDEAL WORKING SETS</span></div><section className="catalogue-grid">{results.map(item=>{const muscle=inferMuscles(item.name,fallback(item)).primary;return <article className="catalogue-card" key={item.id}><div className="catalogue-number">{String(item.id).padStart(3,"0")}<span>{item.category}</span></div><div className="catalogue-thumb"><div className="anatomy-image">{(MUSCLE_POINTS[muscle]||[]).map((p,i)=><i className={`primary ${muscle.toLowerCase().replaceAll(" ","-")}`} style={{left:`${p.x}%`,top:`${p.y}%`}} key={i}/>)}</div></div><div className="catalogue-info"><h3>{item.name}</h3><dl><div><dt>EQUIPMENT</dt><dd>{item.equipment}</dd></div><div><dt>PRIMARY MUSCLES</dt><dd>{item.muscles}</dd></div></dl></div><div className="catalogue-prescription"><strong>{item.sets}<small>SETS</small></strong><b>×</b><strong>{item.reps}<small>REPS</small></strong></div><button onClick={()=>addExercise(item,day)}>＋ Add to {day.slice(0,3)}.</button></article>})}</section>{!results.length&&<div className="catalogue-empty"><b>No movements found.</b><p>Try another exercise, equipment type, or muscle group.</p></div>}</div>
}

function Routine({ exercises, update, remove, add, targets, notify, statuses, setStatuses }: { exercises:Exercise[]; update:(id:number,p:Partial<Exercise>)=>void; remove:(id:number)=>void; add:()=>number; targets:string[]; notify:(x:string)=>void;statuses:Record<number,string>;setStatuses:React.Dispatch<React.SetStateAction<Record<number,string>>> }) {
  const [prompt,setPrompt]=useState("");
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [trashOpen,setTrashOpen]=useState(false);
  const [trashScope,setTrashScope]=useState("all");
  const [dayFilter,setDayFilter]=useState("all");
  const [muscleFilter,setMuscleFilter]=useState("all");
  const [minSets,setMinSets]=useState(0);
  const [repsFilter,setRepsFilter]=useState("");
  const [aiSuggestions,setAiSuggestions]=useState<Exercise[]>([]);
  const [selectedWorkouts,setSelectedWorkouts]=useState<number[]>([]);
  const [bulkDay,setBulkDay]=useState("monday");
  const [bulkReps,setBulkReps]=useState("");
  const toggleWorkout=(id:number)=>setSelectedWorkouts(list=>list.includes(id)?list.filter(x=>x!==id):[...list,id]);
  const columnInfo = [{id:"monday",label:"Monday",dot:"blue"},{id:"tuesday",label:"Tuesday",dot:"amber"},{id:"wednesday",label:"Wednesday",dot:"green"},{id:"thursday",label:"Thursday",dot:"violet"},{id:"friday",label:"Friday",dot:"coral"},{id:"saturday",label:"Saturday",dot:"gold"},{id:"sunday",label:"Sunday",dot:"gray"}] as const;
  const scheduledSelected=selectedWorkouts.filter(id=>exercises.some(e=>e.id===id));
  const applyBulkDay=()=>{if(!scheduledSelected.length)return;setStatuses(old=>({...old,...Object.fromEntries(scheduledSelected.map(id=>[id,bulkDay]))}));notify(`${scheduledSelected.length} workouts moved to ${columnInfo.find(d=>d.id===bulkDay)?.label}.`)};
  const applyBulkReps=()=>{const reps=bulkReps.trim();if(!reps)return;scheduledSelected.forEach(id=>update(id,{reps}));setAiSuggestions(list=>list.map(e=>selectedWorkouts.includes(e.id)?{...e,reps}:e));setBulkReps("");notify(`Reps updated for ${selectedWorkouts.length} selected workouts.`)};
  const deleteSelected=()=>{if(!selectedWorkouts.length||!window.confirm(`Delete ${selectedWorkouts.length} selected workout${selectedWorkouts.length===1?"":"s"}? This cannot be undone.`))return;scheduledSelected.forEach(remove);setAiSuggestions(list=>list.filter(e=>!selectedWorkouts.includes(e.id)));setStatuses(old=>Object.fromEntries(Object.entries(old).filter(([id])=>!selectedWorkouts.includes(Number(id)))));setSelectedWorkouts([]);notify("Selected workouts deleted.")};
  useEffect(()=>setStatuses(old=>{const next={...old};exercises.forEach((e,i)=>{if(!next[e.id])next[e.id]=columnInfo[i%columnInfo.length].id});return next}),[exercises]);
  const move=(e:Exercise,status:string)=>setStatuses(x=>({...x,[e.id]:status}));
  const addToDay=(day:string)=>{const id=add();setStatuses(x=>({...x,[id]:day}));notify(`Exercise added to ${columnInfo.find(d=>d.id===day)?.label||day}.`)};
  const visibleColumns=columnInfo.filter(col=>dayFilter==="all"||col.id===dayFilter);
  const passesFilters=(e:Exercise)=>(muscleFilter==="all"||e.muscle===muscleFilter)&&e.sets>=minSets&&(!repsFilter||e.reps.toLowerCase().includes(repsFilter.toLowerCase()));
  const filteredCount=exercises.filter(e=>passesFilters(e)&&(dayFilter==="all"||statuses[e.id]===dayFilter)).length;
  const clearFilters=()=>{setDayFilter("all");setMuscleFilter("all");setMinSets(0);setRepsFilter("")};
  const trashRoutine=()=>{const ids=trashScope==="all"?exercises.map(e=>e.id):exercises.filter(e=>(statuses[e.id]||"monday")===trashScope).map(e=>e.id);const label=trashScope==="all"?"the entire routine":columnInfo.find(d=>d.id===trashScope)?.label||trashScope;if(!ids.length){notify(`No workouts to delete from ${label}.`);return}if(!window.confirm(`Delete ${ids.length} workout${ids.length===1?"":"s"} from ${label}? This cannot be undone.`))return;ids.forEach(remove);setStatuses(old=>Object.fromEntries(Object.entries(old).filter(([id])=>!ids.includes(Number(id)))));setSelectedWorkouts(list=>list.filter(id=>!ids.includes(id)));setTrashOpen(false);if(trashScope!=="all"&&dayFilter===trashScope)setDayFilter("all");notify(`${ids.length} workout${ids.length===1?"":"s"} deleted from ${label}.`)};
  const generateAI=()=>{
    const q=prompt.toLowerCase();
    const library=q.includes("leg")||q.includes("lower")?[["Back squat",4,"6–8"],["Romanian deadlift",3,"8–10"],["Walking lunge",3,"10 / side"],["Standing calf raise",4,"12–15"]]:q.includes("back")||q.includes("pull")?[["Lat pulldown",4,"8–12"],["Chest-supported row",3,"10–12"],["Face pull",3,"12–15"],["Hammer curl",3,"10–12"]]:q.includes("push")||q.includes("chest")?[["Incline dumbbell press",4,"8–10"],["Cable fly",3,"12–15"],["Dumbbell shoulder press",3,"8–10"],["Cable triceps pushdown",3,"10–12"]]:[["Back squat",4,"6–8"],["Incline dumbbell press",3,"8–10"],["Lat pulldown",3,"10–12"],["Plank",3,"45 sec"]];
    const now=Date.now();setAiSuggestions(library.map(([name,sets,reps],i)=>{const detected=inferMuscles(String(name),"Chest");return{id:-(now+i),name:String(name),muscle:detected.primary,sets:Number(sets),reps:String(reps),weight:0,duration:0,difficulty:i===0?8:6,done:false}}));setPrompt("");notify("AI curated 4 workouts — drag them into your week.");
  };
  const startDrag=(event:React.DragEvent,kind:"scheduled"|"ai",id:number)=>event.dataTransfer.setData("application/vigor",JSON.stringify({kind,id}));
  const dropOnDay=(event:React.DragEvent,day:string)=>{event.preventDefault();try{const data=JSON.parse(event.dataTransfer.getData("application/vigor"));if(data.kind==="scheduled"){setStatuses(x=>({...x,[data.id]:day}));notify(`Workout moved to ${columnInfo.find(d=>d.id===day)?.label}.`)}else{const suggestion=aiSuggestions.find(e=>e.id===data.id);if(suggestion){const id=add();update(id,{name:suggestion.name,muscle:suggestion.muscle,sets:suggestion.sets,reps:suggestion.reps,difficulty:suggestion.difficulty});setStatuses(x=>({...x,[id]:day}));setAiSuggestions(x=>x.filter(e=>e.id!==data.id));notify(`${suggestion.name} added to ${columnInfo.find(d=>d.id===day)?.label}.`)}}}catch{}};
  return <div className="builder board-builder fade-up">
    <div className="board-title"><div><span className="eyebrow">ROUTINE BUILDER / WEEKLY PROGRAM</span><h1>Shape the week.</h1><p>Plan each exercise by training day. Select any card to edit it.</p></div><button className="board-add" onClick={()=>addToDay(dayFilter==="all"?"monday":dayFilter)}>＋ <b>Add task</b></button></div>
    <div className="board-tools"><div className="view-tabs"><button className="active">Week</button><button>Timeline</button></div><div className="board-tool-actions"><button className={filtersOpen?"filter-active":""} onClick={()=>setFiltersOpen(!filtersOpen)}>▽ Filter {filteredCount}/{exercises.length}</button><button className={`trash-trigger ${trashOpen?"active":""}`} onClick={()=>setTrashOpen(!trashOpen)} aria-label="Delete routine workouts">🗑</button>{trashOpen&&<section className="trash-menu"><span className="eyebrow">DELETE WORKOUTS</span><label>CHOOSE WHAT TO TRASH<select value={trashScope} onChange={e=>setTrashScope(e.target.value)}><option value="all">Entire routine</option>{columnInfo.map(day=><option value={day.id} key={day.id}>{day.label} only</option>)}</select></label><p>{trashScope==="all"?`${exercises.length} workouts will be removed.`:`${exercises.filter(e=>(statuses[e.id]||"monday")===trashScope).length} workouts on ${columnInfo.find(d=>d.id===trashScope)?.label}.`}</p><button className="trash-confirm" onClick={trashRoutine}>Trash selection</button><button className="trash-cancel" onClick={()=>setTrashOpen(false)}>Cancel</button></section>}</div></div>
    {selectedWorkouts.length>0&&<section className="bulk-toolbar"><div><strong>{selectedWorkouts.length}</strong><span>SELECTED</span><button onClick={()=>setSelectedWorkouts([])}>Clear ×</button></div><label>MOVE TO DAY<select value={bulkDay} onChange={e=>setBulkDay(e.target.value)}>{columnInfo.map(day=><option value={day.id} key={day.id}>{day.label}</option>)}</select></label><button onClick={applyBulkDay} disabled={!scheduledSelected.length}>Apply day</button><label>CHANGE REPS<input value={bulkReps} onChange={e=>setBulkReps(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")applyBulkReps()}} placeholder="e.g. 8–12"/></label><button onClick={applyBulkReps} disabled={!bulkReps.trim()}>Apply reps</button><button className="bulk-delete" onClick={deleteSelected}>Delete selected</button></section>}
    {filtersOpen&&<section className="routine-filters"><label>DAY<select value={dayFilter} onChange={e=>setDayFilter(e.target.value)}><option value="all">All days</option>{columnInfo.map(d=><option value={d.id} key={d.id}>{d.label}</option>)}</select></label><label>MINIMUM SETS<input type="number" min="0" value={minSets} onChange={e=>setMinSets(+e.target.value)}/></label><label>REPS<input value={repsFilter} onChange={e=>setRepsFilter(e.target.value)} placeholder="e.g. 10 or 8–12"/></label><label>MUSCLE WORKED<select value={muscleFilter} onChange={e=>setMuscleFilter(e.target.value)}><option value="all">All muscles</option>{MUSCLES.map(m=><option key={m}>{m}</option>)}</select></label><button onClick={clearFilters}>Clear all ×</button></section>}
    <section className="board-ai"><span>✦</span><div><label>BUILD WITH AI</label><input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Try ‘lower-body strength’ or ‘back and biceps’…" onKeyDown={e=>{if(e.key==="Enter")generateAI()}}/></div><button onClick={generateAI}>Generate →</button></section>
    <div className={`kanban weekly-kanban ${dayFilter!=="all"?"single-day":""}`}><section className="kanban-column ai-column"><header><div><i/><b>Built with AI</b><span>{aiSuggestions.length}</span></div><span>DRAG →</span></header><div className="kanban-cards">{aiSuggestions.map(e=>{const selected=selectedWorkouts.includes(e.id);return <article className={`workout-card ai-suggestion ${selected?"selected-card":""}`} draggable={!selected} onDragStart={event=>startDrag(event,"ai",e.id)} key={e.id}><div className="card-status"><label><span>✦ AI CURATED</span></label><button className="select-workout" onClick={()=>toggleWorkout(e.id)}>{selected?"DONE":"SELECT"}</button></div>{selected?<input className="card-name" value={e.name} onChange={x=>setAiSuggestions(list=>list.map(a=>a.id===e.id?{...a,name:x.target.value,muscle:inferMuscles(x.target.value,a.muscle).primary}:a))}/>:<strong className="ai-card-name">{e.name}</strong>}<p>{e.sets} sets × {e.reps} reps targeting {e.muscle.toLowerCase()}.</p><ExerciseMuscleMap name={e.name} muscle={e.muscle}/>{selected&&<div className="card-fields"><select value={e.muscle} onChange={x=>setAiSuggestions(list=>list.map(a=>a.id===e.id?{...a,muscle:x.target.value}:a))}>{MUSCLES.map(m=><option key={m}>{m}</option>)}</select><label>SETS<input type="number" min="1" value={e.sets} onChange={x=>setAiSuggestions(list=>list.map(a=>a.id===e.id?{...a,sets:+x.target.value}:a))}/></label><label>REPS<input value={e.reps} onChange={x=>setAiSuggestions(list=>list.map(a=>a.id===e.id?{...a,reps:x.target.value}:a))}/></label></div>}<small className="drag-hint">{selected?"Edit the workout, then press Done":"⠿ Drag into a training day"}</small></article>})}</div>{!aiSuggestions.length&&<div className="ai-empty"><b>✦</b><span>Describe a goal above to generate curated workouts.</span></div>}</section>{visibleColumns.map(col=>{const cards=exercises.filter(e=>(statuses[e.id]||"monday")===col.id&&passesFilters(e));return <section className="kanban-column day-dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>dropOnDay(e,col.id)} key={col.id}>
      <header><div><i className={col.dot}/><b>{col.label}</b><span>{cards.length}</span></div><button onClick={()=>addToDay(col.id)}>＋</button></header>
      <div className="kanban-cards">{cards.map((e,i)=>{const selected=selectedWorkouts.includes(e.id);return <article className={`workout-card ${e.done?"done":""} ${selected?"selected-card":""}`} draggable={!selected} onDragStart={event=>startDrag(event,"scheduled",e.id)} key={e.id}>
        <div className="card-status"><label><input type="checkbox" disabled={!selected} checked={e.done} onChange={x=>update(e.id,{done:x.target.checked})}/><span>{e.done?"Complete":"Routine task"}</span></label><button className="select-workout" onClick={()=>toggleWorkout(e.id)}>{selected?"DONE":"SELECT"}</button></div>
        <input className="card-name" readOnly={!selected} value={e.name} onChange={x=>{const detected=inferMuscles(x.target.value,e.muscle);update(e.id,{name:x.target.value,muscle:detected.primary})}}/>
        <p>{e.sets} sets × {e.reps} reps targeting {e.muscle.toLowerCase()}.</p>
        <ExerciseMuscleMap name={e.name} muscle={e.muscle}/>
        {selected&&<div className="card-fields"><select value={e.muscle} onChange={x=>update(e.id,{muscle:x.target.value})}>{MUSCLES.map(m=><option key={m}>{m}</option>)}</select><label>SETS<input type="number" min="1" value={e.sets} onChange={x=>update(e.id,{sets:+x.target.value})}/></label><label>REPS<input value={e.reps} onChange={x=>update(e.id,{reps:x.target.value})}/></label></div>}
        <div className="card-foot"><span className="avatar">VM</span>{selected?<select aria-label={`Move ${e.name}`} value={col.id} onChange={x=>move(e,x.target.value)}>{columnInfo.map(c=><option value={c.id} key={c.id}>{c.label}</option>)}</select>:<span>{col.label}</span>}<span>◷ {Math.max(30,e.sets*12)}m</span>{selected?<button aria-label={`Remove ${e.name}`} onClick={()=>{remove(e.id);setSelectedWorkouts(list=>list.filter(id=>id!==e.id))}}>×</button>:<span/>}</div>
      </article>})}</div>
      <button className="column-add" onClick={()=>addToDay(col.id)}>＋ Add exercise to {col.label}</button>
    </section>})}</div>
    <div className="board-footer"><div><span>AUTO-SAVED LOCALLY</span><small>{exercises.length} exercises · {Array.from(new Set(exercises.map(e=>e.muscle))).length} muscle groups</small></div><button onClick={()=>notify("Routine saved. Momentum secured.")}>Save routine ↗</button></div>
  </div>;
}

function Progress({ exercises, update, trained, journal, setJournal, photos, upload, notify, addRecord }: { exercises:Exercise[];update:(id:number,p:Partial<Exercise>)=>void;trained:string[];journal:string;setJournal:(x:string)=>void;photos:string[];upload:(x:FileList|null)=>void;notify:(x:string)=>void;addRecord:(type:ActivityRecord["type"],title:string,detail:string,data?:string)=>void }) {
  const exerciseVolume=(e:Exercise)=>e.done?e.sets*(Number.parseFloat(e.reps)||0)*e.weight:0;
  const weeklyVolume=Math.round(exercises.reduce((sum,e)=>sum+exerciseVolume(e),0));
  const weekBars=[0,0,0,0,0,0,0];exercises.forEach((e,i)=>weekBars[i%7]+=exerciseVolume(e));
  const maxDay=Math.max(...weekBars,1);
  const [selectedWeek,setSelectedWeek]=useState(7);
  const eightWeekVolumes=[6240,7180,6890,7825,8410,9150,10240,weeklyVolume];
  const eightWeekLabels=eightWeekVolumes.map((_,i)=>{const d=new Date();d.setDate(d.getDate()-((7-i)*7));return d.toLocaleDateString("en-CA",{month:"short",day:"numeric"})});
  const selectedVolume=eightWeekVolumes[selectedWeek]; const previousVolume=selectedWeek?eightWeekVolumes[selectedWeek-1]:selectedVolume; const weekChange=previousVolume?Math.round(((selectedVolume-previousVolume)/previousVolume)*100):0;
  const resetWeek=()=>{if(window.confirm("Reset this week’s total volume? This will mark every workout as incomplete. Your exercises and workout details will remain saved.")){exercises.forEach(e=>update(e.id,{done:false}));notify("Weekly volume reset to zero.")}};
  return <div className="progress-page fade-up">
    <div className="progress-grid"><section className="chart-card"><div className="volume-head"><span className="eyebrow">TOTAL VOLUME / THIS WEEK</span><button className="volume-reset" onClick={resetWeek} title="Reset weekly volume" aria-label="Reset weekly volume">↻ <span>RESET WEEK</span></button></div><div className="chart-title"><strong>{weeklyVolume.toLocaleString()} <small>KG</small></strong><span>{exercises.filter(e=>e.done).length} COMPLETED</span></div><div className="chart weekly-chart">{weekBars.map((v,i)=><i key={i} style={{height:`${Math.max(v?12:3,(v/maxDay)*100)}%`}}><b>{v?Math.round(v).toLocaleString():""}</b></i>)}</div><div className="axis week-axis">{["MON","TUE","WED","THU","FRI","SAT","SUN"].map(d=><span key={d}>{d}</span>)}</div></section>
      <section className="body-progress"><div><span className="eyebrow">MUSCLE BALANCE</span><h3>{trained.length || 0} groups</h3><p>trained this cycle</p></div><BodyMap active={trained}/></section></div>
    <section className="history-card"><div className="history-copy"><span className="eyebrow">TOTAL VOLUME / 8-WEEK VIEW</span><h3>Volume over time.</h3><p>Select any week to inspect the exact training load.</p><div className="selected-week-stat"><span>WEEK OF {eightWeekLabels[selectedWeek].toUpperCase()}</span><strong>{selectedVolume.toLocaleString()} <small>KG</small></strong><b className={weekChange>=0?"up":"down"}>{weekChange>=0?"+":""}{weekChange}% vs previous week</b></div></div><div className="history-visual"><div className="history-bars">{eightWeekVolumes.map((v,i)=><button key={i} className={selectedWeek===i?"selected":""} onClick={()=>setSelectedWeek(i)} aria-label={`Week of ${eightWeekLabels[i]}: ${v.toLocaleString()} kilograms`}><span>{selectedWeek===i&&<b>{v.toLocaleString()}</b>}</span><i style={{height:`${Math.max(4,(v/Math.max(...eightWeekVolumes,1))*100)}%`}}/></button>)}</div><div className="history-axis">{eightWeekLabels.map((label,i)=><button className={selectedWeek===i?"selected":""} onClick={()=>setSelectedWeek(i)} key={label}>{label}</button>)}</div></div></section>
    <section className="log-card"><div className="card-head"><div><span className="eyebrow">SESSION LOG</span><h3>Today’s details</h3></div><span>Difficulty / 10</span></div><div className="log-head"><span>EXERCISE</span><span>SETS</span><span>REPS</span><span>KG</span><span>MIN</span><span>RPE</span></div>{exercises.map(e=><div className="log-row" key={e.id}><b>{e.name}<small>{e.muscle}</small></b><input type="number" value={e.sets} onChange={x=>update(e.id,{sets:+x.target.value})}/><input value={e.reps} onChange={x=>update(e.id,{reps:x.target.value})}/><input type="number" value={e.weight} onChange={x=>update(e.id,{weight:+x.target.value})}/><input type="number" value={e.duration} onChange={x=>update(e.id,{duration:+x.target.value})}/><input type="number" min="1" max="10" value={e.difficulty} onChange={x=>update(e.id,{difficulty:+x.target.value})}/></div>)}<button className="log-save" onClick={()=>{addRecord("session","Workout session logged",`${exercises.length} exercises · ${weeklyVolume.toLocaleString()} kg volume`,JSON.stringify(exercises));notify("Session details logged to Calendar.")}}>Log session ↗</button></section>
    <div className="journal-grid"><section className="journal"><span className="eyebrow">DAILY NOTE / {new Date().toLocaleDateString("en-CA",{month:"short",day:"2-digit"}).toUpperCase()}</span><h3>How did it feel?</h3><textarea value={journal} onChange={e=>setJournal(e.target.value)} /><button onClick={()=>{addRecord("note","Daily fitness note",journal);notify("Journal entry saved to Calendar.")}}>Save entry ↗</button></section><section className="photos"><span className="eyebrow">PROGRESS PHOTOS / OPTIONAL</span><h3>See the long game.</h3><div className="photo-row">{photos.map((p,i)=><img key={i} src={p} alt={`Progress upload ${i+1}`}/>)}</div><label className="upload"><input type="file" accept="image/*" multiple onChange={e=>upload(e.target.files)}/><span>＋</span><b>Add photos<small>Private to this device · saved to Calendar</small></b></label></section></div>
  </div>;
}

function Calendar({records}:{records:ActivityRecord[]}){
  const today=new Date(); const [cursor,setCursor]=useState(new Date(today.getFullYear(),today.getMonth(),1));
  const todayKey=today.toLocaleDateString("en-CA"); const [selected,setSelected]=useState(todayKey);
  const year=cursor.getFullYear(),month=cursor.getMonth(); const firstDay=new Date(year,month,1).getDay(); const days=new Date(year,month+1,0).getDate();
  const cells=Array.from({length:42},(_,i)=>{const day=i-firstDay+1;return day>0&&day<=days?day:null});
  const keyFor=(day:number)=>new Date(year,month,day).toLocaleDateString("en-CA"); const selectedRecords=records.filter(r=>r.date===selected);
  const selectedPhotos=selectedRecords.filter(r=>r.type==="photo"&&r.data);
  const selectedNotes=selectedRecords.filter(r=>r.type==="note");
  const selectedSessions=selectedRecords.filter(r=>r.type==="session");
  const sessionExercises=selectedSessions.flatMap(record=>{try{return JSON.parse(record.data||"[]") as Exercise[]}catch{return []}});
  const selectedLabel=new Date(`${selected}T12:00:00`).toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric"});
  return <div className="calendar-page fade-up"><div className="calendar-hero"><div><span className="eyebrow">TRAINING ARCHIVE / {records.length} ENTRIES</span><h1>Every day,<br/><em>remembered.</em></h1></div><div className="calendar-summary"><strong>{new Set(records.map(r=>r.date)).size}</strong><span>ACTIVE DAYS</span><strong>{records.filter(r=>r.type==="session").length}</strong><span>SESSIONS LOGGED</span></div></div><section className="calendar-shell"><div className="calendar-toolbar"><button onClick={()=>setCursor(new Date(year,month-1,1))}>←</button><h2>{cursor.toLocaleDateString("en-CA",{month:"long",year:"numeric"})}</h2><button onClick={()=>setCursor(new Date(year,month+1,1))}>→</button></div><div className="calendar-weekdays">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d=><span key={d}>{d}</span>)}</div><div className="calendar-grid">{cells.map((day,i)=>{if(!day)return <div className="calendar-empty" key={i}/>;const key=keyFor(day),events=records.filter(r=>r.date===key);return <button key={key} className={`${key===selected?"selected":""} ${key===todayKey?"today-date":""}`} onClick={()=>setSelected(key)}><b>{day}</b><div>{events.slice(0,3).map(e=><span className={e.type} key={e.id}>{e.type==="session"?"SESSION":e.type==="note"?"NOTE":"PHOTO"}</span>)}</div>{events.length>3&&<small>+{events.length-3} more</small>}</button>})}</div></section><aside className="day-detail"><span className="eyebrow">SELECTED DAY</span><h3>{selectedLabel}</h3>{selectedRecords.length?<><div className="calendar-events">{selectedRecords.filter(e=>e.type==="session").map(e=><article key={e.id}><i className={e.type}/><div><span>SESSION</span><b>{e.title}</b><p>{e.detail}</p></div></article>)}</div>{selectedPhotos.length>0&&<section className="selected-media"><span className="eyebrow">PROGRESS PHOTOS</span><div className="selected-photo-grid">{selectedPhotos.map(e=><figure key={e.id}><img src={e.data} alt={`Progress logged on ${selectedLabel}`}/><figcaption>{e.detail}</figcaption></figure>)}</div></section>}{selectedNotes.length>0&&<section className="selected-notes"><span className="eyebrow">ADDITIONAL NOTES</span>{selectedNotes.map(e=><article key={e.id}><p>{e.detail||"No written note."}</p></article>)}</section>}</>:<div className="calendar-no-events"><b>○</b><p>No activity logged for this day.</p></div>}</aside><section className="calendar-session-log"><div className="card-head"><div><span className="eyebrow">SESSION LOG · {selected===todayKey?"TODAY’S":"SELECTED DAY’S"} DETAIL</span><h3>{selectedLabel}</h3></div><span>{selectedSessions.length} {selectedSessions.length===1?"session":"sessions"}</span></div>{sessionExercises.length>0?<div className="calendar-log-table"><div className="calendar-log-head"><span>EXERCISE</span><span>MUSCLE</span><span>SETS</span><span>REPS</span><span>KG</span><span>MIN</span><span>RPE</span></div>{sessionExercises.map((e,i)=><div className="calendar-log-row" key={`${e.id}-${i}`}><b>{e.name}</b><span>{e.muscle}</span><span>{e.sets}</span><span>{e.reps}</span><span>{e.weight}</span><span>{e.duration}</span><span>{e.difficulty}/10</span></div>)}</div>:<div className="calendar-log-empty"><b>No detailed session logged.</b><p>Log a workout from Progress Tracker to save every exercise and metric here.</p>{selectedSessions.length>0&&<small>Older session summaries remain above, but were saved before detailed snapshots were enabled.</small>}</div>}</section></div>
}
