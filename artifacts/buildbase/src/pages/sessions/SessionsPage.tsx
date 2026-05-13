import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import SessionCard from "./SessionCard";
import type { SessionLog, WorkoutTemplate } from "@/lib/types";

interface SessionWithTemplate extends SessionLog { template?: WorkoutTemplate; }

export default function SessionsPage() {
  const { profile } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [sessions, setSessions] = useState<SessionWithTemplate[]>([]);
  const [totalWeeks, setTotalWeeks] = useState(12);
  const [lastCompletedAt, setLastCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = parseInt(params.get("week") || "1", 10);
    setCurrentWeek(isNaN(w) ? 1 : w);
  }, []);

  useEffect(() => {
    if (!profile) return;
    setLoading(true); setError(null);
    apiFetch(`/api/sessions?week=${currentWeek}`)
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions ?? []);
        setTotalWeeks(data.totalWeeks ?? 12);
        setLastCompletedAt(data.lastCompletedAt ?? null);
      })
      .catch(() => setError("Failed to load sessions"))
      .finally(() => setLoading(false));
  }, [currentWeek, profile]);

  const firstIncompleteIndex = sessions.findIndex(s => !s.is_complete);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display mb-1" style={{ color: "#2C1A10" }}>Sessions</h1>
          <p className="text-sm" style={{ color: "#6B5A48" }}>Week {currentWeek} · Track your workouts and progress</p>
        </div>
      </div>

      {loading && <div className="text-center py-8 text-content-secondary">Loading sessions...</div>}
      {error && <div className="text-center py-8 text-error">{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          {sessions.length === 0 && (
            <div className="text-center py-12 rounded-lg border border-border-subtle" style={{ background: "#E8DECE" }}>
              <p style={{ color: "#6B5A48" }}>No sessions found for Week {currentWeek}.</p>
            </div>
          )}
          {sessions.map((session, index) => (
            <SessionCard
              key={session.id}
              session={session}
              autoExpanded={!session.is_complete && (firstIncompleteIndex === -1 || index === firstIncompleteIndex)}
              userTier={profile?.template_tier ?? "default"}
              userGender={profile?.gender ?? "unset"}
              lastCompletedAt={lastCompletedAt}
            />
          ))}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => { const w = Math.max(1, currentWeek - 1); setCurrentWeek(w); window.history.pushState(null, "", `/sessions?week=${w}`); }}
              disabled={currentWeek <= 1}
              className="text-sm px-3 py-2 rounded-md transition-colors text-content-secondary hover:text-content-primary hover:bg-bg-hover disabled:text-content-muted disabled:cursor-not-allowed"
            >
              ← Previous Week
            </button>
            <span className="text-sm text-content-secondary">Week {currentWeek} of {totalWeeks}</span>
            <button
              type="button"
              onClick={() => { const w = Math.min(totalWeeks, currentWeek + 1); setCurrentWeek(w); window.history.pushState(null, "", `/sessions?week=${w}`); }}
              disabled={currentWeek >= totalWeeks}
              className="text-sm px-3 py-2 rounded-md transition-colors text-content-secondary hover:text-content-primary hover:bg-bg-hover disabled:text-content-muted disabled:cursor-not-allowed"
            >
              Next Week →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
