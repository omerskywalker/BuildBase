import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Check, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Link } from "wouter";

interface CoachNote {
  id: string; message: string; is_sent: boolean; sent_at: string;
  read_at: string | null; dismissed_at: string | null;
  profiles: { full_name: string | null; email: string } | null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

function NoteCard({ note }: { note: CoachNote }) {
  const coachName = note.profiles?.full_name || "Your Coach";
  const isUnread = !note.read_at;
  const wasDismissed = !!note.dismissed_at;
  return (
    <Card className={isUnread && !wasDismissed ? "border-l-4" : ""} style={{ backgroundColor: isUnread && !wasDismissed ? "#FFF8F3" : "#E8DECE", borderLeftColor: isUnread && !wasDismissed ? "#C84B1A" : undefined }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isUnread && !wasDismissed ? "#C84B1A" : "#B5A68C" }}>
            <MessageSquare className="w-4 h-4" style={{ color: "#FEFCF8" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2C1A10" }}>{coachName}</h3>
              <div className="flex items-center gap-3">
                {note.read_at && <div className="flex items-center gap-1"><Eye className="w-3 h-3" style={{ color: "#6B5A48" }} /><span style={{ fontSize: 11, color: "#6B5A48", fontWeight: 500 }}>Read</span></div>}
                {wasDismissed && <div className="flex items-center gap-1"><Check className="w-3 h-3" style={{ color: "#2D7A3A" }} /><span style={{ fontSize: 11, color: "#2D7A3A", fontWeight: 500 }}>Dismissed</span></div>}
                <span style={{ fontSize: 12, color: "#988A78" }}>{formatRelative(note.sent_at)}</span>
              </div>
            </div>
            <p style={{ color: isUnread && !wasDismissed ? "#2C1A10" : "#6B5A48", fontSize: 14, lineHeight: 1.5, fontWeight: isUnread && !wasDismissed ? 500 : 400 }}>{note.message}</p>
            <div className="mt-3 pt-2" style={{ borderTop: "1px solid #C8B99D" }}>
              <p style={{ fontSize: 12, color: "#988A78", fontStyle: "italic" }}>
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

export default function CoachNotesPage() {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/coach/notes").then(r => r.json()).then(setNotes).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!profile?.coach_id) {
    return (
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-display)", marginBottom: 16 }}>Coach's Notes</h1>
        <Card style={{ backgroundColor: "#E8DECE" }}>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: "#988A78" }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#2C1A10", marginBottom: 8 }}>No Coach Assigned</h2>
            <p style={{ color: "#6B5A48", fontSize: 14 }}>You don't currently have a coach assigned to your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-display)", marginBottom: 16 }}>Coach's Notes</h1>
      {loading && <div className="text-center py-8" style={{ color: "#6B5A48" }}>Loading messages...</div>}
      {!loading && notes.length === 0 && (
        <Card style={{ backgroundColor: "#E8DECE" }}>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" style={{ color: "#988A78" }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#2C1A10", marginBottom: 8 }}>No Messages Yet</h2>
            <p style={{ color: "#6B5A48", fontSize: 14 }}>Your coach hasn't sent you any messages yet.</p>
          </CardContent>
        </Card>
      )}
      {!loading && notes.length > 0 && (
        <div className="space-y-4">
          <p style={{ color: "#6B5A48", fontSize: 14, marginBottom: 20 }}>All messages from your coach, newest first. Unread messages are highlighted with an orange border.</p>
          {notes.map(note => <NoteCard key={note.id} note={note} />)}
        </div>
      )}
    </div>
  );
}
