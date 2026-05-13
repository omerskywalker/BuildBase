import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/sessions/[sessionLogId]/sets — log a completed set
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionLogId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionLogId } = await params;

  // Verify session belongs to user
  const { data: sessionLog } = await supabase
    .from("session_logs")
    .select("id")
    .eq("id", sessionLogId)
    .eq("user_id", user.id)
    .single();

  if (!sessionLog) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const body = await request.json() as {
    template_exercise_id: string;
    exercise_id: string;
    set_number: number;
    weight_used: number | null;
    reps_completed: number | null;
  };

  const { data, error } = await supabase
    .from("set_logs")
    .insert({
      session_log_id: sessionLogId,
      template_exercise_id: body.template_exercise_id,
      exercise_id: body.exercise_id,
      set_number: body.set_number,
      weight_used: body.weight_used,
      reps_completed: body.reps_completed,
      is_completed: true,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
