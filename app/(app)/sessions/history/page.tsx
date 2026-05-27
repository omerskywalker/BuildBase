import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Dumbbell, Clock } from "lucide-react";
import { EFFORT_LABELS } from "@/lib/constants";

interface SearchParams {
  page?: string;
}

interface SessionHistoryPageProps {
  searchParams: Promise<SearchParams>;
}

interface SetLogEntry {
  id: string;
  session_log_id: string;
  set_number: number;
  weight_used: number | null;
  reps_completed: number | null;
  is_completed: boolean;
  exercises: {
    id: string;
    name: string;
  } | null;
}

interface SessionEntry {
  id: string;
  workout_template_id: string;
  week_number: number;
  session_number: number;
  started_at: string | null;
  completed_at: string | null;
  is_complete: boolean;
  post_session_effort: number | null;
  pre_session_soreness: number | null;
  notes: string | null;
  workout_templates: {
    id: string;
    day_label: string;
    title: string;
  } | null;
  set_logs: SetLogEntry[];
}

interface HistoryResponse {
  sessions: SessionEntry[];
  total: number;
  page: number;
  limit: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Group set logs by exercise, preserving set order */
function groupSetsByExercise(
  setLogs: SetLogEntry[]
): { exerciseName: string; sets: SetLogEntry[] }[] {
  const grouped: Map<string, { exerciseName: string; sets: SetLogEntry[] }> =
    new Map();

  for (const log of setLogs) {
    const name = log.exercises?.name ?? "Unknown Exercise";
    const exerciseId = log.exercises?.id ?? log.id;
    const key = exerciseId;

    if (!grouped.has(key)) {
      grouped.set(key, { exerciseName: name, sets: [] });
    }
    grouped.get(key)!.sets.push(log);
  }

  return Array.from(grouped.values());
}

function SessionCard({ session }: { session: SessionEntry }) {
  const exercises = groupSetsByExercise(session.set_logs);
  const effortLabel = session.post_session_effort
    ? EFFORT_LABELS[session.post_session_effort]
    : null;

  return (
    <div className="bg-bg-elevated rounded-xl border border-border-subtle p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-content-primary font-display">
            {session.workout_templates?.title ?? `Session ${session.session_number}`}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-content-secondary">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {session.completed_at ? formatDate(session.completed_at) : "N/A"}
            </span>
            {session.completed_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(session.completed_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.workout_templates?.day_label && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-bg-hover text-content-secondary">
              Day {session.workout_templates.day_label}
            </span>
          )}
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-bg-hover text-content-secondary">
            Week {session.week_number}
          </span>
        </div>
      </div>

      {/* Effort badge */}
      {effortLabel && (
        <div className="mb-3">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${effortLabel.color}20`,
              color: effortLabel.color,
            }}
          >
            {effortLabel.emoji} Effort: {effortLabel.label}
          </span>
        </div>
      )}

      {/* Exercise breakdown */}
      {exercises.length > 0 ? (
        <div className="space-y-3">
          {exercises.map((group) => (
            <div key={group.exerciseName}>
              <div className="flex items-center gap-1.5 mb-1">
                <Dumbbell className="w-3.5 h-3.5 text-content-muted" />
                <span className="text-sm font-medium text-content-primary">
                  {group.exerciseName}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 ml-5">
                {group.sets.map((set) => (
                  <span
                    key={set.id}
                    className="text-xs px-2 py-1 rounded-md bg-bg-hover text-content-secondary"
                  >
                    {set.weight_used != null ? `${set.weight_used} lbs` : "BW"}{" "}
                    x {set.reps_completed ?? 0}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-content-muted italic">No set data recorded</p>
      )}

      {/* Notes */}
      {session.notes && (
        <p className="mt-3 text-xs text-content-secondary border-t border-border-subtle pt-3">
          {session.notes}
        </p>
      )}
    </div>
  );
}

export default async function SessionHistoryPage({
  searchParams,
}: SessionHistoryPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const limit = 20;

  // Fetch from internal API
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Instead of calling our own API (which would require auth cookies forwarding),
  // query Supabase directly in this server component — same pattern as sessions/page.tsx

  // Count total completed sessions
  const { count, error: countError } = await supabase
    .from("session_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_complete", true);

  const total = count ?? 0;
  const offset = (page - 1) * limit;

  // Fetch paginated sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("session_logs")
    .select(
      `
      id,
      workout_template_id,
      week_number,
      session_number,
      started_at,
      completed_at,
      is_complete,
      post_session_effort,
      pre_session_soreness,
      notes,
      workout_templates (
        id,
        day_label,
        title
      )
    `
    )
    .eq("user_id", user.id)
    .eq("is_complete", true)
    .order("completed_at", { ascending: false })
    .range(offset, offset + limit - 1);

  let setLogs: SetLogEntry[] = [];
  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    const { data: fetchedSetLogs } = await supabase
      .from("set_logs")
      .select(
        `
        id,
        session_log_id,
        set_number,
        weight_used,
        reps_completed,
        is_completed,
        exercises (
          id,
          name
        )
      `
      )
      .in("session_log_id", sessionIds)
      .eq("is_completed", true)
      .order("set_number", { ascending: true });

    setLogs = (fetchedSetLogs as unknown as SetLogEntry[]) ?? [];
  }

  // Group set_logs by session
  const setLogsBySession: Record<string, SetLogEntry[]> = {};
  for (const log of setLogs) {
    if (!setLogsBySession[log.session_log_id]) {
      setLogsBySession[log.session_log_id] = [];
    }
    setLogsBySession[log.session_log_id].push(log);
  }

  const enrichedSessions: SessionEntry[] = (sessions ?? []).map((session) => ({
    ...(session as unknown as SessionEntry),
    set_logs: setLogsBySession[session.id] ?? [],
  }));

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasError = !!countError || !!sessionsError;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/sessions"
              className="text-content-secondary hover:text-content-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-content-primary font-display">
              Session History
            </h1>
          </div>
          <p className="text-sm text-content-secondary ml-7">
            {total} completed {total === 1 ? "session" : "sessions"}
          </p>
        </div>
      </div>

      {/* Error state */}
      {hasError && (
        <div className="text-center py-8">
          <p className="text-content-secondary mb-4">
            Unable to load your session history. Please try again later.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!hasError && enrichedSessions.length === 0 && (
        <div className="text-center py-16">
          <Dumbbell className="w-12 h-12 text-content-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-content-primary mb-2">
            No completed sessions yet
          </h2>
          <p className="text-sm text-content-secondary mb-6">
            Complete your first workout to see it here.
          </p>
          <Link
            href="/sessions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: "#C84B1A", color: "#FEFCF8" }}
          >
            Go to Sessions
          </Link>
        </div>
      )}

      {/* Session list */}
      {!hasError && enrichedSessions.length > 0 && (
        <div className="space-y-4">
          {enrichedSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!hasError && totalPages > 1 && (
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-subtle">
          <Link
            href={`/sessions/history?page=${Math.max(1, page - 1)}`}
            className={`flex items-center gap-1 text-sm px-3 py-2 rounded-md transition-colors ${
              page === 1
                ? "text-content-muted pointer-events-none"
                : "text-content-secondary hover:text-content-primary hover:bg-bg-hover"
            }`}
            aria-disabled={page === 1}
            tabIndex={page === 1 ? -1 : undefined}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Link>

          <span className="text-sm text-content-secondary">
            Page {page} of {totalPages}
          </span>

          <Link
            href={`/sessions/history?page=${Math.min(totalPages, page + 1)}`}
            className={`flex items-center gap-1 text-sm px-3 py-2 rounded-md transition-colors ${
              page === totalPages
                ? "text-content-muted pointer-events-none"
                : "text-content-secondary hover:text-content-primary hover:bg-bg-hover"
            }`}
            aria-disabled={page === totalPages}
            tabIndex={page === totalPages ? -1 : undefined}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
