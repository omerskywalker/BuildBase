import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/admin/overrides/users?user_id=<uuid> - Get user's current program with exercises
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

    // Get user's current enrollment and program
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("user_enrollments")
      .select(`
        *,
        program:program_id(
          *,
          phases(
            *,
            workout_templates(
              *,
              template_exercises(
                *,
                exercise:exercise_id(*)
              )
            )
          )
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (enrollmentError) {
      console.error("Error fetching user enrollment:", enrollmentError);
      return NextResponse.json({ error: "Failed to fetch user enrollment" }, { status: 500 });
    }

    if (!enrollment) {
      return NextResponse.json({ error: "User is not enrolled in any program" }, { status: 404 });
    }

    // Get user profile information
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("id, full_name, email, gender, template_tier")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user profile:", userError);
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }

    // Get current overrides for this user
    const { data: overrides, error: overrideError } = await supabase
      .from("user_exercise_overrides")
      .select("*")
      .eq("user_id", userId);

    if (overrideError) {
      console.error("Error fetching overrides:", overrideError);
      return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
    }

    // Create a simple object of overrides by template_exercise_id for easy lookup
    const overrideMap: Record<string, any> = {};
    overrides?.forEach(override => {
      overrideMap[override.template_exercise_id] = override;
    });

    return NextResponse.json({
      user: userProfile,
      enrollment,
      overrides: overrideMap,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/overrides/users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}