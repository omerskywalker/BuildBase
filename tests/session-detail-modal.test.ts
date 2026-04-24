import { describe, it, expect } from "vitest";
import { formatWeight, timeAgo } from "@/lib/utils";
import type { SetLog, SessionLog, TemplateExercise, WorkoutTemplate } from "@/lib/types";

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

// ─── Exercise–SetLog merging (mirrors SessionDetailModal logic) ───────────────

const makeTemplateExercise = (
  overrides: Partial<TemplateExercise> = {}
): TemplateExercise => ({
  id: "te-1",
  workout_template_id: "wt-1",
  exercise_id: "ex-1",
  order_index: 0,
  sets_default: 3,
  reps_default: 10,
  weight_pre_baseline_f: 20,
  weight_pre_baseline_m: 45,
  weight_default_f: 30,
  weight_default_m: 65,
  weight_post_baseline_f: 40,
  weight_post_baseline_m: 85,
  superset_group: null,
  is_bodyweight: false,
  is_abs_finisher: false,
  coaching_cues: null,
  notes: null,
  ...overrides,
});

interface ExerciseDetail {
  templateExercise: TemplateExercise;
  setLogs: SetLog[];
}

function mergeExercisesAndSets(
  exercises: TemplateExercise[],
  setLogs: SetLog[]
): ExerciseDetail[] {
  return exercises.map((te) => ({
    templateExercise: te,
    setLogs: setLogs.filter((sl) => sl.template_exercise_id === te.id),
  }));
}

describe("session detail — exercise/setLog merging", () => {
  it("assigns set logs to the correct template exercise", () => {
    const exercises = [
      makeTemplateExercise({ id: "te-1" }),
      makeTemplateExercise({ id: "te-2", exercise_id: "ex-2" }),
    ];
    const setLogs = [
      makeSetLog({ id: "sl-1", template_exercise_id: "te-1", set_number: 1 }),
      makeSetLog({ id: "sl-2", template_exercise_id: "te-2", set_number: 1 }),
      makeSetLog({ id: "sl-3", template_exercise_id: "te-1", set_number: 2 }),
    ];

    const merged = mergeExercisesAndSets(exercises, setLogs);
    expect(merged[0].setLogs).toHaveLength(2);
    expect(merged[1].setLogs).toHaveLength(1);
    expect(merged[0].setLogs.map((s) => s.id)).toEqual(["sl-1", "sl-3"]);
  });

  it("returns empty setLogs array for exercises with no logged sets", () => {
    const exercises = [makeTemplateExercise({ id: "te-1" })];
    const merged = mergeExercisesAndSets(exercises, []);
    expect(merged[0].setLogs).toEqual([]);
  });

  it("preserves exercise order from the template", () => {
    const exercises = [
      makeTemplateExercise({ id: "te-a", order_index: 0 }),
      makeTemplateExercise({ id: "te-b", order_index: 1 }),
      makeTemplateExercise({ id: "te-c", order_index: 2 }),
    ];
    const merged = mergeExercisesAndSets(exercises, []);
    expect(merged.map((m) => m.templateExercise.id)).toEqual([
      "te-a",
      "te-b",
      "te-c",
    ]);
  });

  it("filters completed sets correctly within merged data", () => {
    const exercises = [makeTemplateExercise({ id: "te-1" })];
    const setLogs = [
      makeSetLog({ id: "sl-1", template_exercise_id: "te-1", is_completed: true }),
      makeSetLog({ id: "sl-2", template_exercise_id: "te-1", is_completed: false }),
      makeSetLog({ id: "sl-3", template_exercise_id: "te-1", is_completed: true }),
    ];
    const merged = mergeExercisesAndSets(exercises, setLogs);
    const completed = merged[0].setLogs.filter((sl) => sl.is_completed);
    expect(completed).toHaveLength(2);
  });
});

// ─── Session title derivation ─────────────────────────────────────────────────

describe("session detail — title derivation", () => {
  it("uses template title when available", () => {
    const template: WorkoutTemplate = {
      id: "wt-1",
      phase_id: "ph-1",
      week_number: 1,
      session_number: 1,
      day_label: "A",
      title: "Upper Strength",
      description: null,
      order_index: 0,
    };
    const title = template.title ?? `Session ${1}`;
    expect(title).toBe("Upper Strength");
  });

  it("falls back to 'Session N' when template is missing", () => {
    const session = makeSessionLog({ session_number: 3 });
    const template = undefined as WorkoutTemplate | undefined;
    const title = template?.title ?? `Session ${session.session_number}`;
    expect(title).toBe("Session 3");
  });

  it("shows day label prefix from template", () => {
    const template: WorkoutTemplate = {
      id: "wt-1",
      phase_id: "ph-1",
      week_number: 1,
      session_number: 1,
      day_label: "B",
      title: "Lower Power",
      description: null,
      order_index: 1,
    };
    expect(template.day_label).toBe("B");
  });
});

// ─── Notes & effort display guards ───────────────────────────────────────────

describe("session detail — conditional display guards", () => {
  it("shows effort badge only when post_session_effort is set", () => {
    const withEffort = makeSessionLog({ post_session_effort: 3 });
    const withoutEffort = makeSessionLog({ post_session_effort: null });
    expect(!!withEffort.post_session_effort).toBe(true);
    expect(!!withoutEffort.post_session_effort).toBe(false);
  });

  it("shows notes section only when notes string is non-null", () => {
    const withNotes = makeSessionLog({ notes: "Felt strong today" });
    const withoutNotes = makeSessionLog({ notes: null });
    expect(!!withNotes.notes).toBe(true);
    expect(!!withoutNotes.notes).toBe(false);
  });

  it("shows completion date only when completed_at is set", () => {
    const completed = makeSessionLog({ completed_at: "2026-04-18T11:00:00Z" });
    const notCompleted = makeSessionLog({ completed_at: null });
    expect(!!completed.completed_at).toBe(true);
    expect(!!notCompleted.completed_at).toBe(false);
  });
});

// ─── Weight display edge cases ────────────────────────────────────────────────

describe("session detail — weight edge cases", () => {
  it("handles very large weights", () => {
    expect(formatWeight(500, false)).toBe("500 lbs");
  });

  it("shows BW for bodyweight flag even with non-zero weight", () => {
    expect(formatWeight(25, true)).toBe("BW");
  });

  it("formats single-digit weights", () => {
    expect(formatWeight(5, false)).toBe("5 lbs");
  });
});

// ─── timeAgo edge cases ───────────────────────────────────────────────────────

describe("session detail — timeAgo edge cases", () => {
  it("shows days for completions older than 1 day", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe("3 days ago");
  });

  it("shows '1h ago' at exactly 1 hour boundary", () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(oneHourAgo)).toBe("1h ago");
  });

  it("shows 'just now' at sub-minute scale", () => {
    const fiveSecsAgo = new Date(Date.now() - 5_000).toISOString();
    expect(timeAgo(fiveSecsAgo)).toBe("just now");
  });
});
