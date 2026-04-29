"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, Eye, X } from "lucide-react";

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
      const response = await fetch(`/api/coach/notes?userId=${clientId}`);
      if (response.ok) {
        const notesData = await response.json();
        setNotes(notesData);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [clientId]);

  const handleUnsend = async (noteId: string) => {
    setUnsendingId(noteId);
    try {
      const response = await fetch(`/api/coach/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the note from the list
        setNotes(notes.filter(note => note.id !== noteId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to unsend note");
      }
    } catch (error) {
      console.error("Error unsending note:", error);
      alert("Failed to unsend note");
    } finally {
      setUnsendingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatRelativeDate = (dateString: string) => {
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
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#2C1A10" }}>
            Notes Sent to {clientName}
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div 
              className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#2C1A10" }}>
          Notes Sent to {clientName}
        </h3>
        {notes.length > 0 && (
          <p style={{ fontSize: 14, color: "#6B5A48" }}>
            Recent messages you&apos;ve sent. Unread notes can be unsent.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare 
              className="w-8 h-8 mx-auto mb-3" 
              style={{ color: "#988A78" }} 
            />
            <p style={{ color: "#988A78", fontSize: 14 }}>
              No notes sent yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const isUnread = !note.read_at;
              const canUnsend = isUnread && !note.dismissed_at;

              return (
                <div
                  key={note.id}
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: isUnread ? "#FFF8F3" : "#E8DECE",
                    borderColor: isUnread ? "#C84B1A" : "#C8B99D",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#2C1A10"
                        }}>
                          Sent {formatRelativeDate(note.sent_at)}
                        </span>
                        
                        {note.read_at ? (
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" style={{ color: "#2D7A3A" }} />
                            <span style={{
                              fontSize: 11,
                              color: "#2D7A3A",
                              fontWeight: 500
                            }}>
                              Read
                            </span>
                          </div>
                        ) : (
                          <span style={{
                            fontSize: 11,
                            color: "#C84B1A",
                            fontWeight: 500,
                            backgroundColor: "#FFF8F3",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            border: "1px solid #C84B1A"
                          }}>
                            Unread
                          </span>
                        )}
                      </div>
                      
                      <p style={{
                        fontSize: 14,
                        color: "#2C1A10",
                        lineHeight: 1.4,
                        marginBottom: 8
                      }}>
                        {note.message}
                      </p>
                      
                      <div style={{ fontSize: 12, color: "#988A78" }}>
                        {formatDate(note.sent_at)}
                        {note.read_at && ` • Read ${formatDate(note.read_at)}`}
                        {note.dismissed_at && ` • Dismissed ${formatDate(note.dismissed_at)}`}
                      </div>
                    </div>
                    
                    {canUnsend && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnsend(note.id)}
                        disabled={unsendingId === note.id}
                        style={{
                          color: "#B83020",
                          padding: "4px 8px",
                          height: "auto",
                        }}
                        className="hover:bg-red-50 flex items-center gap-1"
                        title="Unsend this note (only available while unread)"
                      >
                        {unsendingId === note.id ? (
                          <div 
                            className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
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