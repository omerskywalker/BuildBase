import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/sessions/[sessionLogId]/complete
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionLogId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionLogId } = await params;

  const { data, error } = await supabase
    .from("session_logs")
    .update({ is_complete: true, completed_at: new Date().toISOString() })
    .eq("id", sessionLogId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
