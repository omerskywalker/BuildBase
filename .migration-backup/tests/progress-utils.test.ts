import { describe, it, expect } from "vitest";
import { 
  isCurrentSession, 
  calculatePhaseProgress, 
  calculateProgressPercentage 
} from "@/lib/progress-utils";
import type { Phase, WorkoutTemplate, SessionLog } from "@/lib/types";

describe("calculateProgressPercentage", () => {
  it("calculates correct percentage for normal values", () => {
    expect(calculateProgressPercentage(3, 10)).toBe(30);
    expect(calculateProgressPercentage(7, 10)).toBe(70);
    expect(calculateProgressPercentage(10, 10)).toBe(100);
  });

  it("handles zero total gracefully", () => {
    expect(calculateProgressPercentage(0, 0)).toBe(0);
    expect(calculateProgressPercentage(5, 0)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(calculateProgressPercentage(1, 3)).toBe(33); // 33.33... rounds to 33
    expect(calculateProgressPercentage(2, 3)).toBe(67); // 66.67... rounds to 67
  });
});

describe("isCurrentSession", () => {
  const createTemplate = (sessionNumber: number, weekNumber: number): WorkoutTemplate => ({
    id: `template-${sessionNumber}`,
    phase_id: "phase-1",
    week_number: weekNumber,
    session_number: sessionNumber,
    day_label: "A" as const,
    title: `Session ${sessionNumber}`,
    description: null,
    order_index: sessionNumber
  });

  const createSessionLog = (isComplete: boolean): SessionLog => ({
    id: "log-1",
    user_id: "user-1",
    workout_template_id: "template-1",
    enrollment_id: "enrollment-1",
    week_number: 1,
    session_number: 1,
    started_at: null,
    completed_at: isComplete ? "2024-01-01T12:00:00Z" : null,
    is_complete: isComplete,
    post_session_effort: null,
    pre_session_soreness: null,
    soreness_prompted: false,
    notes: null,
    created_at: "2024-01-01T10:00:00Z"
  });

  it("returns false for completed sessions", () => {
    const template = createTemplate(1, 1);
    const sessionLog = createSessionLog(true);
    
    expect(isCurrentSession(template, sessionLog, 1, 1)).toBe(false);
  });

  it("returns true for session matching current session number", () => {
    const template = createTemplate(3, 1);
    const sessionLog = createSessionLog(false);
    
    expect(isCurrentSession(template, sessionLog, 1, 3)).toBe(true);
  });

  it("returns true for incomplete session in current week", () => {
    const template = createTemplate(4, 2);
    const sessionLog = createSessionLog(false);
    
    expect(isCurrentSession(template, sessionLog, 2, 1)).toBe(true);
  });

  it("returns false for sessions not in current progress", () => {
    const template = createTemplate(5, 3);
    const sessionLog = createSessionLog(false);
    
    expect(isCurrentSession(template, sessionLog, 1, 2)).toBe(false);
  });

  it("handles undefined session log", () => {
    const template = createTemplate(1, 1);
    
    expect(isCurrentSession(template, undefined, 1, 1)).toBe(true);
    expect(isCurrentSession(template, undefined, 2, 2)).toBe(false);
  });
});

describe("calculatePhaseProgress", () => {
  const createPhase = (phaseNumber: number, weekStart: number, weekEnd: number): Phase => ({
    id: `phase-${phaseNumber}`,
    program_id: "program-1",
    phase_number: phaseNumber,
    name: `Phase ${phaseNumber}`,
    subtitle: null,
    week_start: weekStart,
    week_end: weekEnd,
    description: null
  });

  const createTemplate = (phaseId: string, sessionNumber: number, weekNumber: number): WorkoutTemplate => ({
    id: `template-${sessionNumber}`,
    phase_id: phaseId,
    week_number: weekNumber,
    session_number: sessionNumber,
    day_label: "A" as const,
    title: `Session ${sessionNumber}`,
    description: null,
    order_index: sessionNumber
  });

  const createSessionLog = (templateId: string, isComplete: boolean): SessionLog => ({
    id: `log-${templateId}`,
    user_id: "user-1",
    workout_template_id: templateId,
    enrollment_id: "enrollment-1",
    week_number: 1,
    session_number: 1,
    started_at: null,
    completed_at: isComplete ? "2024-01-01T12:00:00Z" : null,
    is_complete: isComplete,
    post_session_effort: null,
    pre_session_soreness: null,
    soreness_prompted: false,
    notes: null,
    created_at: "2024-01-01T10:00:00Z"
  });

  it("calculates progress correctly for simple case", () => {
    const phases = [createPhase(1, 1, 4)];
    const templates = [
      createTemplate("phase-1", 1, 1),
      createTemplate("phase-1", 2, 1),
      createTemplate("phase-1", 3, 2)
    ];
    const sessionLogs = [
      createSessionLog("template-1", true),
      createSessionLog("template-2", false)
    ];
    const enrollment = { current_week: 1, current_session: 2 };

    const result = calculatePhaseProgress(phases, templates, sessionLogs, enrollment);

    expect(result.phases).toHaveLength(1);
    expect(result.phases[0].completedSessions).toBe(1);
    expect(result.phases[0].totalSessions).toBe(3);
    expect(result.overallCompleted).toBe(1);
    expect(result.overallTotal).toBe(3);
    expect(result.currentPhase).toBe(1);
  });

  it("determines current phase correctly", () => {
    const phases = [
      createPhase(1, 1, 4),
      createPhase(2, 5, 8),
      createPhase(3, 9, 12)
    ];
    const templates = [
      createTemplate("phase-1", 1, 1),
      createTemplate("phase-1", 2, 1),
      createTemplate("phase-2", 3, 5),
      createTemplate("phase-3", 4, 9)
    ];
    const sessionLogs = [
      createSessionLog("template-1", true),
      createSessionLog("template-2", true)
      // Phase 1 complete, Phase 2 has incomplete sessions
    ];
    const enrollment = { current_week: 5, current_session: 3 };

    const result = calculatePhaseProgress(phases, templates, sessionLogs, enrollment);

    expect(result.currentPhase).toBe(2); // Phase 2 has incomplete sessions
  });

  it("handles all phases complete", () => {
    const phases = [createPhase(1, 1, 4)];
    const templates = [createTemplate("phase-1", 1, 1)];
    const sessionLogs = [createSessionLog("template-1", true)];
    const enrollment = { current_week: 4, current_session: 1 };

    const result = calculatePhaseProgress(phases, templates, sessionLogs, enrollment);

    expect(result.currentPhase).toBe(1); // Last phase when all complete
    expect(result.phases[0].completedSessions).toBe(1);
    expect(result.phases[0].totalSessions).toBe(1);
  });

  it("handles empty data", () => {
    const result = calculatePhaseProgress([], [], [], { current_week: 1, current_session: 1 });

    expect(result.phases).toHaveLength(0);
    expect(result.overallCompleted).toBe(0);
    expect(result.overallTotal).toBe(0);
    expect(result.currentPhase).toBe(0);
  });
});