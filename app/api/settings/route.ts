import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/settings — returns current user's profile
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, gender, template_tier, coach_id")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    console.error("[settings/GET]", error);
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

// PATCH /api/settings — updates allowed fields (full_name, gender)
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Only allow updating full_name and gender
  const updates: Record<string, unknown> = {};

  if (typeof body.full_name === "string") {
    const trimmed = body.full_name.trim();
    if (trimmed.length === 0) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    if (trimmed.length > 100) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }
    updates.full_name = trimmed;
  }

  if (body.gender !== undefined) {
    const validGenders = ["male", "female", "other", "unset"];
    if (!validGenders.includes(body.gender)) {
      return NextResponse.json({ error: "Invalid gender value" }, { status: 400 });
    }
    updates.gender = body.gender;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id, full_name, email, role, gender, template_tier, coach_id")
    .single();

  if (error) {
    console.error("[settings/PATCH]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json(profile);
}
