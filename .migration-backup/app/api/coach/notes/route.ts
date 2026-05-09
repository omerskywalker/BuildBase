import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/coach/notes - Send a new note
export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and user ID are required" },
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
      .select("role, id")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only coaches and admins can send notes" },
        { status: 403 }
      );
    }

    // Verify target user exists and (for coaches) is their client
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, coach_id")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If user is coach (not admin), verify this is their client
    if (profile.role === "coach" && targetUser.coach_id !== user.id) {
      return NextResponse.json(
        { error: "You can only send notes to your clients" },
        { status: 403 }
      );
    }

    // Create the note
    const { data: note, error } = await supabase
      .from("coach_notes")
      .insert({
        coach_id: user.id,
        user_id: userId,
        message: message.trim(),
        is_sent: true,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating note:", error);
      return NextResponse.json(
        { error: "Failed to create note" },
        { status: 500 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error in POST /api/coach/notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/coach/notes - Get notes (for coach: sent by them, for user: sent to them)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // Optional - if provided, get notes for specific user

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    let query = supabase
      .from("coach_notes")
      .select(`
        id,
        coach_id,
        user_id,
        message,
        is_sent,
        sent_at,
        read_at,
        dismissed_at,
        created_at,
        profiles!coach_notes_coach_id_fkey(full_name, email),
        profiles!coach_notes_user_id_fkey(full_name, email)
      `);

    if (profile.role === "coach") {
      // Coach sees notes they sent
      if (userId) {
        query = query.eq("coach_id", user.id).eq("user_id", userId);
      } else {
        query = query.eq("coach_id", user.id);
      }
    } else if (profile.role === "user") {
      // User sees notes sent to them
      query = query.eq("user_id", user.id);
    } else if (profile.role === "admin") {
      // Admin sees all notes, optionally filtered by user
      if (userId) {
        query = query.eq("user_id", userId);
      }
    }

    const { data: notes, error } = await query
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      return NextResponse.json(
        { error: "Failed to fetch notes" },
        { status: 500 }
      );
    }

    return NextResponse.json(notes || []);
  } catch (error) {
    console.error("Error in GET /api/coach/notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}