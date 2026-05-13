import { Router } from "express";
import { getAuthUser } from "../lib/supabase";

const router = Router();

interface SessionBody {
  workout_template_id: string;
  enrollment_id: string;
  week_number: number;
  session_number: number;
}

interface SetBody {
  template_exercise_id: string;
  exercise_id: string;
  set_number: number;
  weight_used: number | null;
  reps_completed: number;
}

interface TemplateExerciseRow {
  id: string;
  exercise_id: string;
  [key: string]: unknown;
}

// GET /api/sessions?week=N
router.get("/", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const week = parseInt(req.query.week as string, 10) || 1;

    const { data: enrollment } = await supabase
      .from("user_enrollments")
      .select("id, program_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!enrollment) return res.json({ sessions: [], totalWeeks: 12, lastCompletedAt: null });

    const { data: phases } = await supabase
      .from("phases")
      .select("id")
      .eq("program_id", enrollment.program_id);

    const phaseIds = (phases ?? []).map((p: { id: string }) => p.id);

    const { data: templates } = await supabase
      .from("workout_templates")
      .select("id, week_number, session_number, day_label, title, phase_id")
      .in("phase_id", phaseIds)
      .eq("week_number", week)
      .order("session_number");

    const weekTemplates = templates ?? [];

    const { data: sessionLogs } = await supabase
      .from("session_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("enrollment_id", enrollment.id)
      .eq("week_number", week);

    const logs = sessionLogs ?? [];

    const { data: allTemplates } = await supabase
      .from("workout_templates")
      .select("week_number")
      .in("phase_id", phaseIds)
      .order("week_number", { ascending: false })
      .limit(1);

    const totalWeeks = allTemplates?.[0]?.week_number ?? 12;

    const { data: lastCompleted } = await supabase
      .from("session_logs")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("enrollment_id", enrollment.id)
      .eq("is_complete", true)
      .order("completed_at", { ascending: false })
      .limit(1);

    const lastCompletedAt = lastCompleted?.[0]?.completed_at ?? null;

    const sessions = weekTemplates.map(template => {
      const log = logs.find(l => l.workout_template_id === template.id);
      if (log) {
        return { ...log, template };
      }
      return {
        id: `virtual-${template.id}`,
        user_id: user.id,
        workout_template_id: template.id,
        enrollment_id: enrollment.id,
        week_number: template.week_number,
        session_number: template.session_number,
        started_at: null,
        completed_at: null,
        is_complete: false,
        post_session_effort: null,
        pre_session_soreness: null,
        soreness_prompted: false,
        notes: null,
        created_at: new Date().toISOString(),
        template,
      };
    });

    return res.json({ sessions, totalWeeks, lastCompletedAt });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions
router.post("/", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { workout_template_id, enrollment_id, week_number, session_number } = req.body as SessionBody;

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
  } catch {
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
  } catch {
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
  } catch {
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

    // Use a SECURITY DEFINER RPC to get form assessment status for this athlete.
    // Direct table access is denied under RLS for athletes; the RPC returns only
    // exercise_ids where status = 'locked_in' — no private notes ever exposed.
    let lockedInExerciseIds = new Set<string>();
    if (userProfile?.coach_id) {
      const exerciseIds = (exercises ?? [])
        .map((ex: TemplateExerciseRow) => ex.exercise_id)
        .filter(Boolean) as string[];
      if (exerciseIds.length > 0) {
        const { data: lockedIn } = await supabase.rpc("get_my_locked_in_exercises", {
          p_exercise_ids: exerciseIds,
        });
        for (const row of lockedIn ?? []) {
          lockedInExerciseIds.add((row as { exercise_id: string }).exercise_id);
        }
      }
    }

    const exercisesWithAssessments = (exercises ?? []).map((ex: TemplateExerciseRow) => ({
      ...ex,
      form_assessment_status: lockedInExerciseIds.has(ex.exercise_id as string) ? "locked_in" : null,
    }));

    return res.json({ exercises: exercisesWithAssessments, setLogs: setLogs ?? [] });
  } catch {
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

    const { template_exercise_id, exercise_id, set_number, weight_used, reps_completed } =
      req.body as SetBody;

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
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:sessionLogId/effort
router.post("/:sessionLogId/effort", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const score = req.body.score as number;
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
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:sessionLogId/soreness
router.post("/:sessionLogId/soreness", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const score = req.body.score as number;
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
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
