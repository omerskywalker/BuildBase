import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("session_logs")
    .select(
      `
      id,
      week_number,
      session_number,
      started_at,
      completed_at,
      is_complete,
      post_session_effort,
      pre_session_soreness,
      notes,
      workout_templates (
        day_label,
        title
      )
    `
    )
    .eq("user_id", user.id)
    .eq("is_complete", true)
    .order("completed_at", { ascending: false });

  if (sessionsError) {
    console.error("[sessions/export/GET] sessions error:", sessionsError);
    return NextResponse.json(
      { error: "Failed to export session data" },
      { status: 500 }
    );
  }

  if (!sessions || sessions.length === 0) {
    return new Response("No completed sessions to export", { status: 404 });
  }

  const sessionIds = sessions.map((s) => s.id);

  const { data: setLogs } = await supabase
    .from("set_logs")
    .select(
      `
      session_log_id,
      set_number,
      weight_used,
      reps_completed,
      exercises (
        name
      )
    `
    )
    .in("session_log_id", sessionIds)
    .eq("is_completed", true)
    .order("set_number", { ascending: true });

  const setLogsBySession: Record<string, NonNullable<typeof setLogs>> = {};
  if (setLogs) {
    for (const log of setLogs) {
      if (!setLogsBySession[log.session_log_id]) {
        setLogsBySession[log.session_log_id] = [];
      }
      setLogsBySession[log.session_log_id]!.push(log);
    }
  }

  const rows: string[] = [
    "Date,Week,Session,Day,Title,Exercise,Set,Weight (lbs),Reps,Effort,Soreness,Notes",
  ];

  for (const session of sessions) {
    const date = session.completed_at
      ? new Date(session.completed_at).toLocaleDateString("en-US")
      : "";
    const templateRaw = session.workout_templates as unknown;
    const template = (Array.isArray(templateRaw) ? templateRaw[0] : templateRaw) as { day_label: string; title: string } | null;
    const dayLabel = template?.day_label ?? "";
    const title = template?.title ?? "";
    const effort = session.post_session_effort ?? "";
    const soreness = session.pre_session_soreness ?? "";
    const notes = (session.notes ?? "").replace(/"/g, '""');

    const sets = setLogsBySession[session.id];
    if (sets && sets.length > 0) {
      for (const set of sets) {
        const exerciseRaw = set.exercises as unknown;
        const exercise = (Array.isArray(exerciseRaw) ? exerciseRaw[0] : exerciseRaw) as { name: string } | null;
        const exerciseName = exercise?.name ?? "Unknown";
        rows.push(
          `"${date}",${session.week_number},${session.session_number},"${dayLabel}","${title}","${exerciseName}",${set.set_number},${set.weight_used ?? ""},${set.reps_completed ?? ""},${effort},${soreness},"${notes}"`
        );
      }
    } else {
      rows.push(
        `"${date}",${session.week_number},${session.session_number},"${dayLabel}","${title}",,,,${effort},${soreness},"${notes}"`
      );
    }
  }

  const csv = rows.join("\n");
  const filename = `buildbase-workouts-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
