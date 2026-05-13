export const MUSCLE_GROUPS = [
  { key: "chest",       label: "Chest",       emoji: "💪" },
  { key: "back",        label: "Back",        emoji: "🏋️" },
  { key: "shoulders",   label: "Shoulders",   emoji: "🔝" },
  { key: "biceps",      label: "Biceps",      emoji: "💪" },
  { key: "triceps",     label: "Triceps",     emoji: "💪" },
  { key: "quads",       label: "Quads",       emoji: "🦵" },
  { key: "glutes",      label: "Glutes",      emoji: "🍑" },
  { key: "hamstrings",  label: "Hamstrings",  emoji: "🦵" },
  { key: "abs",         label: "Abs",         emoji: "🔥" },
] as const;

export type MuscleGroupKey = typeof MUSCLE_GROUPS[number]["key"];

export interface ExercisePreset {
  name: string;
  muscleGroup: MuscleGroupKey;
  defaultReps: number;
  bodyweight?: boolean;
}

export const EXERCISES_BY_MUSCLE: Record<MuscleGroupKey, ExercisePreset[]> = {
  chest: [
    { name: "Bench Press",          muscleGroup: "chest", defaultReps: 8 },
    { name: "Incline Dumbbell Press", muscleGroup: "chest", defaultReps: 10 },
    { name: "Dumbbell Fly",         muscleGroup: "chest", defaultReps: 12 },
    { name: "Cable Crossover",      muscleGroup: "chest", defaultReps: 12 },
    { name: "Push-ups",             muscleGroup: "chest", defaultReps: 15, bodyweight: true },
    { name: "Pec Deck",             muscleGroup: "chest", defaultReps: 12 },
  ],
  back: [
    { name: "Lat Pulldown",         muscleGroup: "back", defaultReps: 10 },
    { name: "Bent-over Row",        muscleGroup: "back", defaultReps: 8 },
    { name: "Cable Row",            muscleGroup: "back", defaultReps: 10 },
    { name: "Pull-ups",             muscleGroup: "back", defaultReps: 8, bodyweight: true },
    { name: "T-Bar Row",            muscleGroup: "back", defaultReps: 8 },
    { name: "Single-arm Row",       muscleGroup: "back", defaultReps: 10 },
    { name: "Face Pull",            muscleGroup: "back", defaultReps: 15 },
  ],
  shoulders: [
    { name: "Overhead Press",       muscleGroup: "shoulders", defaultReps: 8 },
    { name: "Lateral Raises",       muscleGroup: "shoulders", defaultReps: 15 },
    { name: "Front Raises",         muscleGroup: "shoulders", defaultReps: 12 },
    { name: "Arnold Press",         muscleGroup: "shoulders", defaultReps: 10 },
    { name: "Rear Delt Fly",        muscleGroup: "shoulders", defaultReps: 15 },
    { name: "Face Pull",            muscleGroup: "shoulders", defaultReps: 15 },
  ],
  biceps: [
    { name: "Bicep Curls",          muscleGroup: "biceps", defaultReps: 10 },
    { name: "Hammer Curls",         muscleGroup: "biceps", defaultReps: 10 },
    { name: "Concentration Curls",  muscleGroup: "biceps", defaultReps: 12 },
    { name: "Preacher Curls",       muscleGroup: "biceps", defaultReps: 10 },
    { name: "Cable Curls",          muscleGroup: "biceps", defaultReps: 12 },
    { name: "Incline Dumbbell Curls", muscleGroup: "biceps", defaultReps: 10 },
  ],
  triceps: [
    { name: "Skull Crushers",       muscleGroup: "triceps", defaultReps: 10 },
    { name: "Tricep Kickback",      muscleGroup: "triceps", defaultReps: 12 },
    { name: "Tricep Pushdown",      muscleGroup: "triceps", defaultReps: 12 },
    { name: "Overhead Tricep Extension", muscleGroup: "triceps", defaultReps: 12 },
    { name: "Dips",                 muscleGroup: "triceps", defaultReps: 10, bodyweight: true },
    { name: "Close-Grip Bench Press", muscleGroup: "triceps", defaultReps: 8 },
  ],
  quads: [
    { name: "Squat",                muscleGroup: "quads", defaultReps: 8 },
    { name: "Leg Press",            muscleGroup: "quads", defaultReps: 10 },
    { name: "Leg Extension",        muscleGroup: "quads", defaultReps: 12 },
    { name: "Lunges",               muscleGroup: "quads", defaultReps: 10, bodyweight: true },
    { name: "Bulgarian Split Squat", muscleGroup: "quads", defaultReps: 10 },
    { name: "Hack Squat",           muscleGroup: "quads", defaultReps: 10 },
  ],
  glutes: [
    { name: "Hip Thrust",           muscleGroup: "glutes", defaultReps: 10 },
    { name: "Romanian Deadlift",    muscleGroup: "glutes", defaultReps: 10 },
    { name: "Glute Bridge",         muscleGroup: "glutes", defaultReps: 15, bodyweight: true },
    { name: "Cable Kickback",       muscleGroup: "glutes", defaultReps: 15 },
    { name: "Step-ups",             muscleGroup: "glutes", defaultReps: 12, bodyweight: true },
    { name: "Sumo Squat",           muscleGroup: "glutes", defaultReps: 12 },
  ],
  hamstrings: [
    { name: "Leg Curl",             muscleGroup: "hamstrings", defaultReps: 12 },
    { name: "Romanian Deadlift",    muscleGroup: "hamstrings", defaultReps: 10 },
    { name: "Nordic Curl",          muscleGroup: "hamstrings", defaultReps: 8, bodyweight: true },
    { name: "Good Mornings",        muscleGroup: "hamstrings", defaultReps: 10 },
    { name: "Stiff-leg Deadlift",   muscleGroup: "hamstrings", defaultReps: 10 },
  ],
  abs: [
    { name: "Plank",                muscleGroup: "abs", defaultReps: 60, bodyweight: true },
    { name: "Leg Raises",           muscleGroup: "abs", defaultReps: 15, bodyweight: true },
    { name: "Russian Twists",       muscleGroup: "abs", defaultReps: 20, bodyweight: true },
    { name: "Cable Crunch",         muscleGroup: "abs", defaultReps: 15 },
    { name: "Dead Bug",             muscleGroup: "abs", defaultReps: 10, bodyweight: true },
    { name: "Bicycle Crunches",     muscleGroup: "abs", defaultReps: 20, bodyweight: true },
  ],
};

