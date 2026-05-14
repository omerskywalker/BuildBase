import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/admin/overrides?user_id=<uuid> - Get all overrides for a user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin or coach role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "coach"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: "user_id parameter is required" }, { status: 400 });
    }

    // Fetch all overrides for the user with joined data
    const { data: overrides, error } = await supabase
      .from("user_exercise_overrides")
      .select(`
        *,
        template_exercise:template_exercise_id(
          *,
          exercise:exercise_id(*)
        ),
        set_by_profile:set_by(id, full_name, email)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching overrides:", error);
      return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
    }

    return NextResponse.json(overrides);
  } catch (error) {
    console.error("Error in GET /api/admin/overrides:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/overrides - Create or update an override
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin or coach role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "coach"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      user_id, 
      template_exercise_id, 
      sets_override, 
      reps_override, 
      weight_override, 
      notes 
    } = body;

    if (!user_id || !template_exercise_id) {
      return NextResponse.json({ 
        error: "user_id and template_exercise_id are required" 
      }, { status: 400 });
    }

    // Check if override already exists
    const { data: existingOverride } = await supabase
      .from("user_exercise_overrides")
      .select("id")
      .eq("user_id", user_id)
      .eq("template_exercise_id", template_exercise_id)
      .single();

    const overrideData = {
      user_id,
      template_exercise_id,
      sets_override: sets_override || null,
      reps_override: reps_override || null,
      weight_override: weight_override || null,
      notes: notes || null,
      set_by: user.id,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingOverride) {
      // Update existing override
      const { data, error } = await supabase
        .from("user_exercise_overrides")
        .update(overrideData)
        .eq("id", existingOverride.id)
        .select(`
          *,
          template_exercise:template_exercise_id(
            *,
            exercise:exercise_id(*)
          ),
          set_by_profile:set_by(id, full_name, email)
        `)
        .single();

      if (error) {
        console.error("Error updating override:", error);
        return NextResponse.json({ error: "Failed to update override" }, { status: 500 });
      }
      result = data;
    } else {
      // Create new override
      const { data, error } = await supabase
        .from("user_exercise_overrides")
        .insert([overrideData])
        .select(`
          *,
          template_exercise:template_exercise_id(
            *,
            exercise:exercise_id(*)
          ),
          set_by_profile:set_by(id, full_name, email)
        `)
        .single();

      if (error) {
        console.error("Error creating override:", error);
        return NextResponse.json({ error: "Failed to create override" }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/admin/overrides:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/overrides - Delete an override
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin or coach role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "coach"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Override ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_exercise_overrides")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting override:", error);
      return NextResponse.json({ error: "Failed to delete override" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/overrides:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}