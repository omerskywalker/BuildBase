import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Fetch program with phases
    const { data: program, error } = await supabase
      .from("programs")
      .select(`
        *,
        phases(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Program not found" }, { status: 404 });
      }
      console.error("Error fetching program:", error);
      return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
    }

    // Sort phases by phase_number
    if (program.phases) {
      program.phases.sort((a: any, b: any) => a.phase_number - b.phase_number);
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("Error in GET /api/admin/programs/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}