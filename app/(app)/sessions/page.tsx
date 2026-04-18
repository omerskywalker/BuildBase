import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SessionCard from "./SessionCard";

interface SearchParams {
  week?: string;
}

interface SessionsPageProps {
  searchParams: Promise<SearchParams>;
}

async function getSessionsData(userId: string, currentWeek: number) {
  const supabase = await createClient();

  // Get user's enrollment to find their current week and program
  const { data: enrollment } = await supabase
    .from("user_enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!enrollment) {
    throw new Error("No active enrollment found");
  }

  // Calculate which sessions to fetch (3 per page)
  const startSession = (currentWeek - 1) * 3 + 1;
  const endSession = currentWeek * 3;

  // Get workout templates for the current week
  const { data: templates } = await supabase
    .from("workout_templates")
    .select(`
      id,
      week_number,
      session_number,
      day_label,
      title,
      description,
      phases!inner(program_id)
    `)
    .eq("phases.program_id", enrollment.program_id)
    .gte("session_number", startSession)
    .lte("session_number", endSession)
    .order("session_number");

  if (!templates) {
    return { sessions: [], totalWeeks: 0, currentWeek, enrollment };
  }

  // Get existing session logs for these templates
  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select("*")
    .eq("user_id", userId)
    .in("workout_template_id", templates.map(t => t.id));

  // Create session objects, merging templates with logs
  const sessions = templates.map(template => {
    const existingLog = sessionLogs?.find(log => log.workout_template_id === template.id);
    
    if (existingLog) {
      return {
        ...existingLog,
        template
      };
    }

    // Create a "virtual" session log for sessions not yet started
    return {
      id: `virtual-${template.id}`,
      user_id: userId,
      workout_template_id: template.id,
      enrollment_id: enrollment.id,
      week_number: template.week_number,
      session_number: template.session_number,
      started_at: null,
      completed_at: null,
      is_complete: false,
      post_session_effort: null,
      pre_session_soreness: null,
      soreness_prompted: false,
      notes: null,
      created_at: new Date().toISOString(),
      template
    };
  });

  // Calculate total weeks (assuming 12-week program with 3 sessions per week)
  const totalWeeks = Math.ceil(36 / 3);

  return {
    sessions,
    totalWeeks,
    currentWeek,
    enrollment
  };
}

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const currentWeek = parseInt(resolvedSearchParams.week || "1", 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary font-display mb-1">
            Sessions
          </h1>
          <p className="text-sm text-content-secondary">
            Week {currentWeek} • Track your workouts and progress
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="text-content-secondary">Loading sessions...</div>}>
        <SessionsList userId={user.id} currentWeek={currentWeek} />
      </Suspense>
    </div>
  );
}

async function SessionsList({ userId, currentWeek }: { userId: string; currentWeek: number }) {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("template_tier, gender")
      .eq("id", userId)
      .single();

    const { sessions, totalWeeks } = await getSessionsData(userId, currentWeek);

    // Find the first incomplete session to auto-expand
    const firstIncompleteIndex = sessions.findIndex(session => !session.is_complete);

    return (
      <div className="space-y-4">
        {sessions.map((session, index) => {
          // Auto-expand first incomplete session, collapse completed ones
          const shouldExpand = !session.is_complete && (firstIncompleteIndex === -1 || index === firstIncompleteIndex);

          return (
            <SessionCard
              key={session.id}
              session={session}
              autoExpanded={shouldExpand}
              userTier={profile?.template_tier ?? "default"}
              userGender={profile?.gender ?? "unset"}
            />
          );
        })}

        {/* Week Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-subtle">
          <a
            href={`/sessions?week=${Math.max(1, currentWeek - 1)}`}
            className={`text-sm px-3 py-2 rounded-md transition-colors ${
              currentWeek === 1
                ? "text-content-muted cursor-not-allowed"
                : "text-content-secondary hover:text-content-primary hover:bg-bg-hover"
            }`}
            {...(currentWeek === 1 && { "aria-disabled": "true" })}
          >
            ← Previous Week
          </a>
          
          <span className="text-sm text-content-secondary">
            Week {currentWeek} of {totalWeeks}
          </span>
          
          <a
            href={`/sessions?week=${Math.min(totalWeeks, currentWeek + 1)}`}
            className={`text-sm px-3 py-2 rounded-md transition-colors ${
              currentWeek === totalWeeks
                ? "text-content-muted cursor-not-allowed"
                : "text-content-secondary hover:text-content-primary hover:bg-bg-hover"
            }`}
            {...(currentWeek === totalWeeks && { "aria-disabled": "true" })}
          >
            Next Week →
          </a>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading sessions:", error);
    return (
      <div className="text-center py-8">
        <p className="text-content-secondary mb-4">
          Unable to load your sessions. Please try again later.
        </p>
      </div>
    );
  }
}
