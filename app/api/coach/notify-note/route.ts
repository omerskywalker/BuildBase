import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[notify-note] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "BuildBase <notifications@buildbase.io>",
    to,
    subject,
    html,
  });
}

// POST /api/coach/notify-note - Send email notification for a new coach note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noteId, userId, coachId, content } = body;

    if (!noteId || !userId || !coachId || !content) {
      return NextResponse.json(
        { error: "noteId, userId, coachId, and content are required" },
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

    // Rate limiting: skip if the same coach sent a note to the same user in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentNotes } = await supabase
      .from("coach_notes")
      .select("id")
      .eq("coach_id", coachId)
      .eq("user_id", userId)
      .gte("sent_at", oneHourAgo)
      .neq("id", noteId);

    if (recentNotes && recentNotes.length > 0) {
      return NextResponse.json(
        { message: "Rate limited: recent note already sent within the last hour" },
        { status: 200 }
      );
    }

    // Look up user's email from profiles
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Look up coach's name from profiles
    const { data: coachProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", coachId)
      .single();

    const coachName = coachProfile?.full_name || "Your Coach";
    const athleteName = userProfile.full_name || "there";

    const subject = `New note from ${coachName} - BuildBase`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1C3A2A;">New Coach Note</h2>
        <p>Hey ${athleteName},</p>
        <p><strong>${coachName}</strong> left you a note:</p>
        <blockquote style="border-left: 3px solid #C84B1A; padding-left: 12px; margin: 16px 0; color: #2C1A10;">
          ${content}
        </blockquote>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://buildbase.io"}/coach-notes"
             style="background: #C84B1A; color: #FEFCF8; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
            View in BuildBase
          </a>
        </p>
        <p style="color: #988A78; font-size: 12px; margin-top: 24px;">
          You received this because your coach sent you a note on BuildBase.
        </p>
      </div>
    `;

    await sendEmail(userProfile.email, subject, html);

    return NextResponse.json({ success: true, message: "Notification sent" });
  } catch (error) {
    console.error("Error in POST /api/coach/notify-note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
