import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FormAssessmentStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  try {
    // Get current user and verify they're a coach/admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify the client belongs to this coach (if coach role)
    if (profile.role === "coach") {
      const { data: client } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", clientId)
        .eq("coach_id", user.id)
        .single();

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    // Get all exercises that appear in workout templates for this client
    // We'll get exercises from the program the client is enrolled in
    const { data: enrollment } = await supabase
      .from("user_enrollments")
      .select("program_id")
      .eq("user_id", clientId)
      .eq("is_active", true)
      .single();

    if (!enrollment) {
      return NextResponse.json({ exercises: [] });
    }

    // Get unique exercises from this program
    const { data: exercisesData } = await supabase
      .from("template_exercises")
      .select(`
        exercise_id,
        exercises!inner (
          id,
          name,
          muscle_group,
          equipment
        )
      `)
      .in('workout_template_id', 
        supabase
          .from('workout_templates')
          .select('id')
          .in('phase_id',
            supabase
              .from('phases')
              .select('id')
              .eq('program_id', enrollment.program_id)
          )
      );

    if (!exercisesData) {
      return NextResponse.json({ exercises: [] });
    }

    // Get unique exercises (remove duplicates)
    const uniqueExercises = Array.from(
      new Map(exercisesData.map(item => [item.exercise_id, item.exercises])).values()
    );

    // Get existing assessments for these exercises
    const exerciseIds = uniqueExercises.map(ex => ex.id);
    const { data: assessments } = await supabase
      .from("coach_form_assessments")
      .select("*")
      .eq("user_id", clientId)
      .eq("coach_id", user.id)
      .in("exercise_id", exerciseIds);

    // Merge exercises with their assessments
    const exercisesWithAssessments = uniqueExercises.map(exercise => ({
      ...exercise,
      assessment: assessments?.find(a => a.exercise_id === exercise.id) || null
    }));

    // Sort by exercise name
    exercisesWithAssessments.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ exercises: exercisesWithAssessments });

  } catch (error) {
    console.error('Error fetching form assessments:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { clientId, exerciseId, status, privateNotes } = await request.json();

    if (!clientId || !exerciseId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!['needs_cues', 'getting_there', 'locked_in'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get current user and verify they're a coach/admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify the client belongs to this coach (if coach role)
    if (profile.role === "coach") {
      const { data: client } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", clientId)
        .eq("coach_id", user.id)
        .single();

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    // Verify the exercise exists
    const { data: exercise } = await supabase
      .from("exercises")
      .select("id")
      .eq("id", exerciseId)
      .single();

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Upsert the assessment
    const { data: assessment, error: upsertError } = await supabase
      .from("coach_form_assessments")
      .upsert({
        coach_id: user.id,
        user_id: clientId,
        exercise_id: exerciseId,
        status: status as FormAssessmentStatus,
        private_notes: privateNotes || null,
        assessment_date: new Date().toISOString().split('T')[0], // Today's date
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting assessment:', upsertError);
      return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
    }

    return NextResponse.json({ assessment });

  } catch (error) {
    console.error('Error saving form assessment:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}