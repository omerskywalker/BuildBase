import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
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
    const { phaseId, name, subtitle, week_start, week_end, description } = body;

    if (!phaseId) {
      return NextResponse.json({ error: "Phase ID is required" }, { status: 400 });
    }

    // Update phase
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (week_start !== undefined) updateData.week_start = week_start;
    if (week_end !== undefined) updateData.week_end = week_end;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await supabase
      .from("phases")
      .update(updateData)
      .eq("id", phaseId)
      .eq("program_id", programId)
      .select()
      .single();

    if (error) {
      console.error("Error updating phase:", error);
      return NextResponse.json({ error: "Failed to update phase" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/admin/programs/[id]/phases:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}