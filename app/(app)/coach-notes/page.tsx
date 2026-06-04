import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare, Check, Eye } from "lucide-react";

interface CoachNote {
  id: string;
  coach_id: string;
  user_id: string;
  message: string;
  is_sent: boolean;
  sent_at: string;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

async function getCoachNotes(userId: string): Promise<CoachNote[]> {
  const supabase = await createClient();
  
  const { data: notes, error } = await supabase
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
      profiles!coach_notes_coach_id_fkey(full_name, email)
    `)
    .eq("user_id", userId)
    .order("sent_at", { ascending: false });

  if (error) {
    console.error("Error fetching coach notes:", error);
    return [];
  }

  return (notes ?? []).map((n: any) => ({
    ...n,
    profiles: Array.isArray(n.profiles) ? n.profiles[0] ?? null : n.profiles ?? null,
  }));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short", 
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return "Just now";
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return formatDate(dateString);
  }
}

interface NoteCardProps {
  note: CoachNote;
}

function NoteCard({ note }: NoteCardProps) {
  const coachName = note.profiles?.full_name || "Your Coach";
  const isUnread = !note.read_at;
  const wasDismissed = !!note.dismissed_at;
  
  return (
    <Card
      className={`${isUnread && !wasDismissed ? 'border-l-4 border-l-accent' : ''} ${isUnread && !wasDismissed ? '' : 'bg-bg-elevated'}`}
      style={isUnread && !wasDismissed ? { backgroundColor: "#FFF8F3" } : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUnread && !wasDismissed ? 'bg-accent' : 'bg-border-strong'}`}
          >
            <MessageSquare className="w-4 h-4 text-button-text" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-base font-semibold text-content-primary">
                {coachName}
              </h3>

              <div className="flex items-center gap-3">
                {note.read_at && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-content-secondary" />
                    <span className="text-[11px] text-content-secondary font-medium">
                      Read
                    </span>
                  </div>
                )}

                {wasDismissed && (
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-success" />
                    <span className="text-[11px] text-success font-medium">
                      Dismissed
                    </span>
                  </div>
                )}

                <span className="text-xs text-content-muted font-medium">
                  {formatRelativeDate(note.sent_at)}
                </span>
              </div>
            </div>

            <p className={`text-sm leading-relaxed ${isUnread && !wasDismissed ? 'text-content-primary font-medium' : 'text-content-secondary font-normal'}`}>
              {note.message}
            </p>

            <div className="mt-3 pt-2 border-t border-border-subtle">
              <p className="text-xs text-content-muted italic">
                Sent {formatDate(note.sent_at)}
                {note.read_at && ` • Read ${formatDate(note.read_at)}`}
                {wasDismissed && note.dismissed_at && ` • Dismissed ${formatDate(note.dismissed_at)}`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CoachNotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Verify user has role "user" - only users can view coach notes
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, coach_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "user") {
    redirect("/dashboard");
  }

  if (!profile.coach_id) {
    return (
      <div>
        <h1 className="text-[28px] font-bold text-content-primary font-display mb-4">
          Coach&apos;s Notes
        </h1>

        <Card className="bg-bg-elevated">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-content-muted" />
            <h2 className="text-lg font-semibold text-content-primary mb-2">
              No Coach Assigned
            </h2>
            <p className="text-content-secondary text-sm">
              You don&apos;t currently have a coach assigned to your account.
              Contact support if you need assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const notes = await getCoachNotes(user.id);

  return (
    <div>
      <h1 className="text-[28px] font-bold text-content-primary font-display mb-4">
        Coach&apos;s Notes
      </h1>

      {notes.length === 0 ? (
        <Card className="bg-bg-elevated">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-content-muted" />
            <h2 className="text-lg font-semibold text-content-primary mb-2">
              No Messages Yet
            </h2>
            <p className="text-content-secondary text-sm">
              Your coach hasn&apos;t sent you any messages yet.
              Check back later or continue with your training program.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-content-secondary text-sm mb-5">
            All messages from your coach, newest first.
            Unread messages are highlighted with an orange border.
          </p>
          
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
