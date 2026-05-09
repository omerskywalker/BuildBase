import { describe, it, expect } from "vitest";
import { UserExerciseOverride, TemplateExercise, Gender, TemplateTier } from "../../lib/types";
import { getDefaultWeight } from "../../lib/utils";

describe("UserExerciseOverride Type", () => {
  it("should define all required properties", () => {
    const override: UserExerciseOverride = {
      id: "override-1",
      user_id: "user-1",
      template_exercise_id: "template-exercise-1",
      sets_override: 4,
      reps_override: 10,
      weight_override: 25.5,
      notes: "Increased weight due to progress",
      set_by: "admin-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };

    expect(override.id).toBe("override-1");
    expect(override.user_id).toBe("user-1");
    expect(override.template_exercise_id).toBe("template-exercise-1");
    expect(override.sets_override).toBe(4);
    expect(override.reps_override).toBe(10);
    expect(override.weight_override).toBe(25.5);
    expect(override.notes).toBe("Increased weight due to progress");
    expect(override.set_by).toBe("admin-1");
  });

  it("should allow null values for override fields", () => {
    const override: UserExerciseOverride = {
      id: "override-1",
      user_id: "user-1",
      template_exercise_id: "template-exercise-1",
      sets_override: null,
      reps_override: null,
      weight_override: null,
      notes: null,
      set_by: "admin-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };

    expect(override.sets_override).toBeNull();
    expect(override.reps_override).toBeNull();
    expect(override.weight_override).toBeNull();
    expect(override.notes).toBeNull();
  });

  it("should include optional joined data", () => {
    const override: UserExerciseOverride = {
      id: "override-1",
      user_id: "user-1",
      template_exercise_id: "template-exercise-1",
      sets_override: 4,
      reps_override: 10,
      weight_override: 25.5,
      notes: "Test override",
      set_by: "admin-1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
      template_exercise: {
        id: "template-exercise-1",
        workout_template_id: "template-1",
        exercise_id: "exercise-1",
        order_index: 1,
        sets_default: 3,
        reps_default: 8,
        weight_pre_baseline_f: 15,
        weight_pre_baseline_m: 25,
        weight_default_f: 20,
        weight_default_m: 30,
        weight_post_baseline_f: 25,
        weight_post_baseline_m: 35,
        superset_group: null,
        is_bodyweight: false,
        is_abs_finisher: false,
        coaching_cues: null,
        notes: null,
      },
      set_by_profile: {
        id: "admin-1",
        full_name: "Admin User",
        email: "admin@buildbase.com",
      },
    };

    expect(override.template_exercise).toBeDefined();
    expect(override.template_exercise?.sets_default).toBe(3);
    expect(override.set_by_profile).toBeDefined();
    expect(override.set_by_profile?.full_name).toBe("Admin User");
  });
});

describe("Override Integration with getDefaultWeight", () => {
  it("should work with getDefaultWeight utility for male default tier", () => {
    const templateExercise: TemplateExercise = {
      id: "template-exercise-1",
      workout_template_id: "template-1",
      exercise_id: "exercise-1",
      order_index: 1,
      sets_default: 3,
      reps_default: 8,
      weight_pre_baseline_f: 15,
      weight_pre_baseline_m: 25,
      weight_default_f: 20,
      weight_default_m: 30,
      weight_post_baseline_f: 25,
      weight_post_baseline_m: 35,
      superset_group: null,
      is_bodyweight: false,
      is_abs_finisher: false,
      coaching_cues: null,
      notes: null,
    };

    const defaultWeight = getDefaultWeight(
      templateExercise,
      "default" as TemplateTier,
      "male" as Gender
    );

    expect(defaultWeight).toBe(30);
  });

  it("should work with getDefaultWeight utility for female pre_baseline tier", () => {
    const templateExercise: TemplateExercise = {
      id: "template-exercise-1",
      workout_template_id: "template-1",
      exercise_id: "exercise-1",
      order_index: 1,
      sets_default: 3,
      reps_default: 8,
      weight_pre_baseline_f: 15,
      weight_pre_baseline_m: 25,
      weight_default_f: 20,
      weight_default_m: 30,
      weight_post_baseline_f: 25,
      weight_post_baseline_m: 35,
      superset_group: null,
      is_bodyweight: false,
      is_abs_finisher: false,
      coaching_cues: null,
      notes: null,
    };

    const defaultWeight = getDefaultWeight(
      templateExercise,
      "pre_baseline" as TemplateTier,
      "female" as Gender
    );

    expect(defaultWeight).toBe(15);
  });

  it("should return 0 for bodyweight exercises", () => {
    const templateExercise: TemplateExercise = {
      id: "template-exercise-1",
      workout_template_id: "template-1",
      exercise_id: "exercise-1",
      order_index: 1,
      sets_default: 3,
      reps_default: 8,
      weight_pre_baseline_f: 15,
      weight_pre_baseline_m: 25,
      weight_default_f: 20,
      weight_default_m: 30,
      weight_post_baseline_f: 25,
      weight_post_baseline_m: 35,
      superset_group: null,
      is_bodyweight: true, // Bodyweight exercise
      is_abs_finisher: false,
      coaching_cues: null,
      notes: null,
    };

    const defaultWeight = getDefaultWeight(
      templateExercise,
      "default" as TemplateTier,
      "male" as Gender
    );

    expect(defaultWeight).toBe(0);
  });
});