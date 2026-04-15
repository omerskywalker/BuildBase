/**
 * Pure helpers for validating seed data shape.
 * Used in tests — no DB dependency.
 */

export interface SeedPhase {
  phase_number: number;
  week_start: number;
  week_end: number;
  name: string;
}

export interface SeedSession {
  week_number: number;
  session_number: number;
  day_label: "A" | "B" | "C";
  phase_number: number;
}

export interface SeedExercise {
  is_bodyweight: boolean;
  weight_pre_baseline_f: number;
  weight_pre_baseline_m: number;
  weight_default_f: number;
  weight_default_m: number;
  weight_post_baseline_f: number;
  weight_post_baseline_m: number;
  is_abs_finisher: boolean;
  sets_default: number;
  reps_default: number;
}

/** Validates phase structure covers exactly 12 weeks with no gaps */
export function validatePhasesCover12Weeks(phases: SeedPhase[]): boolean {
  if (phases.length !== 3) return false;
  const sorted = [...phases].sort((a, b) => a.week_start - b.week_start);
  if (sorted[0].week_start !== 1) return false;
  if (sorted[sorted.length - 1].week_end !== 12) return false;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].week_start !== sorted[i - 1].week_end + 1) return false;
  }
  return true;
}

/** Validates a session list contains exactly 36 sessions (3 per week × 12 weeks) */
export function validateSessionCount(sessions: SeedSession[]): boolean {
  return sessions.length === 36;
}

/** Validates each week has exactly one A, B, and C session */
export function validateSessionsPerWeek(sessions: SeedSession[]): boolean {
  const weeks = new Map<number, Set<string>>();
  for (const s of sessions) {
    if (!weeks.has(s.week_number)) weeks.set(s.week_number, new Set());
    weeks.get(s.week_number)!.add(s.day_label);
  }
  if (weeks.size !== 12) return false;
  for (const labels of weeks.values()) {
    if (!labels.has("A") || !labels.has("B") || !labels.has("C")) return false;
    if (labels.size !== 3) return false;
  }
  return true;
}

/** Validates that a non-bodyweight exercise has all 6 weight defaults set */
export function validateWeightDefaults(exercise: SeedExercise): boolean {
  if (exercise.is_bodyweight) return true;
  return (
    exercise.weight_pre_baseline_f >= 0 &&
    exercise.weight_pre_baseline_m >= 0 &&
    exercise.weight_default_f >= 0 &&
    exercise.weight_default_m >= 0 &&
    exercise.weight_post_baseline_f >= 0 &&
    exercise.weight_post_baseline_m >= 0
  );
}

/** Validates that male defaults are >= female defaults (sanity check) */
export function validateMaleGeqFemale(exercise: SeedExercise): boolean {
  if (exercise.is_bodyweight) return true;
  return (
    exercise.weight_pre_baseline_m >= exercise.weight_pre_baseline_f &&
    exercise.weight_default_m >= exercise.weight_default_f &&
    exercise.weight_post_baseline_m >= exercise.weight_post_baseline_f
  );
}

/** Validates sets and reps are within reasonable ranges */
export function validateSetsReps(exercise: SeedExercise): boolean {
  return (
    exercise.sets_default >= 1 &&
    exercise.sets_default <= 6 &&
    exercise.reps_default >= 0 && // 0 = time-based (plank, hollow body)
    exercise.reps_default <= 20
  );
}
