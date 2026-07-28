import type { CatalogueItem } from "../types";

// Pipe-separated source keeps the 100-movement library readable in one place:
// category | name | equipment | primary muscles | working sets | rep range
const SOURCE = `
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
Core|Wood Chop|Cable|Obliques|3|12`;

export const CATALOGUE: CatalogueItem[] = SOURCE.trim()
  .split("\n")
  .map((line, index) => {
    const [category, name, equipment, muscles, sets, reps] = line.split("|");
    return { id: index + 1, category, name, equipment, muscles, sets: Number(sets), reps };
  });

/** Catalogue categories map onto the finer-grained muscle list used elsewhere. */
export const catalogueFallbackMuscle = (category: string) =>
  category === "Back" ? "Mid-Back" : category === "Legs" ? "Quadriceps" : category;

export const CATALOGUE_CATEGORIES = ["All", ...Array.from(new Set(CATALOGUE.map((i) => i.category)))];
