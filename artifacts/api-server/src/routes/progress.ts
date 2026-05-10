import { Router } from "express";
import { getAuthUser } from "../lib/supabase";

const router = Router();

// GET /api/progress/exercises
router.get("/exercises", async (req, res) => {
  try {
    const auth = await getAuthUser(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const userId = (req.query.userId as string) || user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, coach_id")
      .eq("id", user.id)
      .single();

    if (userId !== user.id) {
      if (profile?.role === "coach") {
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("coach_id")
          .eq("id", userId)
          .single();
        if (clientProfile?.coach_id !== user.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (profile?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const { data: exercises, error } = await supabase
      .from("exercises")
      .select(`id, name, muscle_group, set_logs!inner(id, session_logs!inner(user_id))`)
      .eq("set_logs.session_logs.user_id", userId)
      .eq("set_logs.is_completed", true)
      .not("set_logs.weight_used", "is", null)
      .eq("is_active", true);

    if (error) return res.status(500).json({ error: "Failed to fetch exercises" });

    const uniqueExercises = (exercises ?? [])
      .reduce((acc: any[], current: any) => {
        if (!acc.find((ex) => ex.id === current.id)) {
          acc.push({ id: current.id, name: current.name, muscle_group: current.muscle_group });
        }
        return acc;
      }, [])
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return res.json({ exercises: uniqueExercises });
  } catch (e) {
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
    const userId = (req.query.userId as string) || user.id;

    if (!exerciseId) return res.status(400).json({ error: "Exercise ID is required" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, coach_id")
      .eq("id", user.id)
      .single();

    if (userId !== user.id) {
      if (profile?.role === "coach") {
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("coach_id")
          .eq("id", userId)
          .single();
        if (clientProfile?.coach_id !== user.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (profile?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const { data: chartData, error } = await supabase
      .from("set_logs")
      .select(`
        weight_used, logged_at, session_log_id,
        session_logs!inner(session_number, week_number, workout_templates!inner(title, day_label))
      `)
      .eq("exercise_id", exerciseId)
      .eq("session_logs.user_id", userId)
      .eq("is_completed", true)
      .not("weight_used", "is", null)
      .order("logged_at", { ascending: true });

    if (error) return res.status(500).json({ error: "Failed to fetch chart data" });

    const transformedData = (chartData ?? [])
      .map((record: any) => ({
        date: new Date(record.logged_at).toLocaleDateString(),
        weight: record.weight_used,
        sessionName: `Week ${record.session_logs.week_number} - ${record.session_logs.workout_templates.title}`,
        rawDate: record.logged_at,
      }))
      .sort((a: any, b: any) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
      .map(({ rawDate, ...rest }: any) => rest);

    return res.json({ data: transformedData });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
