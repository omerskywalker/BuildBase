import { z } from "zod";

// ─── Shared helpers ──────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid();
const optionalUuid = z.string().uuid().nullish();

/** Text field with a sensible max length. */
const shortText = (max = 200) => z.string().max(max);
const longText = (max = 2000) => z.string().max(max);

/** Non-negative weight value (lbs/kg). */
const weight = z.number().min(0).max(9999);

// ─── User creation (POST /api/admin/users/create) ───────────────────────────

export const createUserSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(6).max(128),
  full_name: shortText(200).nullish(),
  gender: z.enum(["male", "female", "other", "unset"]).optional(),
  role: z.enum(["user", "coach", "admin"]).optional(),
  coach_id: optionalUuid,
  template_tier: z.enum(["pre_baseline", "default", "post_baseline"]).optional(),
});

// ─── User update (PUT /api/admin/users) ─────────────────────────────────────

export const updateUserSchema = z.object({
  id: uuidSchema,
  role: z.enum(["user", "coach", "admin"]).optional(),
  coach_id: z.string().uuid().nullable().optional(),
  template_tier: z.enum(["pre_baseline", "default", "post_baseline"]).optional(),
  full_name: shortText(200).optional(),
  gender: z.enum(["male", "female", "other", "unset"]).optional(),
});

// ─── User delete (DELETE /api/admin/users) ──────────────────────────────────

export const deleteUserSchema = z.object({
  id: uuidSchema,
});

// ─── Exercise creation (POST /api/admin/exercises) ──────────────────────────

export const createExerciseSchema = z.object({
  name: shortText(200).min(1),
  muscle_group: shortText(100).nullish(),
  equipment: shortText(100).nullish(),
  instructions: longText(2000).nullish(),
  coaching_cues: longText(2000).nullish(),
  video_url: z.string().url().max(2000).nullish(),
  is_active: z.boolean().optional(),
});

// ─── Exercise update (PUT /api/admin/exercises) ─────────────────────────────

export const updateExerciseSchema = z.object({
  id: uuidSchema,
  name: shortText(200).min(1),
  muscle_group: shortText(100).nullish(),
  equipment: shortText(100).nullish(),
  instructions: longText(2000).nullish(),
  coaching_cues: longText(2000).nullish(),
  video_url: z.string().url().max(2000).nullish(),
  is_active: z.boolean().optional(),
});

// ─── Exercise delete (DELETE /api/admin/exercises) ──────────────────────────

export const deleteExerciseSchema = z.object({
  id: uuidSchema,
});

// ─── Template exercise update (PUT /api/admin/exercises/template-exercises) ─

export const updateTemplateExerciseSchema = z.object({
  id: uuidSchema,
  sets_default: z.number().int().min(1).max(99).optional(),
  reps_default: z.number().int().min(1).max(999).optional(),
  weight_pre_baseline_f: weight.optional(),
  weight_pre_baseline_m: weight.optional(),
  weight_default_f: weight.optional(),
  weight_default_m: weight.optional(),
  weight_post_baseline_f: weight.optional(),
  weight_post_baseline_m: weight.optional(),
  superset_group: shortText(50).nullish(),
  is_bodyweight: z.boolean().optional(),
  is_abs_finisher: z.boolean().optional(),
  coaching_cues: longText(2000).nullish(),
  notes: longText(2000).nullish(),
});

// ─── Program update (PUT /api/admin/programs) ───────────────────────────────

export const updateProgramSchema = z.object({
  id: uuidSchema,
  name: shortText(200).optional(),
  description: longText(2000).nullish(),
  total_phases: z.number().int().min(1).max(52).optional(),
  total_weeks: z.number().int().min(1).max(52).optional(),
});

// ─── Phase update (PUT /api/admin/programs/[programId]/phases) ──────────────

export const updatePhaseSchema = z.object({
  phaseId: uuidSchema,
  name: shortText(200).optional(),
  subtitle: shortText(200).nullish(),
  week_start: z.number().int().min(1).max(52).optional(),
  week_end: z.number().int().min(1).max(52).optional(),
  description: longText(2000).nullish(),
});

// ─── Session editor: add exercise (POST) ────────────────────────────────────

export const addSessionExerciseSchema = z.object({
  sessionId: uuidSchema,
  exerciseId: uuidSchema,
  orderIndex: z.number().int().min(0).max(999),
});

// ─── Session editor: update exercise (PATCH) ────────────────────────────────

export const patchTemplateExerciseSchema = z.object({
  sets_default: z.number().int().min(1).max(99).optional(),
  reps_default: z.number().int().min(1).max(999).optional(),
  weight_pre_baseline_f: weight.optional(),
  weight_pre_baseline_m: weight.optional(),
  weight_default_f: weight.optional(),
  weight_default_m: weight.optional(),
  weight_post_baseline_f: weight.optional(),
  weight_post_baseline_m: weight.optional(),
  superset_group: shortText(50).nullish(),
  is_bodyweight: z.boolean().optional(),
  is_abs_finisher: z.boolean().optional(),
  coaching_cues: longText(2000).nullish(),
  notes: longText(2000).nullish(),
  order_index: z.number().int().min(0).max(999).optional(),
});

// ─── Session editor: reorder exercises (POST) ───────────────────────────────

export const reorderExercisesSchema = z.object({
  sessionId: uuidSchema,
  exercises: z.array(
    z.object({
      id: uuidSchema,
      order_index: z.number().int().min(0).max(999),
    })
  ).min(1).max(200),
});

// ─── Overrides: create/update (POST /api/admin/overrides) ───────────────────

export const upsertOverrideSchema = z.object({
  user_id: uuidSchema,
  template_exercise_id: uuidSchema,
  sets_override: z.number().int().min(1).max(99).nullish(),
  reps_override: z.number().int().min(1).max(999).nullish(),
  weight_override: weight.nullish(),
  notes: longText(2000).nullish(),
});

// ─── Overrides: delete (DELETE /api/admin/overrides) ────────────────────────

export const deleteOverrideSchema = z.object({
  id: uuidSchema,
});
