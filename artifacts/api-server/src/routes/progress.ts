import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthUser } from "../lib/supabase";

const router = Router();

interface PhaseRow {
  id: string;
  phase_number: number;
  name: string;
  subtitle: string | null;
  week_start: number;
  week_end: number;
  description: string | null;
}

interface TemplateRow {
  id: string;
  week_number: number;
  session_number: number;
  phase_id: string;
}

async function resolveUserId(
  requestedId: string,
  callerId: string,
  callerRole: string,
  supabase: SupabaseClient
): Promise<string | null> {
  if (requestedId === callerId) return requestedId;
  if (callerRole === "admin") return requestedId;
  if (callerRole === "coach") {
    const { data: client } = await supabase
      .from("profiles")
      .select("coach_id")
      .eq("id", requestedId)
      .single();
    return client?.coach_id === callerId ? requestedId : null;
  }
  return null;
}

// GET /api/progress — overall phase progress for the authenticated user
router.get("/", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { data: enrollment } = await supabase
      .from("user_enrollments")
      .select("id, program_id, current_week, current_session")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!enrollment) return res.json(null);

    const { data: phases } = await supabase
      .from("phases")
      .select("id, phase_number, name, subtitle, week_start, week_end, description")
      .eq("program_id", enrollment.program_id)
      .order("phase_number");

    const allPhases: PhaseRow[] = (phases ?? []) as PhaseRow[];

    const { data: templates } = await supabase
      .from("workout_templates")
      .select("id, week_number, session_number, phase_id")
      .in("phase_id", allPhases.map(p => p.id));

    const allTemplates: TemplateRow[] = (templates ?? []) as TemplateRow[];

    const { data: sessionLogs } = await supabase
      .from("session_logs")
      .select("week_number, session_number, is_complete, completed_at, post_session_effort, pre_session_soreness")
      .eq("user_id", user.id)
      .eq("enrollment_id", enrollment.id);

    const logs = sessionLogs ?? [];

    const completedSet = new Set(
      logs.filter((l: { is_complete: boolean }) => l.is_complete)
          .map((l: { week_number: number; session_number: number }) => `${l.week_number}-${l.session_number}`)
    );

    let overallCompleted = 0;
    let currentPhase = 1;

    const phasesData = allPhases.map(phase => {
      const phaseTemplates = allTemplates.filter(t => t.phase_id === phase.id);
      const completedInPhase = phaseTemplates.filter(
        t => completedSet.has(`${t.week_number}-${t.session_number}`)
      ).length;

      overallCompleted += completedInPhase;

      if (completedInPhase > 0 && completedInPhase < phaseTemplates.length) {
        currentPhase = phase.phase_number;
      } else if (completedInPhase === phaseTemplates.length && phaseTemplates.length > 0) {
        currentPhase = Math.min(phase.phase_number + 1, allPhases.length);
      }

      const sessions = phaseTemplates
        .sort((a, b) => a.week_number - b.week_number || a.session_number - b.session_number)
        .map(t => ({
          id: t.id,
          session_number: t.session_number,
          isComplete: completedSet.has(`${t.week_number}-${t.session_number}`),
          isCurrent:
            !completedSet.has(`${t.week_number}-${t.session_number}`) &&
            t.week_number === enrollment.current_week &&
            t.session_number === enrollment.current_session,
        }));

      return {
        id: phase.id,
        phase_number: phase.phase_number,
        name: phase.name,
        subtitle: phase.subtitle,
        week_start: phase.week_start,
        week_end: phase.week_end,
        description: phase.description,
        totalSessions: phaseTemplates.length,
        completedSessions: completedInPhase,
        sessions,
      };
    });

    return res.json({
      phases: phasesData,
      overallCompleted,
      overallTotal: allTemplates.length,
      currentPhase,
      sessionLogs: logs,
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/progress/milestones
router.get("/milestones", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { data: sessionLogs } = await supabase
      .from("session_logs")
      .select("is_complete, completed_at")
      .eq("user_id", user.id);

    const logs = sessionLogs ?? [];
    const totalSessions = logs.length;
    const completedSessions = logs.filter((l: { is_complete: boolean }) => l.is_complete).length;

    const completionRate =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    const completedDates = logs
      .filter((l: { is_complete: boolean; completed_at: string | null }) => l.is_complete && l.completed_at)
      .map((l: { completed_at: string }) => new Date(l.completed_at).toDateString());

    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (completedDates.includes(d.toDateString())) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    const { data: personalRecords } = await supabase
      .from("personal_records")
      .select("id, exercise_id, weight, reps, achieved_at, exercise:exercises(name)")
      .eq("user_id", user.id)
      .order("achieved_at", { ascending: false });

    const { data: milestones } = await supabase
      .from("milestones")
      .select("id, milestone_key, achieved_at, notes, set_by")
      .eq("user_id", user.id)
      .order("achieved_at", { ascending: false });

    return res.json({
      currentStreak,
      completionRate,
      totalSessions,
      completedSessions,
      personalRecords: personalRecords ?? [],
      milestones: milestones ?? [],
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/progress/trends
router.get("/trends", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { data: sessionLogs } = await supabase
      .from("session_logs")
      .select("week_number, session_number, post_session_effort, pre_session_soreness, completed_at")
      .eq("user_id", user.id)
      .eq("is_complete", true)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: true });

    const data = (sessionLogs ?? []).map((l: {
      week_number: number;
      session_number: number;
      completed_at: string;
      post_session_effort: number | null;
      pre_session_soreness: number | null;
    }) => ({
      label: `W${l.week_number}S${l.session_number}`,
      date: new Date(l.completed_at).toLocaleDateString(),
      ...(l.post_session_effort != null ? { effort: l.post_session_effort } : {}),
      ...(l.pre_session_soreness != null ? { soreness: l.pre_session_soreness } : {}),
    }));

    return res.json({ data });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/progress/exercises
router.get("/exercises", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const requestedUserId = (req.query.userId as string) || user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const callerRole = (profile?.role as string) ?? "user";

    if (requestedUserId !== user.id) {
      const resolved = await resolveUserId(requestedUserId, user.id, callerRole, supabase);
      if (!resolved) return res.status(403).json({ error: "Access denied" });
    }

    const { data: setLogs, error } = await supabase
      .from("set_logs")
      .select("exercise_id, exercises!inner(id, name, muscle_group)")
      .eq("session_logs.user_id", requestedUserId)
      .eq("is_completed", true)
      .not("weight_used", "is", null);

    if (error) {
      // Fallback: query set_logs joined through session_logs for the specific user
      const { data: userSessionLogs } = await supabase
        .from("session_logs")
        .select("id")
        .eq("user_id", requestedUserId);

      const sessionLogIds = (userSessionLogs ?? []).map((s: { id: string }) => s.id);
      if (sessionLogIds.length === 0) return res.json({ exercises: [] });

      const { data: setLogsAlt } = await supabase
        .from("set_logs")
        .select("exercise_id")
        .in("session_log_id", sessionLogIds)
        .eq("is_completed", true)
        .not("weight_used", "is", null);

      const exerciseIds = [...new Set((setLogsAlt ?? []).map((s: { exercise_id: string }) => s.exercise_id))];
      if (exerciseIds.length === 0) return res.json({ exercises: [] });

      const { data: exercises } = await supabase
        .from("exercises")
        .select("id, name, muscle_group")
        .in("id", exerciseIds)
        .eq("is_active", true)
        .order("name");

      return res.json({ exercises: exercises ?? [] });
    }

    const seen = new Set<string>();
    const uniqueExercises: { id: string; name: string; muscle_group: string | null }[] = [];
    for (const row of setLogs ?? []) {
      const exArr = row.exercises;
      const ex = Array.isArray(exArr) ? exArr[0] : exArr;
      if (ex && !seen.has(ex.id as string)) {
        seen.add(ex.id as string);
        uniqueExercises.push({ id: ex.id as string, name: ex.name as string, muscle_group: ex.muscle_group as string | null });
      }
    }
    uniqueExercises.sort((a, b) => a.name.localeCompare(b.name));

    return res.json({ exercises: uniqueExercises });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/progress/charts
router.get("/charts", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const exerciseId = req.query.exerciseId as string;
    const requestedUserId = (req.query.userId as string) || user.id;

    if (!exerciseId) return res.status(400).json({ error: "Exercise ID is required" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const callerRole = (profile?.role as string) ?? "user";

    if (requestedUserId !== user.id) {
      const resolved = await resolveUserId(requestedUserId, user.id, callerRole, supabase);
      if (!resolved) return res.status(403).json({ error: "Access denied" });
    }

    const { data: chartData, error } = await supabase
      .from("set_logs")
      .select("weight_used, logged_at, session_logs!inner(week_number, workout_templates!inner(title, day_label))")
      .eq("exercise_id", exerciseId)
      .eq("session_logs.user_id", requestedUserId)
      .eq("is_completed", true)
      .not("weight_used", "is", null)
      .order("logged_at", { ascending: true });

    if (error) return res.status(500).json({ error: "Failed to fetch chart data" });

    const transformedData = (chartData ?? []).map((record: {
      weight_used: number;
      logged_at: string;
      session_logs: { week_number: number; workout_templates: { title: string; day_label: string } | { title: string; day_label: string }[] } | { week_number: number; workout_templates: { title: string; day_label: string } | { title: string; day_label: string }[] }[];
    }) => {
      const sl = Array.isArray(record.session_logs) ? record.session_logs[0] : record.session_logs;
      const wt = sl ? (Array.isArray(sl.workout_templates) ? sl.workout_templates[0] : sl.workout_templates) : null;
      return {
        date: new Date(record.logged_at).toLocaleDateString(),
        weight: record.weight_used,
        sessionName: sl && wt ? `Week ${sl.week_number} - ${wt.title}` : `Week ? - Session`,
      };
    });

    return res.json({ data: transformedData });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
