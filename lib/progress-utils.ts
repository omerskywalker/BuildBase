import type { Phase, WorkoutTemplate, SessionLog } from "@/lib/types";

export interface PhaseProgress extends Phase {
  sessions: Array<WorkoutTemplate & {
    sessionLog?: SessionLog;
    isComplete: boolean;
    isCurrent: boolean;
  }>;
  completedSessions: number;
  totalSessions: number;
}

export interface OverallProgress {
  phases: PhaseProgress[];
  overallCompleted: number;
  overallTotal: number;
  currentPhase: number;
}

/**
 * Determines if a session is the current active session
 * Current session is the first incomplete session in the user's enrollment progress
 */
export function isCurrentSession(
  template: WorkoutTemplate,
  sessionLog: SessionLog | undefined,
  currentWeek: number,
  currentSession: number
): boolean {
  const isComplete = sessionLog?.is_complete || false;
  
  if (isComplete) return false;
  
  // Current session is based on enrollment progress
  return template.session_number === currentSession || 
         (template.week_number === currentWeek && !isComplete);
}

/**
 * Calculates progress data for all phases
 */
export function calculatePhaseProgress(
  phases: Phase[],
  templates: WorkoutTemplate[],
  sessionLogs: SessionLog[],
  enrollment: { current_week: number; current_session: number }
): OverallProgress {
  const phaseData: PhaseProgress[] = phases.map(phase => {
    const phaseSessions = templates.filter(t => t.phase_id === phase.id);
    
    const sessions = phaseSessions.map(template => {
      const sessionLog = sessionLogs.find(log => log.workout_template_id === template.id);
      const isComplete = sessionLog?.is_complete || false;
      const isCurrent = isCurrentSession(template, sessionLog, enrollment.current_week, enrollment.current_session);

      return {
        ...template,
        sessionLog,
        isComplete,
        isCurrent
      };
    });

    const completedSessions = sessions.filter(s => s.isComplete).length;
    
    return {
      ...phase,
      sessions,
      completedSessions,
      totalSessions: sessions.length
    };
  });

  // Calculate overall progress
  const overallCompleted = phaseData.reduce((sum, phase) => sum + phase.completedSessions, 0);
  const overallTotal = phaseData.reduce((sum, phase) => sum + phase.totalSessions, 0);

  // Determine current phase (phase with incomplete sessions, or last phase if all complete)
  const currentPhaseIndex = phaseData.findIndex(phase => phase.completedSessions < phase.totalSessions);
  const currentPhase = currentPhaseIndex >= 0 ? currentPhaseIndex + 1 : phases.length;

  return {
    phases: phaseData,
    overallCompleted,
    overallTotal,
    currentPhase
  };
}

/**
 * Calculates progress percentage
 */
export function calculateProgressPercentage(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}