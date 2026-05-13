import type { Phase, WorkoutTemplate, SessionLog } from "./types";

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

export function isCurrentSession(
  template: WorkoutTemplate,
  sessionLog: SessionLog | undefined,
  currentWeek: number,
  currentSession: number
): boolean {
  const isComplete = sessionLog?.is_complete || false;
  if (isComplete) return false;
  return template.session_number === currentSession ||
    (template.week_number === currentWeek && !isComplete);
}

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
      return { ...template, sessionLog, isComplete, isCurrent };
    });
    const completedSessions = sessions.filter(s => s.isComplete).length;
    return { ...phase, sessions, completedSessions, totalSessions: sessions.length };
  });
  const overallCompleted = phaseData.reduce((sum, p) => sum + p.completedSessions, 0);
  const overallTotal = phaseData.reduce((sum, p) => sum + p.totalSessions, 0);
  const currentPhaseIndex = phaseData.findIndex(p => p.completedSessions < p.totalSessions);
  const currentPhase = currentPhaseIndex >= 0 ? currentPhaseIndex + 1 : phases.length;
  return { phases: phaseData, overallCompleted, overallTotal, currentPhase };
}

export function calculateProgressPercentage(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
