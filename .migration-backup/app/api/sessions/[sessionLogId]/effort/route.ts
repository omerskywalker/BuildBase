import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/sessions/[sessionLogId]/effort
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionLogId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionLogId } = await params;
  const body = await request.json() as { score: number };
  const score = body.score;

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return NextResponse.json({ error: "Score must be 1–5" }, { status: 400 });
  }

  const { error } = await supabase
    .from("session_logs")
    .update({ post_session_effort: score })
    .eq("id", sessionLogId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
