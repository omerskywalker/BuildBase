import { describe, it, expect } from "vitest";
import {
  validatePhasesCover12Weeks,
  validateSessionCount,
  validateSessionsPerWeek,
  validateWeightDefaults,
  validateMaleGeqFemale,
  validateSetsReps,
  type SeedPhase,
  type SeedSession,
  type SeedExercise,
} from "@/lib/seed-validation";

// ── Canonical seed data matching supabase/seed.sql ──────────────────────────

const PHASES: SeedPhase[] = [
  { phase_number: 1, week_start: 1,  week_end: 4,  name: "Foundation" },
  { phase_number: 2, week_start: 5,  week_end: 8,  name: "Load Introduction" },
  { phase_number: 3, week_start: 9,  week_end: 12, name: "Strength" },
];

function buildSessions(): SeedSession[] {
  const sessions: SeedSession[] = [];
  let sessionNumber = 1;
  const phaseMap: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 2, 9: 3, 10: 3, 11: 3, 12: 3 };
  for (let week = 1; week <= 12; week++) {
    for (const label of ["A", "B", "C"] as const) {
      sessions.push({
        week_number: week,
        session_number: sessionNumber++,
        day_label: label,
        phase_number: phaseMap[week],
      });
    }
  }
  return sessions;
}

const SESSIONS = buildSessions();

const VALID_WEIGHTED_EXERCISE: SeedExercise = {
  is_bodyweight: false,
  weight_pre_baseline_f: 45,
  weight_pre_baseline_m: 65,
  weight_default_f: 65,
  weight_default_m: 95,
  weight_post_baseline_f: 95,
  weight_post_baseline_m: 135,
  is_abs_finisher: false,
  sets_default: 3,
  reps_default: 8,
};

const BODYWEIGHT_EXERCISE: SeedExercise = {
  is_bodyweight: true,
  weight_pre_baseline_f: 0,
  weight_pre_baseline_m: 0,
  weight_default_f: 0,
  weight_default_m: 0,
  weight_post_baseline_f: 0,
  weight_post_baseline_m: 0,
  is_abs_finisher: false,
  sets_default: 2,
  reps_default: 15,
};

// ── Phase structure ──────────────────────────────────────────────────────────

describe("validatePhasesCover12Weeks", () => {
  it("passes for canonical 3-phase 12-week structure", () => {
    expect(validatePhasesCover12Weeks(PHASES)).toBe(true);
  });

  it("fails if fewer than 3 phases", () => {
    expect(validatePhasesCover12Weeks(PHASES.slice(0, 2))).toBe(false);
  });

  it("fails if week_start does not begin at 1", () => {
    const bad = [
      { ...PHASES[0], week_start: 2 },
      PHASES[1],
      PHASES[2],
    ];
    expect(validatePhasesCover12Weeks(bad)).toBe(false);
  });

  it("fails if week_end does not reach 12", () => {
    const bad = [
      PHASES[0],
      PHASES[1],
      { ...PHASES[2], week_end: 11 },
    ];
    expect(validatePhasesCover12Weeks(bad)).toBe(false);
  });

  it("fails if there is a gap between phases", () => {
    const bad = [
      { ...PHASES[0], week_end: 3 },  // ends week 3
      { ...PHASES[1], week_start: 5 }, // starts week 5 — gap at week 4
      PHASES[2],
    ];
    expect(validatePhasesCover12Weeks(bad)).toBe(false);
  });
});

// ── Session count ────────────────────────────────────────────────────────────

describe("validateSessionCount", () => {
  it("passes for 36 sessions", () => {
    expect(validateSessionCount(SESSIONS)).toBe(true);
  });

  it("fails for fewer than 36 sessions", () => {
    expect(validateSessionCount(SESSIONS.slice(0, 35))).toBe(false);
  });

  it("fails for more than 36 sessions", () => {
    expect(validateSessionCount([...SESSIONS, SESSIONS[0]])).toBe(false);
  });
});

// ── Sessions per week ────────────────────────────────────────────────────────

describe("validateSessionsPerWeek", () => {
  it("passes for canonical 12-week × 3-session-per-week structure", () => {
    expect(validateSessionsPerWeek(SESSIONS)).toBe(true);
  });

  it("fails if a week is missing the C day", () => {
    const bad = SESSIONS.filter((s) => !(s.week_number === 3 && s.day_label === "C"));
    expect(validateSessionsPerWeek(bad)).toBe(false);
  });

  it("fails if a week has a duplicate day", () => {
    const extraA = { week_number: 1, session_number: 999, day_label: "A" as const, phase_number: 1 };
    const bad = SESSIONS.filter((s) => !(s.week_number === 1 && s.day_label === "C"));
    bad.push(extraA);
    expect(validateSessionsPerWeek(bad)).toBe(false);
  });
});

// ── Exercise weight defaults ─────────────────────────────────────────────────

describe("validateWeightDefaults", () => {
  it("passes for valid weighted exercise", () => {
    expect(validateWeightDefaults(VALID_WEIGHTED_EXERCISE)).toBe(true);
  });

  it("passes for bodyweight exercise (all zeros)", () => {
    expect(validateWeightDefaults(BODYWEIGHT_EXERCISE)).toBe(true);
  });

  it("fails if any weight is negative", () => {
    expect(validateWeightDefaults({ ...VALID_WEIGHTED_EXERCISE, weight_default_f: -5 })).toBe(false);
  });
});

describe("validateMaleGeqFemale", () => {
  it("passes when male >= female for all tiers", () => {
    expect(validateMaleGeqFemale(VALID_WEIGHTED_EXERCISE)).toBe(true);
  });

  it("passes for bodyweight exercise", () => {
    expect(validateMaleGeqFemale(BODYWEIGHT_EXERCISE)).toBe(true);
  });

  it("fails when male default < female default", () => {
    expect(validateMaleGeqFemale({ ...VALID_WEIGHTED_EXERCISE, weight_default_m: 50, weight_default_f: 65 })).toBe(false);
  });
});

describe("validateSetsReps", () => {
  it("passes for standard 3×8", () => {
    expect(validateSetsReps(VALID_WEIGHTED_EXERCISE)).toBe(true);
  });

  it("passes for time-based exercise (reps=0)", () => {
    expect(validateSetsReps({ ...BODYWEIGHT_EXERCISE, reps_default: 0 })).toBe(true);
  });

  it("fails for 0 sets", () => {
    expect(validateSetsReps({ ...VALID_WEIGHTED_EXERCISE, sets_default: 0 })).toBe(false);
  });

  it("fails for reps over 20", () => {
    expect(validateSetsReps({ ...VALID_WEIGHTED_EXERCISE, reps_default: 25 })).toBe(false);
  });
});
