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

  return notes || [];
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
      className={`${isUnread && !wasDismissed ? 'border-l-4' : ''}`}
      style={{ 
        backgroundColor: isUnread && !wasDismissed ? "#FFF8F3" : "#E8DECE",
        borderLeftColor: isUnread && !wasDismissed ? "#C84B1A" : undefined
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isUnread && !wasDismissed ? "#C84B1A" : "#B5A68C" }}
          >
            <MessageSquare 
              className="w-4 h-4" 
              style={{ color: "#FEFCF8" }} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: "#2C1A10" 
              }}>
                {coachName}
              </h3>
              
              <div className="flex items-center gap-3">
                {note.read_at && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" style={{ color: "#6B5A48" }} />
                    <span style={{ 
                      fontSize: 11, 
                      color: "#6B5A48",
                      fontWeight: 500
                    }}>
                      Read
                    </span>
                  </div>
                )}
                
                {wasDismissed && (
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3" style={{ color: "#2D7A3A" }} />
                    <span style={{ 
                      fontSize: 11, 
                      color: "#2D7A3A",
                      fontWeight: 500
                    }}>
                      Dismissed
                    </span>
                  </div>
                )}
                
                <span style={{ 
                  fontSize: 12, 
                  color: "#988A78",
                  fontWeight: 500
                }}>
                  {formatRelativeDate(note.sent_at)}
                </span>
              </div>
            </div>
            
            <p style={{ 
              color: isUnread && !wasDismissed ? "#2C1A10" : "#6B5A48", 
              fontSize: 14, 
              lineHeight: 1.5,
              fontWeight: isUnread && !wasDismissed ? 500 : 400
            }}>
              {note.message}
            </p>
            
            <div className="mt-3 pt-2" style={{ borderTop: "1px solid #C8B99D" }}>
              <p style={{ 
                fontSize: 12, 
                color: "#988A78",
                fontStyle: "italic"
              }}>
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
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          color: "#2C1A10", 
          fontFamily: "var(--font-display)", 
          marginBottom: 16 
        }}>
          Coach&apos;s Notes
        </h1>
        
        <Card style={{ backgroundColor: "#E8DECE" }}>
          <CardContent className="p-6 text-center">
            <MessageSquare 
              className="w-12 h-12 mx-auto mb-4" 
              style={{ color: "#988A78" }} 
            />
            <h2 style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              color: "#2C1A10", 
              marginBottom: 8 
            }}>
              No Coach Assigned
            </h2>
            <p style={{ color: "#6B5A48", fontSize: 14 }}>
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
      <h1 style={{ 
        fontSize: 28, 
        fontWeight: 700, 
        color: "#2C1A10", 
        fontFamily: "var(--font-display)", 
        marginBottom: 16 
      }}>
        Coach&apos;s Notes
      </h1>
      
      {notes.length === 0 ? (
        <Card style={{ backgroundColor: "#E8DECE" }}>
          <CardContent className="p-6 text-center">
            <MessageSquare 
              className="w-12 h-12 mx-auto mb-4" 
              style={{ color: "#988A78" }} 
            />
            <h2 style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              color: "#2C1A10", 
              marginBottom: 8 
            }}>
              No Messages Yet
            </h2>
            <p style={{ color: "#6B5A48", fontSize: 14 }}>
              Your coach hasn&apos;t sent you any messages yet. 
              Check back later or continue with your training program.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p style={{ color: "#6B5A48", fontSize: 14, marginBottom: 20 }}>
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
