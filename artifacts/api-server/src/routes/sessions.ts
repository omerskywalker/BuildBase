import { Router } from "express";
import { getAuthUser } from "../lib/supabase";

const router = Router();

// POST /api/sessions
router.post("/", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { workout_template_id, enrollment_id, week_number, session_number } = req.body;

    const { data, error } = await supabase
      .from("session_logs")
      .insert({
        user_id: user.id,
        workout_template_id,
        enrollment_id,
        week_number,
        session_number,
        started_at: new Date().toISOString(),
        is_complete: false,
        soreness_prompted: false,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:sessionLogId/start
router.post("/:sessionLogId/start", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { data, error } = await supabase
      .from("session_logs")
      .update({ started_at: new Date().toISOString() })
      .eq("id", req.params.sessionLogId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Session not found" });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:sessionLogId/complete
router.post("/:sessionLogId/complete", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { error } = await supabase
      .from("session_logs")
      .update({ is_complete: true, completed_at: new Date().toISOString() })
      .eq("id", req.params.sessionLogId)
      .eq("user_id", user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/:sessionLogId/exercises
router.get("/:sessionLogId/exercises", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { sessionLogId } = req.params;

    const { data: sessionLog, error: sessionError } = await supabase
      .from("session_logs")
      .select("workout_template_id")
      .eq("id", sessionLogId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !sessionLog) {
      return res.status(404).json({ error: "Session not found" });
    }

    const { data: exercises, error: exercisesError } = await supabase
      .from("template_exercises")
      .select(`
        id, workout_template_id, exercise_id, order_index, sets_default, reps_default,
        weight_pre_baseline_f, weight_pre_baseline_m, weight_default_f, weight_default_m,
        weight_post_baseline_f, weight_post_baseline_m, superset_group, is_bodyweight,
        is_abs_finisher, coaching_cues, notes,
        exercise:exercises(id, name, muscle_group, equipment)
      `)
      .eq("workout_template_id", sessionLog.workout_template_id)
      .order("order_index");

    if (exercisesError) return res.status(500).json({ error: exercisesError.message });

    const { data: setLogs } = await supabase
      .from("set_logs")
      .select("*")
      .eq("session_log_id", sessionLogId)
      .order("set_number");

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("coach_id")
      .eq("id", user.id)
      .single();

    let formAssessments: any[] = [];
    if (userProfile?.coach_id) {
      const exerciseIds = (exercises ?? []).map((ex: any) => ex.exercise_id).filter(Boolean);
      const { data: assessments } = await supabase
        .from("coach_form_assessments")
        .select("exercise_id, status")
        .eq("coach_id", userProfile.coach_id)
        .eq("user_id", user.id)
        .in("exercise_id", exerciseIds);
      formAssessments = assessments ?? [];
    }

    const exercisesWithAssessments = (exercises ?? []).map((ex: any) => ({
      ...ex,
      form_assessment_status: formAssessments.find((fa: any) => fa.exercise_id === ex.exercise_id)?.status || null,
    }));

    return res.json({ exercises: exercisesWithAssessments, setLogs: setLogs ?? [] });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:sessionLogId/sets
router.post("/:sessionLogId/sets", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { sessionLogId } = req.params;
    const { data: sessionLog } = await supabase
      .from("session_logs")
      .select("id")
      .eq("id", sessionLogId)
      .eq("user_id", user.id)
      .single();

    if (!sessionLog) return res.status(404).json({ error: "Session not found" });

    const { template_exercise_id, exercise_id, set_number, weight_used, reps_completed } = req.body;

    const { data, error } = await supabase
      .from("set_logs")
      .insert({
        session_log_id: sessionLogId,
        template_exercise_id,
        exercise_id,
        set_number,
        weight_used,
        reps_completed,
        is_completed: true,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:sessionLogId/effort
router.post("/:sessionLogId/effort", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const score = req.body.score;
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: "Score must be 1–5" });
    }

    const { error } = await supabase
      .from("session_logs")
      .update({ post_session_effort: score })
      .eq("id", req.params.sessionLogId)
      .eq("user_id", user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:sessionLogId/soreness
router.post("/:sessionLogId/soreness", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const score = req.body.score;
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: "Score must be 1–5" });
    }

    const { error } = await supabase
      .from("session_logs")
      .update({ pre_session_soreness: score, soreness_prompted: true })
      .eq("id", req.params.sessionLogId)
      .eq("user_id", user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
