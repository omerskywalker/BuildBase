import { Router } from "express";
import { getAuthUser } from "../lib/supabase";

const router = Router();

interface QuickSet {
  reps: number;
  weight: number;
  completed: boolean;
}

interface QuickExerciseLog {
  name: string;
  muscleGroup: string;
  sets: QuickSet[];
}

interface QuickLogBody {
  muscleGroups: string[];
  exercises: QuickExerciseLog[];
  durationMinutes?: number;
}

// POST /api/quick-log
router.post("/", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const { muscleGroups, exercises, durationMinutes } = req.body as QuickLogBody;

    if (!Array.isArray(muscleGroups) || !Array.isArray(exercises)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const now = new Date().toISOString();

    const summary = {
      muscle_groups: muscleGroups,
      exercises: exercises.map(ex => ({
        name: ex.name,
        muscle_group: ex.muscleGroup,
        sets: ex.sets.filter(s => s.completed).length,
        total_sets: ex.sets.length,
      })),
      duration_minutes: durationMinutes ?? null,
    };

    const { data: enrollment } = await supabase
      .from("user_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      is_complete: true,
      started_at: now,
      completed_at: now,
      notes: JSON.stringify(summary),
      soreness_prompted: false,
    };

    if (enrollment) {
      insertPayload.enrollment_id = enrollment.id;
    }

    const { data: sessionLog, error: sessionError } = await supabase
      .from("session_logs")
      .insert(insertPayload)
      .select()
      .single();

    if (sessionError || !sessionLog) {
      return res.status(500).json({ error: sessionError?.message ?? "Failed to save session" });
    }

    return res.json({
      success: true,
      sessionLogId: sessionLog.id,
      summary,
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
