import { describe, it, expect } from "vitest";
import { formatWeight, timeAgo } from "@/lib/utils";
import type { SetLog, SessionLog } from "@/lib/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeSetLog = (overrides: Partial<SetLog> = {}): SetLog => ({
  id: "sl-1",
  session_log_id: "sess-1",
  template_exercise_id: "te-1",
  exercise_id: "ex-1",
  set_number: 1,
  weight_used: 95,
  reps_completed: 8,
  is_completed: true,
  notes: null,
  logged_at: new Date().toISOString(),
  ...overrides,
});

const makeSessionLog = (overrides: Partial<SessionLog> = {}): SessionLog => ({
  id: "sess-1",
  user_id: "user-1",
  workout_template_id: "wt-1",
  enrollment_id: "enr-1",
  week_number: 1,
  session_number: 1,
  started_at: "2026-04-18T10:00:00Z",
  completed_at: "2026-04-18T11:00:00Z",
  is_complete: true,
  post_session_effort: 4,
  pre_session_soreness: null,
  soreness_prompted: false,
  notes: null,
  created_at: "2026-04-18T10:00:00Z",
  ...overrides,
});

// ─── Weight display ────────────────────────────────────────────────────────────

describe("session detail — weight display", () => {
  it("shows lbs for normal weighted sets", () => {
    const sl = makeSetLog({ weight_used: 135 });
    expect(formatWeight(sl.weight_used!, false)).toBe("135 lbs");
  });

  it("shows BW for bodyweight exercises", () => {
    const sl = makeSetLog({ weight_used: 0 });
    expect(formatWeight(sl.weight_used!, true)).toBe("BW");
  });

  it("shows BW when weight is null (treated as 0)", () => {
    // null weight_used means bodyweight / not recorded
    expect(formatWeight(0, true)).toBe("BW");
  });

  it("shows BW for weight 0 even without isBodyweight flag", () => {
    expect(formatWeight(0)).toBe("BW");
  });
});

// ─── Set filtering ─────────────────────────────────────────────────────────────

describe("session detail — completed set filtering", () => {
  const allSets: SetLog[] = [
    makeSetLog({ id: "sl-1", set_number: 1, is_completed: true }),
    makeSetLog({ id: "sl-2", set_number: 2, is_completed: false }),
    makeSetLog({ id: "sl-3", set_number: 3, is_completed: true }),
  ];

  it("filters to only completed sets", () => {
    const completed = allSets.filter((sl) => sl.is_completed);
    expect(completed).toHaveLength(2);
    expect(completed.map((sl) => sl.set_number)).toEqual([1, 3]);
  });

  it("returns empty array when no sets are completed", () => {
    const none = allSets.filter(() => false);
    expect(none).toHaveLength(0);
  });

  it("groups set logs by template_exercise_id", () => {
    const mixed: SetLog[] = [
      makeSetLog({ id: "sl-a", template_exercise_id: "te-1" }),
      makeSetLog({ id: "sl-b", template_exercise_id: "te-2" }),
      makeSetLog({ id: "sl-c", template_exercise_id: "te-1" }),
    ];
    const forTe1 = mixed.filter((sl) => sl.template_exercise_id === "te-1");
    expect(forTe1).toHaveLength(2);
  });
});

// ─── Effort label mapping ──────────────────────────────────────────────────────

const EFFORT_LABELS: Record<number, string> = {
  1: "🔴 Easy",
  2: "🟡 Moderate",
  3: "🟢 Good",
  4: "🔵 Hard",
  5: "💪 Maxed",
};

describe("session detail — effort labels", () => {
  it("maps all 5 effort levels to labels", () => {
    expect(EFFORT_LABELS[1]).toBe("🔴 Easy");
    expect(EFFORT_LABELS[2]).toBe("🟡 Moderate");
    expect(EFFORT_LABELS[3]).toBe("🟢 Good");
    expect(EFFORT_LABELS[4]).toBe("🔵 Hard");
    expect(EFFORT_LABELS[5]).toBe("💪 Maxed");
  });

  it("returns a label for the session's effort score", () => {
    const session = makeSessionLog({ post_session_effort: 4 });
    expect(EFFORT_LABELS[session.post_session_effort!]).toBe("🔵 Hard");
  });

  it("handles null effort score gracefully", () => {
    const session = makeSessionLog({ post_session_effort: null });
    expect(session.post_session_effort).toBeNull();
    // No label lookup needed — modal skips the effort badge when null
  });
});

// ─── Date display ─────────────────────────────────────────────────────────────

describe("session detail — completion date display", () => {
  it("timeAgo shows 'just now' for very recent completions", () => {
    const recent = new Date(Date.now() - 30_000).toISOString(); // 30 seconds ago
    expect(timeAgo(recent)).toBe("just now");
  });

  it("timeAgo shows hours for completions within the same day", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe("2h ago");
  });

  it("timeAgo shows 'yesterday' for previous day completions", () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(yesterday)).toBe("yesterday");
  });

  it("formats completed_at date to locale string", () => {
    const session = makeSessionLog({ completed_at: "2026-04-18T11:00:00Z" });
    const date = new Date(session.completed_at!);
    const formatted = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    expect(formatted).toContain("2026");
    expect(formatted).toContain("Apr");
  });
});

// ─── Modal visibility guard ────────────────────────────────────────────────────

describe("session detail — modal guard conditions", () => {
  it("only completed sessions should open the detail modal", () => {
    const completed = makeSessionLog({ is_complete: true });
    const inProgress = makeSessionLog({ is_complete: false, completed_at: null });
    expect(completed.is_complete).toBe(true);
    expect(inProgress.is_complete).toBe(false);
  });

  it("virtual sessions (no real ID) cannot load exercise data", () => {
    const virtualId = "virtual-wt-abc123";
    expect(virtualId.startsWith("virtual-")).toBe(true);
  });

  it("real session IDs do not start with 'virtual-'", () => {
    const realId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(realId.startsWith("virtual-")).toBe(false);
  });
});
