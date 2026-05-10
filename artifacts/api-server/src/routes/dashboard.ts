import { Router } from "express";
import { getAuthUser } from "../lib/supabase";

const router = Router();

interface WorkoutTemplateRow {
  id: string;
  week_number: number;
  session_number: number;
  day_label: string;
  title: string;
}

// GET /api/dashboard
router.get("/", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { data: enrollment } = await supabase
      .from("user_enrollments")
      .select("id, program_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!enrollment) return res.status(404).json({ error: "No active enrollment" });

    const { data: sessionLogs } = await supabase
      .from("session_logs")
      .select("week_number, session_number, is_complete, completed_at")
      .eq("user_id", user.id)
      .eq("enrollment_id", enrollment.id);

    const logs = sessionLogs ?? [];
    const completedCount = logs.filter(l => l.is_complete).length;

    const { data: phases } = await supabase
      .from("phases")
      .select("id")
      .eq("program_id", enrollment.program_id);

    const phaseIds = (phases ?? []).map(p => p.id);

    const { data: templates } = await supabase
      .from("workout_templates")
      .select("id, week_number, session_number, day_label, title")
      .in("phase_id", phaseIds)
      .order("week_number")
      .order("session_number");

    const allTemplates: WorkoutTemplateRow[] = templates ?? [];
    const totalSessions = allTemplates.length;

    const completedSet = new Set(
      logs.filter(l => l.is_complete).map(l => `${l.week_number}-${l.session_number}`)
    );

    const nextTemplate = allTemplates.find(
      t => !completedSet.has(`${t.week_number}-${t.session_number}`)
    ) ?? null;

    const completedDates = logs
      .filter(l => l.is_complete && l.completed_at)
      .map(l => new Date(l.completed_at as string).toDateString());

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (completedDates.includes(d.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return res.json({
      nextTemplate,
      nextWeek: nextTemplate?.week_number ?? null,
      completedCount,
      totalSessions,
      streak,
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
