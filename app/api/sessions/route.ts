import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/sessions — create a session_log for a virtual (not-yet-started) session
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    workout_template_id: string;
    enrollment_id: string;
    week_number: number;
    session_number: number;
  };

  const { data, error } = await supabase
    .from("session_logs")
    .insert({
      user_id: user.id,
      workout_template_id: body.workout_template_id,
      enrollment_id: body.enrollment_id,
      week_number: body.week_number,
      session_number: body.session_number,
      started_at: new Date().toISOString(),
      is_complete: false,
      soreness_prompted: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
