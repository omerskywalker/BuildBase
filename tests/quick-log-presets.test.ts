import { describe, it, expect } from "vitest";
import {
  MUSCLE_GROUPS,
  EXERCISES_BY_MUSCLE,
  getPresetExercises,
  type MuscleGroupKey,
  type ExercisePreset,
} from "@/lib/quick-log-presets";

describe("MUSCLE_GROUPS", () => {
  it("exports 9 muscle groups", () => {
    expect(MUSCLE_GROUPS).toHaveLength(9);
  });

  it("has required fields on every entry", () => {
    for (const group of MUSCLE_GROUPS) {
      expect(group.key).toBeTruthy();
      expect(group.label).toBeTruthy();
      expect(group.emoji).toBeTruthy();
    }
  });

  it("contains all expected keys", () => {
    const keys = MUSCLE_GROUPS.map((g) => g.key);
    expect(keys).toContain("chest");
    expect(keys).toContain("back");
    expect(keys).toContain("shoulders");
    expect(keys).toContain("biceps");
    expect(keys).toContain("triceps");
    expect(keys).toContain("quads");
    expect(keys).toContain("glutes");
    expect(keys).toContain("hamstrings");
    expect(keys).toContain("abs");
  });

  it("has unique keys", () => {
    const keys = MUSCLE_GROUPS.map((g) => g.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("EXERCISES_BY_MUSCLE", () => {
  it("has an entry for every muscle group key", () => {
    for (const group of MUSCLE_GROUPS) {
      expect(EXERCISES_BY_MUSCLE[group.key]).toBeDefined();
      expect(EXERCISES_BY_MUSCLE[group.key].length).toBeGreaterThan(0);
    }
  });

  it("each exercise has required fields", () => {
    for (const [muscleKey, exercises] of Object.entries(EXERCISES_BY_MUSCLE)) {
      for (const ex of exercises as ExercisePreset[]) {
        expect(ex.name).toBeTruthy();
        expect(ex.muscleGroup).toBe(muscleKey);
        expect(typeof ex.defaultReps).toBe("number");
        expect(ex.defaultReps).toBeGreaterThan(0);
      }
    }
  });

  it("each exercise muscleGroup matches its key", () => {
    for (const [key, exercises] of Object.entries(EXERCISES_BY_MUSCLE)) {
      for (const ex of exercises as ExercisePreset[]) {
        expect(ex.muscleGroup).toBe(key);
      }
    }
  });

  it("has at least 5 exercises per muscle group", () => {
    for (const group of MUSCLE_GROUPS) {
      expect(EXERCISES_BY_MUSCLE[group.key].length).toBeGreaterThanOrEqual(5);
    }
  });

  it("bodyweight flag is a boolean when present", () => {
    for (const exercises of Object.values(EXERCISES_BY_MUSCLE)) {
      for (const ex of exercises as ExercisePreset[]) {
        if ("bodyweight" in ex) {
          expect(typeof ex.bodyweight).toBe("boolean");
        }
      }
    }
  });

  it("chest contains Bench Press", () => {
    const names = EXERCISES_BY_MUSCLE.chest.map((e) => e.name);
    expect(names).toContain("Bench Press");
  });

  it("back contains Pull-ups as bodyweight", () => {
    const pullups = EXERCISES_BY_MUSCLE.back.find((e) => e.name === "Pull-ups");
    expect(pullups).toBeDefined();
    expect(pullups?.bodyweight).toBe(true);
  });

  it("abs exercises have reasonable defaultReps", () => {
    for (const ex of EXERCISES_BY_MUSCLE.abs) {
      expect(ex.defaultReps).toBeGreaterThanOrEqual(10);
    }
  });
});

describe("getPresetExercises", () => {
  it("returns exercises for a single muscle group", () => {
    const result = getPresetExercises(["chest"]);
    expect(result.length).toBeGreaterThan(0);
  });

  it("every returned exercise has defaultSets", () => {
    const result = getPresetExercises(["back"]);
    for (const ex of result) {
      expect(typeof ex.defaultSets).toBe("number");
      expect(ex.defaultSets).toBeGreaterThan(0);
    }
  });

  it("returns combo preset for biceps+triceps", () => {
    const result = getPresetExercises(["biceps", "triceps"]);
    expect(result.length).toBeGreaterThan(0);
    const muscleGroups = result.map((e) => e.muscleGroup);
    expect(muscleGroups).toContain("biceps");
    expect(muscleGroups).toContain("triceps");
  });

  it("returns same combo regardless of selection order (triceps+biceps === biceps+triceps)", () => {
    const a = getPresetExercises(["biceps", "triceps"]);
    const b = getPresetExercises(["triceps", "biceps"]);
    expect(a.map((e) => e.name)).toEqual(b.map((e) => e.name));
  });

  it("returns combo preset for back+biceps", () => {
    const result = getPresetExercises(["back", "biceps"]);
    const muscleGroups = result.map((e) => e.muscleGroup);
    expect(muscleGroups).toContain("back");
    expect(muscleGroups).toContain("biceps");
  });

  it("returns combo preset for quads+glutes", () => {
    const result = getPresetExercises(["quads", "glutes"]);
    const muscleGroups = result.map((e) => e.muscleGroup);
    expect(muscleGroups).toContain("quads");
    expect(muscleGroups).toContain("glutes");
  });

  it("returns combo preset for quads+glutes+hamstrings", () => {
    const result = getPresetExercises(["quads", "glutes", "hamstrings"]);
    expect(result.length).toBeGreaterThan(0);
    const muscleGroups = new Set(result.map((e) => e.muscleGroup));
    expect(muscleGroups).toContain("quads");
    expect(muscleGroups).toContain("glutes");
    expect(muscleGroups).toContain("hamstrings");
  });

  it("returns no duplicate exercise names for a single muscle", () => {
    for (const group of MUSCLE_GROUPS) {
      const result = getPresetExercises([group.key]);
      const names = result.map((e) => e.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("returns no duplicate exercise names for arbitrary multi-muscle selection", () => {
    const result = getPresetExercises(["shoulders", "abs"]);
    const names = result.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("falls back to generic (top-2 per muscle) when no combo preset exists", () => {
    // shoulders + abs has no combo preset
    const result = getPresetExercises(["shoulders", "abs"]);
    // Should include up to 2 exercises from each muscle group
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it("generic fallback exercises have defaultSets of 3", () => {
    const result = getPresetExercises(["shoulders", "abs"]);
    for (const ex of result) {
      expect(ex.defaultSets).toBe(3);
    }
  });

  it("returns empty array for empty selection", () => {
    const result = getPresetExercises([]);
    expect(result).toEqual([]);
  });
});
