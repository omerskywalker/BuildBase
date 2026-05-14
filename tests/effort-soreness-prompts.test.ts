import { describe, it, expect } from "vitest";
import { EFFORT_LABELS, SORENESS_LABELS, SORENESS_PROMPT_GAP_HOURS } from "@/lib/constants";
import { hoursSince } from "@/lib/utils";

// ─── Shared helpers ────────────────────────────────────────────────────────────

/** Valid score range used by both prompts */
const VALID_SCORES: number[] = [1, 2, 3, 4, 5];

/** Server-side validation mirrors the API route logic */
function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

// ─── EFFORT_LABELS ─────────────────────────────────────────────────────────────

describe("EFFORT_LABELS", () => {
  it("has entries for all 5 scores", () => {
    expect(Object.keys(EFFORT_LABELS)).toHaveLength(5);
  });

  it("each entry has emoji, label, and color", () => {
    VALID_SCORES.forEach((score) => {
      const entry = EFFORT_LABELS[score];
      expect(entry).toBeDefined();
      expect(typeof entry.emoji).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.color).toBe("string");
      expect(entry.color).toMatch(/^#/);
    });
  });

  it("score 1 is the easiest (Easy)", () => {
    expect(EFFORT_LABELS[1].label).toBe("Easy");
  });

  it("score 5 is the hardest (Maxed)", () => {
    expect(EFFORT_LABELS[5].label).toBe("Maxed");
  });
});

// ─── SORENESS_LABELS ───────────────────────────────────────────────────────────

describe("SORENESS_LABELS", () => {
  it("has entries for all 5 scores", () => {
    expect(Object.keys(SORENESS_LABELS)).toHaveLength(5);
  });

  it("each entry has emoji, label, and color", () => {
    VALID_SCORES.forEach((score) => {
      const entry = SORENESS_LABELS[score];
      expect(entry).toBeDefined();
      expect(typeof entry.emoji).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.color).toBe("string");
    });
  });

  it("score 1 is worst soreness (Rough)", () => {
    expect(SORENESS_LABELS[1].label).toBe("Rough");
  });

  it("score 5 is best recovery (Fresh)", () => {
    expect(SORENESS_LABELS[5].label).toBe("Fresh");
  });
});

// ─── Score validation (mirrors API route logic) ────────────────────────────────

describe("isValidScore", () => {
  it("accepts all scores 1–5", () => {
    VALID_SCORES.forEach((score) => {
      expect(isValidScore(score)).toBe(true);
    });
  });

  it("rejects 0", () => {
    expect(isValidScore(0)).toBe(false);
  });

  it("rejects 6", () => {
    expect(isValidScore(6)).toBe(false);
  });

  it("rejects negative values", () => {
    expect(isValidScore(-1)).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(isValidScore(2.5)).toBe(false);
    expect(isValidScore(NaN)).toBe(false);
  });
});

// ─── hoursSince + soreness gate ────────────────────────────────────────────────

describe("soreness prompt gate", () => {
  it("SORENESS_PROMPT_GAP_HOURS is 12", () => {
    expect(SORENESS_PROMPT_GAP_HOURS).toBe(12);
  });

  it("fires when gap exceeds threshold", () => {
    const thirteenHoursAgo = new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString();
    expect(hoursSince(thirteenHoursAgo)).toBeGreaterThan(SORENESS_PROMPT_GAP_HOURS);
  });

  it("does not fire when gap is under threshold", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(hoursSince(threeHoursAgo)).toBeLessThan(SORENESS_PROMPT_GAP_HOURS);
  });

  it("returns Infinity for null (never completed)", () => {
    expect(hoursSince(null)).toBe(Infinity);
  });

  it("always fires when lastCompletedAt is null", () => {
    // Infinity > any threshold
    expect(hoursSince(null) > SORENESS_PROMPT_GAP_HOURS).toBe(true);
  });
});
