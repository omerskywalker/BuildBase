"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { apiFetchJson } from "@/lib/api-helpers";
import { toast } from "sonner";

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

export default function CoachNotesBanner() {
  const [latestNote, setLatestNote] = useState<CoachNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    fetchLatestNote();
  }, []);

  const fetchLatestNote = async () => {
    try {
      const notes = await apiFetchJson<CoachNote[]>("/api/coach/notes");

      // Find the latest unread, undismissed note
      const unreadNote = notes.find(
        (note) => !note.read_at && !note.dismissed_at && note.is_sent
      );

      setLatestNote(unreadNote || null);
    } catch {
      // Silent fail on dashboard banner — non-critical
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!latestNote || isDismissing) return;

    setIsDismissing(true);
    try {
      await apiFetchJson(`/api/coach/notes/${latestNote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "dismiss" }),
      });
      setLatestNote(null);
    } catch {
      toast.error("Failed to dismiss note");
    } finally {
      setIsDismissing(false);
    }
  };

  const markAsRead = async () => {
    if (!latestNote || latestNote.read_at) return;

    try {
      await apiFetchJson(`/api/coach/notes/${latestNote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "read" }),
      });
    } catch {
      // Silent fail — marking as read is not critical
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

  // Don't render if loading or no note to show
  if (isLoading || !latestNote) {
    return null;
  }

  const coachName = latestNote.profiles?.full_name || "Your Coach";

  return (
    <Card
      className="mb-6 border-l-4 border-accent"
      style={{ backgroundColor: "#FFF8F3" }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-accent">
              <MessageSquare className="w-4 h-4 text-button-text" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-base font-semibold text-content-primary">
                  New message from {coachName}
                </h3>
                <span className="text-xs text-content-muted font-medium">
                  {formatDate(latestNote.sent_at)}
                </span>
              </div>

              <p className="text-content-secondary text-sm leading-relaxed mb-3">
                {latestNote.message}
              </p>

              <Link
                href="/coach-notes"
                onClick={markAsRead}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-accent text-accent text-xs h-8 hover:bg-white"
                >
                  View All Messages
                </Button>
              </Link>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isDismissing}
            className="text-content-muted p-1 h-auto min-w-auto hover:bg-transparent flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}