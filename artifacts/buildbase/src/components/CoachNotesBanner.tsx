import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { Link } from "wouter";

interface CoachNote {
  id: string;
  message: string;
  is_sent: boolean;
  sent_at: string;
  read_at: string | null;
  dismissed_at: string | null;
  profiles: { full_name: string | null; email: string } | null;
}

export default function CoachNotesBanner() {
  const [latestNote, setLatestNote] = useState<CoachNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    fetch("/api/coach/notes")
      .then(r => r.json())
      .then((notes: CoachNote[]) => {
        const unread = notes.find(n => !n.read_at && !n.dismissed_at && n.is_sent);
        setLatestNote(unread || null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleDismiss = async () => {
    if (!latestNote || isDismissing) return;
    setIsDismissing(true);
    try {
      await fetch(`/api/coach/notes/${latestNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      setLatestNote(null);
    } catch {}
    finally { setIsDismissing(false); }
  };

  const markAsRead = async () => {
    if (!latestNote || latestNote.read_at) return;
    fetch(`/api/coach/notes/${latestNote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    }).catch(() => {});
  };

  if (isLoading || !latestNote) return null;

  const coachName = latestNote.profiles?.full_name || "Your Coach";

  return (
    <Card className="mb-6 border-l-4" style={{ backgroundColor: "#FFF8F3", borderColor: "#C84B1A", borderLeftColor: "#C84B1A" }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C84B1A" }}>
              <MessageSquare className="w-4 h-4" style={{ color: "#FEFCF8" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2C1A10" }}>New message from {coachName}</h3>
                <span style={{ fontSize: 12, color: "#988A78" }}>
                  {new Date(latestNote.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              <p style={{ color: "#6B5A48", fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>{latestNote.message}</p>
              <Link href="/coach-notes" onClick={markAsRead}>
                <Button variant="outline" size="sm" style={{ backgroundColor: "transparent", borderColor: "#C84B1A", color: "#C84B1A", fontSize: 12, height: 32 }}>
                  View All Messages
                </Button>
              </Link>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} disabled={isDismissing} style={{ color: "#988A78", padding: 4, height: "auto", minWidth: "auto" }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
