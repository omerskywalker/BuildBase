import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Exercise } from "@/lib/types";

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
    const search = searchParams.get("search");
    const muscleGroup = searchParams.get("muscle_group");
    const isActive = searchParams.get("is_active");

    let query = supabase
      .from("exercises")
      .select("*")
      .order("name", { ascending: true });

    // Apply filters
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    
    if (muscleGroup && muscleGroup !== "all") {
      query = query.eq("muscle_group", muscleGroup);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data: exercises, error } = await query;

    if (error) {
      console.error("Error fetching exercises:", error);
      return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 });
    }

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Error in GET /api/admin/exercises:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      name, 
      muscle_group, 
      equipment, 
      instructions, 
      coaching_cues, 
      video_url,
      is_active = true 
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Exercise name is required" }, { status: 400 });
    }

    // Check if exercise with same name already exists
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", name.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Exercise with this name already exists" }, { status: 400 });
    }

    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert({
        name: name.trim(),
        muscle_group: muscle_group?.trim() || null,
        equipment: equipment?.trim() || null,
        instructions: instructions?.trim() || null,
        coaching_cues: coaching_cues?.trim() || null,
        video_url: video_url?.trim() || null,
        created_by: user.id,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating exercise:", error);
      return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
    }

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/exercises:", error);
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
      name, 
      muscle_group, 
      equipment, 
      instructions, 
      coaching_cues, 
      video_url, 
      is_active 
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Exercise ID is required" }, { status: 400 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Exercise name is required" }, { status: 400 });
    }

    // Check if another exercise with same name already exists (excluding current one)
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", name.trim())
      .neq("id", id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Another exercise with this name already exists" }, { status: 400 });
    }

    const updateData: Partial<Exercise> = {
      name: name.trim(),
      muscle_group: muscle_group?.trim() || null,
      equipment: equipment?.trim() || null,
      instructions: instructions?.trim() || null,
      coaching_cues: coaching_cues?.trim() || null,
      video_url: video_url?.trim() || null,
    };

    if (typeof is_active === "boolean") {
      updateData.is_active = is_active;
    }

    const { data: exercise, error } = await supabase
      .from("exercises")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating exercise:", error);
      return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 });
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error("Error in PUT /api/admin/exercises:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Exercise ID is required" }, { status: 400 });
    }

    // Check if exercise is used in any template exercises
    const { data: usageCount, error: countError } = await supabase
      .from("template_exercises")
      .select("id", { count: "exact" })
      .eq("exercise_id", id);

    if (countError) {
      console.error("Error checking exercise usage:", countError);
      return NextResponse.json({ error: "Failed to check exercise usage" }, { status: 500 });
    }

    if (usageCount && usageCount.length > 0) {
      // Soft delete - just mark as inactive instead of hard delete
      const { error } = await supabase
        .from("exercises")
        .update({ is_active: false })
        .eq("id", id);

      if (error) {
        console.error("Error deactivating exercise:", error);
        return NextResponse.json({ error: "Failed to deactivate exercise" }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Exercise deactivated (still used in templates)" 
      });
    } else {
      // Hard delete if not used
      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting exercise:", error);
        return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Exercise deleted" });
    }
  } catch (error) {
    console.error("Error in DELETE /api/admin/exercises:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}