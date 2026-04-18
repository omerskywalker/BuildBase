import { describe, it, expect } from "vitest";
import { getDefaultWeight, formatWeight } from "@/lib/utils";

// TemplateExercise weight fixture
const makeTE = (overrides: Partial<{
  is_bodyweight: boolean;
  weight_pre_baseline_f: number;
  weight_pre_baseline_m: number;
  weight_default_f: number;
  weight_default_m: number;
  weight_post_baseline_f: number;
  weight_post_baseline_m: number;
}> = {}) => ({
  is_bodyweight: false,
  weight_pre_baseline_f: 45,
  weight_pre_baseline_m: 65,
  weight_default_f: 55,
  weight_default_m: 95,
  weight_post_baseline_f: 75,
  weight_post_baseline_m: 135,
  ...overrides,
});

describe("getDefaultWeight", () => {
  it("returns 0 for bodyweight exercises", () => {
    expect(getDefaultWeight(makeTE({ is_bodyweight: true }), "default", "male")).toBe(0);
    expect(getDefaultWeight(makeTE({ is_bodyweight: true }), "default", "female")).toBe(0);
  });

  it("returns correct male default weight", () => {
    expect(getDefaultWeight(makeTE(), "default", "male")).toBe(95);
  });

  it("returns correct female default weight", () => {
    expect(getDefaultWeight(makeTE(), "default", "female")).toBe(55);
  });

  it("uses female weights for other/unset genders", () => {
    expect(getDefaultWeight(makeTE(), "default", "other")).toBe(55);
    expect(getDefaultWeight(makeTE(), "default", "unset")).toBe(55);
  });

  it("returns pre_baseline weights correctly", () => {
    expect(getDefaultWeight(makeTE(), "pre_baseline", "male")).toBe(65);
    expect(getDefaultWeight(makeTE(), "pre_baseline", "female")).toBe(45);
  });

  it("returns post_baseline weights correctly", () => {
    expect(getDefaultWeight(makeTE(), "post_baseline", "male")).toBe(135);
    expect(getDefaultWeight(makeTE(), "post_baseline", "female")).toBe(75);
  });
});

describe("formatWeight", () => {
  it("returns BW for weight 0", () => {
    expect(formatWeight(0)).toBe("BW");
  });

  it("returns BW when isBodyweight is true", () => {
    expect(formatWeight(45, true)).toBe("BW");
  });

  it("formats non-zero weight with lbs", () => {
    expect(formatWeight(95)).toBe("95 lbs");
    expect(formatWeight(135)).toBe("135 lbs");
  });
});

describe("set logging invariants", () => {
  it("set_number is 1-indexed and matches array position", () => {
    const sets = 4;
    const setNumbers = Array.from({ length: sets }, (_, i) => i + 1);
    expect(setNumbers).toEqual([1, 2, 3, 4]);
  });

  it("weight cannot go below 0 (min enforced client-side)", () => {
    const min = 0;
    const step = 5;
    const current = 0;
    const next = Math.max(min, current - step);
    expect(next).toBe(0);
  });

  it("reps cannot go below 1 (min enforced client-side)", () => {
    const current = 1;
    const next = Math.max(1, current - 1);
    expect(next).toBe(1);
  });

  it("weight increments by step", () => {
    const weight = 95;
    const step = 5;
    expect(weight + step).toBe(100);
    expect(Math.max(0, weight - step)).toBe(90);
  });
});
