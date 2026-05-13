import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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

    // Fetch all programs with their phases
    const { data: programs, error } = await supabase
      .from("programs")
      .select(`
        *,
        phases(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching programs:", error);
      return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
    }

    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error in GET /api/admin/programs:", error);
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
    const { id, name, description, total_phases, total_weeks } = body;

    if (!id) {
      return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
    }

    // Update program
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (total_phases !== undefined) updateData.total_phases = total_phases;
    if (total_weeks !== undefined) updateData.total_weeks = total_weeks;

    const { data, error } = await supabase
      .from("programs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating program:", error);
      return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/admin/programs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}