import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sessions/history?page=1&limit=20
 *
 * Returns completed session_logs for the authenticated user,
 * ordered by completed_at DESC, with their set_logs joined.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  // Count total completed sessions for pagination metadata
  const { count, error: countError } = await supabase
    .from("session_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_complete", true);

  if (countError) {
    console.error("[sessions/history/GET] count error:", countError);
    return NextResponse.json(
      { error: "Failed to fetch session history" },
      { status: 500 }
    );
  }

  const total = count ?? 0;

  // Fetch paginated completed sessions with workout template info
  const { data: sessions, error: sessionsError } = await supabase
    .from("session_logs")
    .select(
      `
      id,
      workout_template_id,
      week_number,
      session_number,
      started_at,
      completed_at,
      is_complete,
      post_session_effort,
      pre_session_soreness,
      notes,
      workout_templates (
        id,
        day_label,
        title
      )
    `
    )
    .eq("user_id", user.id)
    .eq("is_complete", true)
    .order("completed_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (sessionsError) {
    console.error("[sessions/history/GET] sessions error:", sessionsError);
    return NextResponse.json(
      { error: "Failed to fetch session history" },
      { status: 500 }
    );
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({
      sessions: [],
      total,
      page,
      limit,
    });
  }

  // Fetch set_logs for all returned sessions, joined with exercise names
  const sessionIds = sessions.map((s) => s.id);
  const { data: setLogs, error: setLogsError } = await supabase
    .from("set_logs")
    .select(
      `
      id,
      session_log_id,
      set_number,
      weight_used,
      reps_completed,
      is_completed,
      exercises (
        id,
        name
      )
    `
    )
    .in("session_log_id", sessionIds)
    .eq("is_completed", true)
    .order("set_number", { ascending: true });

  if (setLogsError) {
    console.error("[sessions/history/GET] set_logs error:", setLogsError);
    // Non-fatal — return sessions without set details
  }

  // Group set_logs by session_log_id
  const setLogsBySession: Record<string, NonNullable<typeof setLogs>> = {};
  if (setLogs) {
    for (const log of setLogs) {
      if (!setLogsBySession[log.session_log_id]) {
        setLogsBySession[log.session_log_id] = [];
      }
      setLogsBySession[log.session_log_id].push(log);
    }
  }

  // Combine sessions with their set_logs
  const enrichedSessions = sessions.map((session) => ({
    ...session,
    set_logs: setLogsBySession[session.id] ?? [],
  }));

  return NextResponse.json({
    sessions: enrichedSessions,
    total,
    page,
    limit,
  });
}
