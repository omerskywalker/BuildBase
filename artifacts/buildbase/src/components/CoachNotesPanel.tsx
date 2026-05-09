import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, Eye } from "lucide-react";

interface CoachNote {
  id: string;
  message: string;
  is_sent: boolean;
  sent_at: string;
  read_at: string | null;
  dismissed_at: string | null;
}

interface CoachNotesPanelProps {
  clientId: string;
  clientName: string;
}

export default function CoachNotesPanel({ clientId, clientName }: CoachNotesPanelProps) {
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unsendingId, setUnsendingId] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      const r = await fetch(`/api/coach/notes?userId=${clientId}`);
      if (r.ok) setNotes(await r.json());
    } catch {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchNotes(); }, [clientId]);

  const handleUnsend = async (noteId: string) => {
    setUnsendingId(noteId);
    try {
      const r = await fetch(`/api/coach/notes/${noteId}`, { method: "DELETE" });
      if (r.ok) setNotes(notes.filter(n => n.id !== noteId));
    } catch {}
    finally { setUnsendingId(null); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><h3 style={{ fontSize: 18, fontWeight: 600, color: "#2C1A10" }}>Notes Sent to {clientName}</h3></CardHeader>
        <CardContent><div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-gray-300 border-t-[#C84B1A] rounded-full animate-spin" /></div></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#2C1A10" }}>Notes Sent to {clientName}</h3>
        {notes.length > 0 && <p style={{ fontSize: 14, color: "#6B5A48" }}>Recent messages. Unread notes can be unsent.</p>}
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: "#988A78" }} />
            <p style={{ color: "#988A78", fontSize: 14 }}>No notes sent yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map(note => {
              const isUnread = !note.read_at;
              const canUnsend = isUnread && !note.dismissed_at;
              return (
                <div key={note.id} className="p-3 rounded-lg border" style={{ backgroundColor: isUnread ? "#FFF8F3" : "#E8DECE", borderColor: isUnread ? "#C84B1A" : "#C8B99D" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2C1A10" }}>Sent {fmt(note.sent_at)}</span>
                        {note.read_at ? (
                          <div className="flex items-center gap-1"><Eye className="w-3 h-3" style={{ color: "#2D7A3A" }} /><span style={{ fontSize: 11, color: "#2D7A3A", fontWeight: 500 }}>Read</span></div>
                        ) : (
                          <span style={{ fontSize: 11, color: "#C84B1A", fontWeight: 500, backgroundColor: "#FFF8F3", padding: "2px 6px", borderRadius: 3, border: "1px solid #C84B1A" }}>Unread</span>
                        )}
                      </div>
                      <p style={{ fontSize: 14, color: "#2C1A10", lineHeight: 1.4 }}>{note.message}</p>
                    </div>
                    {canUnsend && (
                      <Button variant="ghost" size="sm" onClick={() => handleUnsend(note.id)} disabled={unsendingId === note.id} style={{ color: "#B83020", padding: "4px 8px", height: "auto" }} className="flex items-center gap-1">
                        {unsendingId === note.id ? <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        <span style={{ fontSize: 11 }}>Unsend</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
