import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculatePhaseProgress, calculateProgressPercentage, type OverallProgress, type PhaseProgress } from "@/lib/progress-utils";
import type { Phase, WorkoutTemplate, SessionLog, UserEnrollment } from "@/lib/types";

async function getProgressData(userId: string): Promise<OverallProgress> {
  const supabase = await createClient();

  // Get user enrollment
  const { data: enrollment } = await supabase
    .from("user_enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!enrollment) {
    throw new Error("No active enrollment found");
  }

  // Get all phases for the program
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("program_id", enrollment.program_id)
    .order("phase_number");

  if (!phases) {
    throw new Error("No phases found");
  }

  // Get all workout templates for all phases
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("*")
    .in("phase_id", phases.map(p => p.id))
    .order("session_number");

  // Get all session logs for this user
  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select("*")
    .eq("user_id", userId);

  return calculatePhaseProgress(
    phases, 
    templates || [],
    sessionLogs || [],
    enrollment
  );
}

function SessionStatusIndicator({ 
  isComplete, 
  isCurrent, 
  sessionNumber 
}: { 
  isComplete: boolean; 
  isCurrent: boolean; 
  sessionNumber: number;
}) {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
        {
          "bg-success text-white": isComplete,
          "bg-accent text-white ring-2 ring-accent ring-offset-2 ring-offset-bg-base": isCurrent,
          "bg-bg-surface text-content-muted border border-border-subtle": !isComplete && !isCurrent
        }
      )}
    >
      {sessionNumber}
    </div>
  );
}

function ProgressBar({ completed, total, className }: { completed: number; total: number; className?: string }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div className={cn("w-full bg-bg-surface rounded-full h-2", className)}>
      <div
        className="bg-success h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function PhaseCard({ phase, isCurrentPhase }: { phase: PhaseProgress; isCurrentPhase: boolean }) {
  const progressPercentage = calculateProgressPercentage(phase.completedSessions, phase.totalSessions);

  return (
    <Card className={cn(
      "transition-all duration-200",
      isCurrentPhase && "ring-1 ring-accent ring-offset-2 ring-offset-bg-base"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                isCurrentPhase 
                  ? "bg-accent text-white" 
                  : "bg-bg-surface text-content-secondary"
              )}>
                Phase {phase.phase_number}
              </span>
              {phase.name}
            </CardTitle>
            {phase.subtitle && (
              <p className="text-sm text-content-secondary mt-1">{phase.subtitle}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-content-primary">{progressPercentage}%</div>
            <div className="text-xs text-content-secondary">
              {phase.completedSessions} of {phase.totalSessions}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ProgressBar completed={phase.completedSessions} total={phase.totalSessions} />
        
        <div>
          <div className="text-sm font-medium text-content-primary mb-2">
            Sessions (Weeks {phase.week_start}–{phase.week_end})
          </div>
          <div className="grid grid-cols-6 gap-2">
            {phase.sessions.map((session) => (
              <SessionStatusIndicator
                key={session.id}
                isComplete={session.isComplete}
                isCurrent={session.isCurrent}
                sessionNumber={session.session_number}
              />
            ))}
          </div>
        </div>
        
        {phase.description && (
          <p className="text-sm text-content-secondary">{phase.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function PhaseOverview({ userId }: { userId: string }) {
  try {
    const progressData = await getProgressData(userId);
    const overallPercentage = calculateProgressPercentage(progressData.overallCompleted, progressData.overallTotal);

    return (
      <div className="space-y-6">
        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Program Overview</CardTitle>
            <div className="flex items-center justify-between mt-4">
              <div>
                <div className="text-3xl font-bold text-content-primary">{overallPercentage}%</div>
                <div className="text-sm text-content-secondary">Complete</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-content-primary">
                  {progressData.overallCompleted} of {progressData.overallTotal}
                </div>
                <div className="text-sm text-content-secondary">Sessions</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProgressBar 
              completed={progressData.overallCompleted} 
              total={progressData.overallTotal}
              className="h-3"
            />
          </CardContent>
        </Card>

        {/* Phase Cards */}
        <div className="grid gap-6">
          {progressData.phases.map((phase) => (
            <PhaseCard 
              key={phase.id} 
              phase={phase} 
              isCurrentPhase={phase.phase_number === progressData.currentPhase}
            />
          ))}
        </div>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-success rounded-full" />
                <span className="text-sm text-content-secondary">Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-accent rounded-full ring-2 ring-accent ring-offset-2 ring-offset-bg-base" />
                <span className="text-sm text-content-secondary">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-bg-surface border border-border-subtle rounded-full" />
                <span className="text-sm text-content-secondary">Upcoming</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading progress data:", error);
    return (
      <div className="text-center py-8">
        <p className="text-content-secondary mb-4">
          Unable to load your progress. Please try again later.
        </p>
      </div>
    );
  }
}