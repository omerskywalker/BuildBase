import { Router } from "express";
import { getAuthUser } from "../lib/supabase";

const router = Router();

// GET /api/templates/:workoutTemplateId/exercises
router.get("/:workoutTemplateId/exercises", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { supabase } = auth;

    const { data: exercises, error } = await supabase
      .from("template_exercises")
      .select(`
        id, workout_template_id, exercise_id, order_index, sets_default, reps_default,
        weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m,
        weight_post_baseline_f, weight_post_baseline_m, superset_group, is_bodyweight,
        is_abs_finisher, coaching_cues, notes,
        exercise:exercises(id, name, muscle_group, equipment)
      `)
      .eq("workout_template_id", req.params.workoutTemplateId)
      .order("order_index");

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ exercises: exercises ?? [] });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
