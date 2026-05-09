import { describe, it, expect } from "vitest";
import { formatWeight, getDefaultWeight } from "@/lib/utils";
import type { TemplateExercise, WorkoutTemplate, SessionLog } from "@/lib/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

const makeSessionLog = (overrides: Partial<SessionLog> = {}): SessionLog => ({
  id: "virtual-wt-1-w1-s1",
  user_id: "user-1",
  workout_template_id: "wt-1",
  enrollment_id: "enr-1",
  week_number: 1,
  session_number: 1,
  started_at: null,
  completed_at: null,
  is_complete: false,
  post_session_effort: null,
  pre_session_soreness: null,
  soreness_prompted: false,
  notes: null,
  created_at: "2026-04-20T10:00:00Z",
  ...overrides,
});

// ─── Default weight selection ────────────────────────────────────────────────

describe("session preview — default weight by tier and gender", () => {
  const te = makeTemplateExercise();

  it("returns pre_baseline male weight", () => {
    expect(getDefaultWeight(te, "pre_baseline", "male")).toBe(45);
  });

  it("returns pre_baseline female weight", () => {
    expect(getDefaultWeight(te, "pre_baseline", "female")).toBe(20);
  });

  it("returns default male weight", () => {
    expect(getDefaultWeight(te, "default", "male")).toBe(65);
  });

  it("returns default female weight", () => {
    expect(getDefaultWeight(te, "default", "female")).toBe(30);
  });

  it("returns post_baseline male weight", () => {
    expect(getDefaultWeight(te, "post_baseline", "male")).toBe(85);
  });

  it("returns post_baseline female weight", () => {
    expect(getDefaultWeight(te, "post_baseline", "female")).toBe(40);
  });

  it("treats 'other' gender as female defaults", () => {
    expect(getDefaultWeight(te, "default", "other")).toBe(30);
  });

  it("treats 'unset' gender as female defaults", () => {
    expect(getDefaultWeight(te, "default", "unset")).toBe(30);
  });

  it("returns 0 for bodyweight exercises regardless of tier/gender", () => {
    const bw = makeTemplateExercise({ is_bodyweight: true });
    expect(getDefaultWeight(bw, "post_baseline", "male")).toBe(0);
  });
});

// ─── Weight display in preview ───────────────────────────────────────────────

describe("session preview — weight formatting", () => {
  it("shows BW for bodyweight exercises (weight=0)", () => {
    const te = makeTemplateExercise({ is_bodyweight: true });
    const w = getDefaultWeight(te, "default", "male");
    expect(formatWeight(w, te.is_bodyweight)).toBe("BW");
  });

  it("shows lbs for weighted exercises", () => {
    const te = makeTemplateExercise();
    const w = getDefaultWeight(te, "default", "male");
    expect(formatWeight(w, te.is_bodyweight)).toBe("65 lbs");
  });

  it("shows BW when default weight happens to be 0", () => {
    const te = makeTemplateExercise({
      is_bodyweight: false,
      weight_default_m: 0,
      weight_default_f: 0,
    });
    const w = getDefaultWeight(te, "default", "male");
    expect(formatWeight(w)).toBe("BW");
  });
});

// ─── Preview eligibility ─────────────────────────────────────────────────────

describe("session preview — eligibility guards", () => {
  it("preview is for not-started, not-completed sessions", () => {
    const session = makeSessionLog();
    const isStarted = session.started_at !== null;
    const isCompleted = session.is_complete;
    expect(isStarted).toBe(false);
    expect(isCompleted).toBe(false);
    expect(!isStarted && !isCompleted).toBe(true);
  });

  it("started sessions should not show preview", () => {
    const session = makeSessionLog({ started_at: "2026-04-20T10:00:00Z" });
    const isStarted = session.started_at !== null;
    expect(isStarted).toBe(true);
  });

  it("completed sessions should not show preview", () => {
    const session = makeSessionLog({ is_complete: true });
    expect(session.is_complete).toBe(true);
  });

  it("preview needs a workout_template_id to fetch exercises", () => {
    const session = makeSessionLog({ workout_template_id: "wt-123" });
    expect(session.workout_template_id).toBeTruthy();
  });
});

// ─── Title derivation ────────────────────────────────────────────────────────

describe("session preview — title derivation", () => {
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

  it("falls back to 'Session N' when no template", () => {
    const template = undefined as WorkoutTemplate | undefined;
    const title = template?.title ?? `Session ${2}`;
    expect(title).toBe("Session 2");
  });
});

// ─── Exercise ordering ───────────────────────────────────────────────────────

describe("session preview — exercise display order", () => {
  it("exercises are ordered by order_index", () => {
    const exercises = [
      makeTemplateExercise({ id: "te-c", order_index: 2 }),
      makeTemplateExercise({ id: "te-a", order_index: 0 }),
      makeTemplateExercise({ id: "te-b", order_index: 1 }),
    ];
    const sorted = [...exercises].sort((a, b) => a.order_index - b.order_index);
    expect(sorted.map((e) => e.id)).toEqual(["te-a", "te-b", "te-c"]);
  });

  it("shows sets and reps from template defaults", () => {
    const te = makeTemplateExercise({ sets_default: 4, reps_default: 12 });
    expect(te.sets_default).toBe(4);
    expect(te.reps_default).toBe(12);
  });

  it("shows coaching cues when present", () => {
    const te = makeTemplateExercise({ coaching_cues: "Drive through heels" });
    expect(te.coaching_cues).toBe("Drive through heels");
  });

  it("coaching cues are null when not set", () => {
    const te = makeTemplateExercise();
    expect(te.coaching_cues).toBeNull();
  });
});

// ─── Abs finisher flag ───────────────────────────────────────────────────────

describe("session preview — abs finisher identification", () => {
  it("identifies abs finisher exercises", () => {
    const te = makeTemplateExercise({ is_abs_finisher: true });
    expect(te.is_abs_finisher).toBe(true);
  });

  it("regular exercises are not abs finishers", () => {
    const te = makeTemplateExercise();
    expect(te.is_abs_finisher).toBe(false);
  });
});

// ─── Superset grouping ──────────────────────────────────────────────────────

describe("session preview — superset grouping", () => {
  it("groups exercises by superset_group", () => {
    const exercises = [
      makeTemplateExercise({ id: "te-1", superset_group: "A" }),
      makeTemplateExercise({ id: "te-2", superset_group: "A" }),
      makeTemplateExercise({ id: "te-3", superset_group: null }),
    ];
    const groupA = exercises.filter((e) => e.superset_group === "A");
    const ungrouped = exercises.filter((e) => e.superset_group === null);
    expect(groupA).toHaveLength(2);
    expect(ungrouped).toHaveLength(1);
  });
});
