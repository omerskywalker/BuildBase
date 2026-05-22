import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { enrollUserSchema } from "@/lib/validations/admin";

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
    const parsed = enrollUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { userId, programId } = parsed.data;

    // Fetch the user's profile to get template_tier and gender
    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("template_tier, gender")
      .eq("id", userId)
      .single();

    if (profileError || !targetProfile) {
      console.error("Error fetching target profile:", profileError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Deactivate any current active enrollment for the user
    const { error: deactivateError } = await supabase
      .from("user_enrollments")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (deactivateError) {
      console.error("Error deactivating enrollments:", deactivateError);
      return NextResponse.json({ error: "Failed to deactivate current enrollment" }, { status: 500 });
    }

    // Create new enrollment
    const { data: enrollment, error: insertError } = await supabase
      .from("user_enrollments")
      .insert({
        user_id: userId,
        program_id: programId,
        is_active: true,
        template_tier: targetProfile.template_tier,
        gender_applied: targetProfile.gender === "unset" ? "other" : targetProfile.gender,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating enrollment:", insertError);
      return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error in POST /api/admin/enroll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
