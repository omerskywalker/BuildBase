import type { MuscleGroupKey } from "@/lib/quick-log-presets";

export interface QuickSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface QuickExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroupKey;
  bodyweight: boolean;
  sets: QuickSet[];
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function makeSet(reps: number): QuickSet {
  return { id: uid(), reps, weight: 0, completed: false };
}

export function makeExercise(
  name: string,
  muscleGroup: MuscleGroupKey,
  defaultReps: number,
  defaultSets: number,
  bodyweight = false
): QuickExercise {
  return {
    id: uid(),
    name,
    muscleGroup,
    bodyweight,
    sets: Array.from({ length: defaultSets }, () => makeSet(defaultReps)),
  };
}
