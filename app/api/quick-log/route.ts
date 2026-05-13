import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: QuickLogBody = await req.json();
    const { muscleGroups, exercises, durationMinutes } = body;

    if (!Array.isArray(muscleGroups) || !Array.isArray(exercises)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
      .maybeSingle();

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      week_number: 0,
      session_number: 0,
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
      return NextResponse.json(
        { error: sessionError?.message ?? "Failed to save session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sessionLogId: sessionLog.id, summary });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
