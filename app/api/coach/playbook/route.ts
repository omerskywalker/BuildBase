import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const playbookEntrySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters"),
  content: z.string().min(1, "Content is required").max(10000, "Content must be under 10000 characters"),
  category: z.string().max(100, "Category must be under 100 characters").nullable().optional(),
});

const playbookUpdateSchema = z.object({
  id: z.string().uuid("Invalid entry ID"),
  title: z.string().min(1, "Title is required").max(200, "Title must be under 200 characters").optional(),
  content: z.string().min(1, "Content is required").max(10000, "Content must be under 10000 characters").optional(),
  category: z.string().max(100, "Category must be under 100 characters").nullable().optional(),
});

// GET /api/coach/playbook - returns all playbook entries
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: entries, error } = await supabase
      .from("playbook_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching playbook entries:", error);
      return NextResponse.json(
        { error: "Failed to fetch playbook entries" },
        { status: 500 }
      );
    }

    return NextResponse.json(entries || []);
  } catch (error) {
    console.error("Error in GET /api/coach/playbook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/coach/playbook - create a new entry (coach/admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = playbookEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is coach/admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only coaches and admins can create playbook entries" },
        { status: 403 }
      );
    }

    const { data: entry, error } = await supabase
      .from("playbook_entries")
      .insert({
        title: parsed.data.title,
        content: parsed.data.content,
        category: parsed.data.category ?? null,
        coach_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating playbook entry:", error);
      return NextResponse.json(
        { error: "Failed to create playbook entry" },
        { status: 500 }
      );
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/coach/playbook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/coach/playbook - update an entry (owner or admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = playbookUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is coach/admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only coaches and admins can update playbook entries" },
        { status: 403 }
      );
    }

    // Fetch the existing entry to verify ownership
    const { data: existing } = await supabase
      .from("playbook_entries")
      .select("coach_id")
      .eq("id", parsed.data.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Playbook entry not found" },
        { status: 404 }
      );
    }

    // Only the owner or an admin can update
    if (existing.coach_id !== user.id && profile.role !== "admin") {
      return NextResponse.json(
        { error: "You can only edit your own playbook entries" },
        { status: 403 }
      );
    }

    const updateData: Record<string, string | null> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category ?? null;

    const { data: entry, error } = await supabase
      .from("playbook_entries")
      .update(updateData)
      .eq("id", parsed.data.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating playbook entry:", error);
      return NextResponse.json(
        { error: "Failed to update playbook entry" },
        { status: 500 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error in PUT /api/coach/playbook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/coach/playbook - delete an entry (owner or admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is coach/admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only coaches and admins can delete playbook entries" },
        { status: 403 }
      );
    }

    // Fetch the existing entry to verify ownership
    const { data: existing } = await supabase
      .from("playbook_entries")
      .select("coach_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Playbook entry not found" },
        { status: 404 }
      );
    }

    // Only the owner or an admin can delete
    if (existing.coach_id !== user.id && profile.role !== "admin") {
      return NextResponse.json(
        { error: "You can only delete your own playbook entries" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("playbook_entries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting playbook entry:", error);
      return NextResponse.json(
        { error: "Failed to delete playbook entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Playbook entry deleted" });
  } catch (error) {
    console.error("Error in DELETE /api/coach/playbook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
