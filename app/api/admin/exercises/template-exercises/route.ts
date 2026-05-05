import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { TemplateExercise } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exercise_id");
    const workoutTemplateId = searchParams.get("workout_template_id");

    let query = supabase
      .from("template_exercises")
      .select(`
        *,
        exercise:exercise_id(
          id,
          name,
          muscle_group,
          equipment,
          instructions,
          coaching_cues,
          is_active
        ),
        workout_template:workout_template_id(
          id,
          title,
          week_number,
          session_number,
          day_label,
          phase_id,
          phase:phase_id(
            id,
            name,
            phase_number,
            program_id,
            program:program_id(
              id,
              name
            )
          )
        )
      `)
      .order("order_index", { ascending: true });

    if (exerciseId) {
      query = query.eq("exercise_id", exerciseId);
    }

    if (workoutTemplateId) {
      query = query.eq("workout_template_id", workoutTemplateId);
    }

    const { data: templateExercises, error } = await query;

    if (error) {
      console.error("Error fetching template exercises:", error);
      return NextResponse.json({ error: "Failed to fetch template exercises" }, { status: 500 });
    }

    return NextResponse.json(templateExercises);
  } catch (error) {
    console.error("Error in GET /api/admin/exercises/template-exercises:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      id, 
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
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Template exercise ID is required" }, { status: 400 });
    }

    // Create program version snapshot before making changes
    // First, get the program ID for this template exercise
    const { data: templateExerciseData, error: fetchError } = await supabase
      .from("template_exercises")
      .select(`
        workout_template_id,
        workout_template:workout_template_id(
          phase_id,
          phase:phase_id(
            program_id
          )
        )
      `)
      .eq("id", id)
      .single();

    if (fetchError || !templateExerciseData) {
      console.error("Error fetching template exercise:", fetchError);
      return NextResponse.json({ error: "Template exercise not found" }, { status: 404 });
    }

    const wt = Array.isArray(templateExerciseData.workout_template)
      ? templateExerciseData.workout_template[0]
      : templateExerciseData.workout_template;
    const ph = wt?.phase
      ? (Array.isArray(wt.phase) ? wt.phase[0] : wt.phase)
      : null;
    const programId = ph?.program_id;
    
    if (programId) {
      // Create program version snapshot
      await createProgramSnapshot(supabase, programId, user.id);
    }

    const updateData: Partial<TemplateExercise> = {};

    if (typeof sets_default === "number") updateData.sets_default = sets_default;
    if (typeof reps_default === "number") updateData.reps_default = reps_default;
    if (typeof weight_pre_baseline_f === "number") updateData.weight_pre_baseline_f = weight_pre_baseline_f;
    if (typeof weight_pre_baseline_m === "number") updateData.weight_pre_baseline_m = weight_pre_baseline_m;
    if (typeof weight_default_f === "number") updateData.weight_default_f = weight_default_f;
    if (typeof weight_default_m === "number") updateData.weight_default_m = weight_default_m;
    if (typeof weight_post_baseline_f === "number") updateData.weight_post_baseline_f = weight_post_baseline_f;
    if (typeof weight_post_baseline_m === "number") updateData.weight_post_baseline_m = weight_post_baseline_m;
    if (superset_group !== undefined) updateData.superset_group = superset_group?.trim() || null;
    if (typeof is_bodyweight === "boolean") updateData.is_bodyweight = is_bodyweight;
    if (typeof is_abs_finisher === "boolean") updateData.is_abs_finisher = is_abs_finisher;
    if (coaching_cues !== undefined) updateData.coaching_cues = coaching_cues?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const { data: templateExercise, error } = await supabase
      .from("template_exercises")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        exercise:exercise_id(
          id,
          name,
          muscle_group,
          equipment,
          instructions,
          coaching_cues,
          is_active
        )
      `)
      .single();

    if (error) {
      console.error("Error updating template exercise:", error);
      return NextResponse.json({ error: "Failed to update template exercise" }, { status: 500 });
    }

    return NextResponse.json(templateExercise);
  } catch (error) {
    console.error("Error in PUT /api/admin/exercises/template-exercises:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to create a program version snapshot
async function createProgramSnapshot(supabase: any, programId: string, createdBy: string) {
  try {
    // First, get the current program data
    const { data: program } = await supabase
      .from("programs")
      .select("*")
      .eq("id", programId)
      .single();

    if (!program) return;

    // Increment version number and create snapshot
    const nextVersion = program.version + 1;
    
    // Update the current program version
    await supabase
      .from("programs")
      .update({ version: nextVersion })
      .eq("id", programId);

    // Note: In a full implementation, we might want to create a separate
    // `program_versions` table to store complete snapshots of the program
    // structure including all phases, templates, and exercises at the time
    // of the version. For now, we're just incrementing the version number.
  } catch (error) {
    console.error("Error creating program snapshot:", error);
    // Don't fail the main operation if versioning fails
  }
}