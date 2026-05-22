import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  createExerciseSchema,
  updateExerciseSchema,
  deleteExerciseSchema,
  updateTemplateExerciseSchema,
  updateProgramSchema,
  updatePhaseSchema,
  addSessionExerciseSchema,
  patchTemplateExerciseSchema,
  reorderExercisesSchema,
  upsertOverrideSchema,
  deleteOverrideSchema,
} from "@/lib/validations/admin";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

// ─── createUserSchema ────────────────────────────────────────────────────────

describe("createUserSchema", () => {
  const validInput = {
    email: "user@example.com",
    password: "securePass123",
    full_name: "Test User",
    gender: "male" as const,
    role: "user" as const,
    template_tier: "default" as const,
  };

  it("accepts valid input", () => {
    const result = createUserSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts minimal input (email + password only)", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = createUserSchema.safeParse({ ...validInput, email: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = createUserSchema.safeParse({ ...validInput, password: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = createUserSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 6 characters", () => {
    const result = createUserSchema.safeParse({ ...validInput, password: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects password longer than 128 characters", () => {
    const result = createUserSchema.safeParse({ ...validInput, password: "x".repeat(129) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = createUserSchema.safeParse({ ...validInput, role: "superadmin" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid gender", () => {
    const result = createUserSchema.safeParse({ ...validInput, gender: "unknown" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid template_tier", () => {
    const result = createUserSchema.safeParse({ ...validInput, template_tier: "ultra" });
    expect(result.success).toBe(false);
  });

  it("rejects full_name exceeding 200 characters", () => {
    const result = createUserSchema.safeParse({ ...validInput, full_name: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID coach_id", () => {
    const result = createUserSchema.safeParse({ ...validInput, coach_id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("accepts valid UUID coach_id", () => {
    const result = createUserSchema.safeParse({ ...validInput, coach_id: VALID_UUID });
    expect(result.success).toBe(true);
  });
});

// ─── updateUserSchema ────────────────────────────────────────────────────────

describe("updateUserSchema", () => {
  it("accepts valid input", () => {
    const result = updateUserSchema.safeParse({
      id: VALID_UUID,
      role: "coach",
      full_name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = updateUserSchema.safeParse({ role: "user" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for id", () => {
    const result = updateUserSchema.safeParse({ id: "bad-id" });
    expect(result.success).toBe(false);
  });
});

// ─── deleteUserSchema ────────────────────────────────────────────────────────

describe("deleteUserSchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteUserSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = deleteUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID id", () => {
    const result = deleteUserSchema.safeParse({ id: "123" });
    expect(result.success).toBe(false);
  });
});

// ─── createExerciseSchema ────────────────────────────────────────────────────

describe("createExerciseSchema", () => {
  const validInput = {
    name: "Bench Press",
    muscle_group: "Chest",
    equipment: "Barbell",
    instructions: "Lie flat on a bench and press the barbell upward.",
    coaching_cues: "Keep your feet flat on the floor.",
    video_url: "https://example.com/video.mp4",
  };

  it("accepts valid input", () => {
    const result = createExerciseSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts minimal input (name only)", () => {
    const result = createExerciseSchema.safeParse({ name: "Squat" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createExerciseSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name, ...rest } = validInput;
    const result = createExerciseSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 200 characters", () => {
    const result = createExerciseSchema.safeParse({ ...validInput, name: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects instructions exceeding 2000 characters", () => {
    const result = createExerciseSchema.safeParse({
      ...validInput,
      instructions: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid video_url format", () => {
    const result = createExerciseSchema.safeParse({
      ...validInput,
      video_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null video_url", () => {
    const result = createExerciseSchema.safeParse({ ...validInput, video_url: null });
    expect(result.success).toBe(true);
  });
});

// ─── updateExerciseSchema ────────────────────────────────────────────────────

describe("updateExerciseSchema", () => {
  it("requires both id and name", () => {
    const result = updateExerciseSchema.safeParse({
      id: VALID_UUID,
      name: "Updated Exercise",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = updateExerciseSchema.safeParse({ name: "Updated Exercise" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = updateExerciseSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(false);
  });
});

// ─── deleteExerciseSchema ────────────────────────────────────────────────────

describe("deleteExerciseSchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteExerciseSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = deleteExerciseSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── updateTemplateExerciseSchema ────────────────────────────────────────────

describe("updateTemplateExerciseSchema", () => {
  it("accepts valid input with all weight fields", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      id: VALID_UUID,
      sets_default: 4,
      reps_default: 10,
      weight_default_f: 45,
      weight_default_m: 95,
      weight_pre_baseline_f: 25,
      weight_pre_baseline_m: 65,
      weight_post_baseline_f: 55,
      weight_post_baseline_m: 115,
    });
    expect(result.success).toBe(true);
  });

  it("rejects sets_default of 0", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      id: VALID_UUID,
      sets_default: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects sets_default over 99", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      id: VALID_UUID,
      sets_default: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects reps_default of 0", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      id: VALID_UUID,
      reps_default: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects reps_default over 999", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      id: VALID_UUID,
      reps_default: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative weight", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      id: VALID_UUID,
      weight_default_f: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects weight over 9999", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      id: VALID_UUID,
      weight_default_m: 10000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer sets_default", () => {
    const result = updateTemplateExerciseSchema.safeParse({
      id: VALID_UUID,
      sets_default: 3.5,
    });
    expect(result.success).toBe(false);
  });
});

// ─── updateProgramSchema ─────────────────────────────────────────────────────

describe("updateProgramSchema", () => {
  it("accepts valid input", () => {
    const result = updateProgramSchema.safeParse({
      id: VALID_UUID,
      name: "12-Week Strength",
      total_phases: 3,
      total_weeks: 12,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = updateProgramSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects total_phases of 0", () => {
    const result = updateProgramSchema.safeParse({
      id: VALID_UUID,
      total_phases: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects total_weeks over 52", () => {
    const result = updateProgramSchema.safeParse({
      id: VALID_UUID,
      total_weeks: 53,
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 2000 characters", () => {
    const result = updateProgramSchema.safeParse({
      id: VALID_UUID,
      description: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// ─── updatePhaseSchema ───────────────────────────────────────────────────────

describe("updatePhaseSchema", () => {
  it("accepts valid input", () => {
    const result = updatePhaseSchema.safeParse({
      phaseId: VALID_UUID,
      name: "Hypertrophy",
      week_start: 1,
      week_end: 4,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing phaseId", () => {
    const result = updatePhaseSchema.safeParse({ name: "Test" });
    expect(result.success).toBe(false);
  });

  it("rejects week_start of 0", () => {
    const result = updatePhaseSchema.safeParse({
      phaseId: VALID_UUID,
      week_start: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects week_end over 52", () => {
    const result = updatePhaseSchema.safeParse({
      phaseId: VALID_UUID,
      week_end: 53,
    });
    expect(result.success).toBe(false);
  });
});

// ─── addSessionExerciseSchema ────────────────────────────────────────────────

describe("addSessionExerciseSchema", () => {
  it("accepts valid input", () => {
    const result = addSessionExerciseSchema.safeParse({
      sessionId: VALID_UUID,
      exerciseId: VALID_UUID,
      orderIndex: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing sessionId", () => {
    const result = addSessionExerciseSchema.safeParse({
      exerciseId: VALID_UUID,
      orderIndex: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative orderIndex", () => {
    const result = addSessionExerciseSchema.safeParse({
      sessionId: VALID_UUID,
      exerciseId: VALID_UUID,
      orderIndex: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects orderIndex over 999", () => {
    const result = addSessionExerciseSchema.safeParse({
      sessionId: VALID_UUID,
      exerciseId: VALID_UUID,
      orderIndex: 1000,
    });
    expect(result.success).toBe(false);
  });
});

// ─── patchTemplateExerciseSchema ─────────────────────────────────────────────

describe("patchTemplateExerciseSchema", () => {
  it("accepts valid partial update", () => {
    const result = patchTemplateExerciseSchema.safeParse({
      sets_default: 5,
      reps_default: 12,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no fields to update)", () => {
    const result = patchTemplateExerciseSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects out-of-range sets_default", () => {
    const result = patchTemplateExerciseSchema.safeParse({ sets_default: 100 });
    expect(result.success).toBe(false);
  });
});

// ─── reorderExercisesSchema ──────────────────────────────────────────────────

describe("reorderExercisesSchema", () => {
  it("accepts valid input", () => {
    const result = reorderExercisesSchema.safeParse({
      sessionId: VALID_UUID,
      exercises: [
        { id: VALID_UUID, order_index: 0 },
        { id: VALID_UUID, order_index: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty exercises array", () => {
    const result = reorderExercisesSchema.safeParse({
      sessionId: VALID_UUID,
      exercises: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing sessionId", () => {
    const result = reorderExercisesSchema.safeParse({
      exercises: [{ id: VALID_UUID, order_index: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

// ─── upsertOverrideSchema ───────────────────────────────────────────────────

describe("upsertOverrideSchema", () => {
  it("accepts valid input", () => {
    const result = upsertOverrideSchema.safeParse({
      user_id: VALID_UUID,
      template_exercise_id: VALID_UUID,
      sets_override: 5,
      reps_override: 10,
      weight_override: 135,
      notes: "Light day — recovering from strain.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing user_id", () => {
    const result = upsertOverrideSchema.safeParse({
      template_exercise_id: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing template_exercise_id", () => {
    const result = upsertOverrideSchema.safeParse({
      user_id: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative weight_override", () => {
    const result = upsertOverrideSchema.safeParse({
      user_id: VALID_UUID,
      template_exercise_id: VALID_UUID,
      weight_override: -10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects sets_override of 0", () => {
    const result = upsertOverrideSchema.safeParse({
      user_id: VALID_UUID,
      template_exercise_id: VALID_UUID,
      sets_override: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts null overrides", () => {
    const result = upsertOverrideSchema.safeParse({
      user_id: VALID_UUID,
      template_exercise_id: VALID_UUID,
      sets_override: null,
      reps_override: null,
      weight_override: null,
    });
    expect(result.success).toBe(true);
  });
});

// ─── deleteOverrideSchema ───────────────────────────────────────────────────

describe("deleteOverrideSchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteOverrideSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    const result = deleteOverrideSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID string", () => {
    const result = deleteOverrideSchema.safeParse({ id: "abc" });
    expect(result.success).toBe(false);
  });
});
