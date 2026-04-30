import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/coach/notes/[id] - Unsend a note (only if unread)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the note and verify permissions
    const { data: note } = await supabase
      .from("coach_notes")
      .select("id, coach_id, user_id, read_at")
      .eq("id", id)
      .single();

    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    // Only the sender can unsend the note
    if (note.coach_id !== user.id) {
      return NextResponse.json(
        { error: "You can only unsend your own notes" },
        { status: 403 }
      );
    }

    // Can't unsend if already read
    if (note.read_at) {
      return NextResponse.json(
        { error: "Cannot unsend note that has been read" },
        { status: 400 }
      );
    }

    // Delete the note
    const { error } = await supabase
      .from("coach_notes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting note:", error);
      return NextResponse.json(
        { error: "Failed to unsend note" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Note unsent successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/coach/notes/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/coach/notes/[id] - Mark note as read or dismissed
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (!action || !["read", "dismiss"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'read' or 'dismiss'" },
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

    // Get the note and verify permissions
    const { data: note } = await supabase
      .from("coach_notes")
      .select("id, coach_id, user_id, read_at")
      .eq("id", id)
      .single();

    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    // Only the recipient can mark as read/dismissed
    if (note.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only mark your own notes as read or dismissed" },
        { status: 403 }
      );
    }

    // Update the note
    const updateData: any = {};
    const now = new Date().toISOString();
    
    if (action === "read") {
      updateData.read_at = now;
    } else if (action === "dismiss") {
      updateData.dismissed_at = now;
      // Mark as read when dismissing if not already read
      if (!note.read_at) {
        updateData.read_at = now;
      }
    }

    const { data: updatedNote, error } = await supabase
      .from("coach_notes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error marking note as ${action}:`, error);
      return NextResponse.json(
        { error: `Failed to mark note as ${action}` },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error in PATCH /api/coach/notes/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}