type ComboPreset = ExercisePreset & { defaultSets: number };

const COMBO_PRESETS: Record<string, ComboPreset[]> = {
  "biceps+triceps": [
    { name: "Skull Crushers",        muscleGroup: "triceps",  defaultReps: 10, defaultSets: 3 },
    { name: "Bicep Curls",           muscleGroup: "biceps",   defaultReps: 10, defaultSets: 3 },
    { name: "Tricep Kickback",       muscleGroup: "triceps",  defaultReps: 12, defaultSets: 3 },
    { name: "Hammer Curls",          muscleGroup: "biceps",   defaultReps: 10, defaultSets: 3 },
  ],
  "triceps+biceps": [
    { name: "Skull Crushers",        muscleGroup: "triceps",  defaultReps: 10, defaultSets: 3 },
    { name: "Bicep Curls",           muscleGroup: "biceps",   defaultReps: 10, defaultSets: 3 },
    { name: "Tricep Kickback",       muscleGroup: "triceps",  defaultReps: 12, defaultSets: 3 },
    { name: "Hammer Curls",          muscleGroup: "biceps",   defaultReps: 10, defaultSets: 3 },
  ],
  "quads+glutes": [
    { name: "Squat",                 muscleGroup: "quads",    defaultReps: 8,  defaultSets: 3 },
    { name: "Hip Thrust",            muscleGroup: "glutes",   defaultReps: 10, defaultSets: 3 },
    { name: "Lunges",                muscleGroup: "quads",    defaultReps: 10, defaultSets: 3 },
    { name: "Leg Press",             muscleGroup: "quads",    defaultReps: 10, defaultSets: 3 },
  ],
  "glutes+quads": [
    { name: "Squat",                 muscleGroup: "quads",    defaultReps: 8,  defaultSets: 3 },
    { name: "Hip Thrust",            muscleGroup: "glutes",   defaultReps: 10, defaultSets: 3 },
    { name: "Lunges",                muscleGroup: "quads",    defaultReps: 10, defaultSets: 3 },
    { name: "Leg Press",             muscleGroup: "quads",    defaultReps: 10, defaultSets: 3 },
  ],
  "quads+glutes+hamstrings": [
    { name: "Squat",                 muscleGroup: "quads",    defaultReps: 8,  defaultSets: 4 },
    { name: "Romanian Deadlift",     muscleGroup: "hamstrings", defaultReps: 10, defaultSets: 3 },
    { name: "Hip Thrust",            muscleGroup: "glutes",   defaultReps: 10, defaultSets: 3 },
    { name: "Leg Curl",              muscleGroup: "hamstrings", defaultReps: 12, defaultSets: 3 },
    { name: "Leg Press",             muscleGroup: "quads",    defaultReps: 10, defaultSets: 3 },
  ],
  "chest+shoulders": [
    { name: "Bench Press",           muscleGroup: "chest",    defaultReps: 8,  defaultSets: 4 },
    { name: "Overhead Press",        muscleGroup: "shoulders", defaultReps: 8, defaultSets: 3 },
    { name: "Incline Dumbbell Press", muscleGroup: "chest",   defaultReps: 10, defaultSets: 3 },
    { name: "Lateral Raises",        muscleGroup: "shoulders", defaultReps: 15, defaultSets: 3 },
  ],
  "shoulders+chest": [
    { name: "Bench Press",           muscleGroup: "chest",    defaultReps: 8,  defaultSets: 4 },
    { name: "Overhead Press",        muscleGroup: "shoulders", defaultReps: 8, defaultSets: 3 },
    { name: "Incline Dumbbell Press", muscleGroup: "chest",   defaultReps: 10, defaultSets: 3 },
    { name: "Lateral Raises",        muscleGroup: "shoulders", defaultReps: 15, defaultSets: 3 },
  ],
  "back+biceps": [
    { name: "Lat Pulldown",          muscleGroup: "back",     defaultReps: 10, defaultSets: 3 },
    { name: "Bent-over Row",         muscleGroup: "back",     defaultReps: 8,  defaultSets: 3 },
    { name: "Bicep Curls",           muscleGroup: "biceps",   defaultReps: 10, defaultSets: 3 },
    { name: "Hammer Curls",          muscleGroup: "biceps",   defaultReps: 10, defaultSets: 3 },
  ],
  "biceps+back": [
    { name: "Lat Pulldown",          muscleGroup: "back",     defaultReps: 10, defaultSets: 3 },
    { name: "Bent-over Row",         muscleGroup: "back",     defaultReps: 8,  defaultSets: 3 },
    { name: "Bicep Curls",           muscleGroup: "biceps",   defaultReps: 10, defaultSets: 3 },
    { name: "Hammer Curls",          muscleGroup: "biceps",   defaultReps: 10, defaultSets: 3 },
  ],
  "chest+triceps": [
    { name: "Bench Press",           muscleGroup: "chest",    defaultReps: 8,  defaultSets: 4 },
    { name: "Skull Crushers",        muscleGroup: "triceps",  defaultReps: 10, defaultSets: 3 },
    { name: "Incline Dumbbell Press", muscleGroup: "chest",   defaultReps: 10, defaultSets: 3 },
    { name: "Tricep Pushdown",       muscleGroup: "triceps",  defaultReps: 12, defaultSets: 3 },
  ],
  "triceps+chest": [
    { name: "Bench Press",           muscleGroup: "chest",    defaultReps: 8,  defaultSets: 4 },
    { name: "Skull Crushers",        muscleGroup: "triceps",  defaultReps: 10, defaultSets: 3 },
    { name: "Incline Dumbbell Press", muscleGroup: "chest",   defaultReps: 10, defaultSets: 3 },
    { name: "Tricep Pushdown",       muscleGroup: "triceps",  defaultReps: 12, defaultSets: 3 },
  ],
};

export function getPresetExercises(
  selected: MuscleGroupKey[]
): ComboPreset[] {
  const key = [...selected].sort().join("+");
  const comboKey = selected.join("+");

  if (COMBO_PRESETS[comboKey]) return COMBO_PRESETS[comboKey];
  if (COMBO_PRESETS[key]) return COMBO_PRESETS[key];

  const result: ComboPreset[] = [];
  const seen = new Set<string>();
  for (const muscle of selected) {
    const exercises = EXERCISES_BY_MUSCLE[muscle].slice(0, 2);
    for (const ex of exercises) {
      if (!seen.has(ex.name)) {
        seen.add(ex.name);
        result.push({ ...ex, defaultSets: 3 });
      }
    }
  }
  return result;
}
