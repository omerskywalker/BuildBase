import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/sessions/[sessionLogId]/exercises
// Returns template exercises for a session with any already-logged sets
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionLogId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionLogId } = await params;

  // Fetch the session log to get the workout_template_id
  const { data: sessionLog, error: sessionError } = await supabase
    .from("session_logs")
    .select("workout_template_id")
    .eq("id", sessionLogId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !sessionLog) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Fetch template exercises with joined exercise data
  const { data: exercises, error: exercisesError } = await supabase
    .from("template_exercises")
    .select(`
      id,
      workout_template_id,
      exercise_id,
      order_index,
      sets_default,
      reps_default,
      weight_pre_baseline_f,
      weight_pre_baseline_m,
      weight_default_f,
      weight_default_m,
      weight_post_baseline_f,
      weight_post_baseline_m,
      superset_group,
      is_bodyweight,
      is_abs_finisher,
      coaching_cues,
      notes,
      exercise:exercises(id, name, muscle_group, equipment)
    `)
    .eq("workout_template_id", sessionLog.workout_template_id)
    .order("order_index");

  if (exercisesError) {
    return NextResponse.json({ error: exercisesError.message }, { status: 500 });
  }

  // Fetch any set logs already recorded for this session
  const { data: setLogs } = await supabase
    .from("set_logs")
    .select("*")
    .eq("session_log_id", sessionLogId)
    .order("set_number");

  // Get form assessments for these exercises (for the current user only)
  // We need to get the coach_id from the user's profile to query assessments
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("coach_id")
    .eq("id", user.id)
    .single();

  let formAssessments: any[] = [];
  if (userProfile?.coach_id) {
    const exerciseIds = (exercises ?? []).map(ex => ex.exercise_id).filter(Boolean);
    const { data: assessments } = await supabase
      .from("coach_form_assessments")
      .select("exercise_id, status")
      .eq("coach_id", userProfile.coach_id)
      .eq("user_id", user.id)
      .in("exercise_id", exerciseIds);
    
    formAssessments = assessments ?? [];
  }

  // Add form assessment status to exercises
  const exercisesWithAssessments = (exercises ?? []).map(ex => ({
    ...ex,
    form_assessment_status: formAssessments.find(fa => fa.exercise_id === ex.exercise_id)?.status || null
  }));

  return NextResponse.json({ 
    exercises: exercisesWithAssessments, 
    setLogs: setLogs ?? [] 
  });
}
