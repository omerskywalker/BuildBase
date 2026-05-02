import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, gender, role, coach_id, template_tier } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const validRoles = ["user", "coach", "admin"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const validGenders = ["male", "female", "other", "unset"];
    if (gender && !validGenders.includes(gender)) {
      return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
    }

    const validTiers = ["pre_baseline", "default", "post_baseline"];
    if (template_tier && !validTiers.includes(template_tier)) {
      return NextResponse.json({ error: "Invalid template tier" }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: full_name || null,
        gender: gender || "unset",
        role: role || "user",
        coach_id: coach_id || null,
        template_tier: template_tier || "default",
        onboarding_done: true,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    const { data: createdProfile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    return NextResponse.json(
      { user: createdProfile || { id: authData.user.id, email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/users/create:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
