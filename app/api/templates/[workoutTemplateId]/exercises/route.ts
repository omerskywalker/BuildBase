import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workoutTemplateId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workoutTemplateId } = await params;

  const { data: exercises, error } = await supabase
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
    .eq("workout_template_id", workoutTemplateId)
    .order("order_index");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exercises: exercises ?? [] });
}
