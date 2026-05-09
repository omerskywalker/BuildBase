import { v4 as uuidv4 } from "uuid";
import type { SessionLog, SetLog, PersonalRecord, Milestone, Exercise } from "@/lib/types";

// Milestone definitions - what achievements are possible
export interface MilestoneDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "consistency" | "strength" | "progress" | "completion";
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  // Consistency milestones
  {
    key: "first_session",
    title: "First Steps",
    description: "Complete your first workout session",
    icon: "🎯",
    category: "consistency"
  },
  {
    key: "week_complete",
    title: "Week Warrior",
    description: "Complete your first full week",
    icon: "📅",
    category: "consistency"
  },
  {
    key: "streak_7",
    title: "Week Streak",
    description: "Complete 7 sessions in a row",
    icon: "🔥",
    category: "consistency"
  },
  {
    key: "streak_14",
    title: "Two Week Streak",
    description: "Complete 14 sessions in a row",
    icon: "🚀",
    category: "consistency"
  },
  {
    key: "streak_21",
    title: "Three Week Streak",
    description: "Complete 21 sessions in a row",
    icon: "⚡",
    category: "consistency"
  },
  
  // Strength milestones
  {
    key: "first_pr",
    title: "Personal Best",
    description: "Set your first personal record",
    icon: "💪",
    category: "strength"
  },
  {
    key: "pr_streak_3",
    title: "PR Machine",
    description: "Set 3 personal records in one week",
    icon: "🏆",
    category: "strength"
  },
  
  // Progress milestones
  {
    key: "phase_1_complete",
    title: "Foundation Master",
    description: "Complete Phase 1 of your program",
    icon: "🏗️",
    category: "progress"
  },
  {
    key: "phase_2_complete",
    title: "Strength Builder",
    description: "Complete Phase 2 of your program",
    icon: "🏋️",
    category: "progress"
  },
  {
    key: "phase_3_complete",
    title: "Peak Performer",
    description: "Complete Phase 3 of your program",
    icon: "🎖️",
    category: "progress"
  },
  
  // Completion milestones
  {
    key: "halfway_hero",
    title: "Halfway Hero",
    description: "Complete 50% of your program",
    icon: "🎯",
    category: "completion"
  },
  {
    key: "program_complete",
    title: "Program Graduate",
    description: "Complete your entire 12-week program",
    icon: "🎓",
    category: "completion"
  }
];

export function getMilestoneDefinition(key: string): MilestoneDefinition | undefined {
  return MILESTONE_DEFINITIONS.find(m => m.key === key);
}

/**
 * Calculate current session streak
 * Returns the number of consecutive completed sessions from the most recent session
 */
export function calculateCurrentStreak(sessionLogs: SessionLog[]): number {
  if (!sessionLogs.length) return 0;
  
  // Sort by session number descending (most recent first)
  const sortedLogs = [...sessionLogs]
    .filter(log => log.completed_at !== null)
    .sort((a, b) => {
      if (a.week_number !== b.week_number) {
        return b.week_number - a.week_number;
      }
      return b.session_number - a.session_number;
    });
    
  let streak = 0;
  let expectedSession = sortedLogs[0]?.session_number;
  let expectedWeek = sortedLogs[0]?.week_number;
  
  for (const log of sortedLogs) {
    if (log.week_number === expectedWeek && log.session_number === expectedSession) {
      streak++;
      // Move to previous session
      expectedSession--;
      if (expectedSession < 1) {
        expectedSession = 3; // Assuming 3 sessions per week
        expectedWeek--;
      }
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Calculate completion rate percentage
 */
export function calculateCompletionRate(completedSessions: number, totalSessions: number): number {
  return totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
}

/**
 * Detect new personal records from set logs
 * Returns PRs that should be recorded in the personal_records table
 */
export function detectPersonalRecords(
  setLogs: SetLog[], 
  existingPRs: PersonalRecord[]
): PersonalRecord[] {
  const newPRs: PersonalRecord[] = [];
  const exerciseGroups = groupBy(setLogs, log => log.exercise_id);
  
  for (const [exerciseId, logs] of exerciseGroups) {
    const existingPR = existingPRs.find(pr => pr.exercise_id === exerciseId);
    const bestSet = findBestSet(logs);
    
    if (bestSet && shouldRecordPR(bestSet, existingPR)) {
      newPRs.push({
        id: uuidv4(),
        user_id: "", // Will be set by caller
        exercise_id: exerciseId,
        weight: bestSet.weight_used || 0,
        reps: bestSet.reps_completed || 0,
        achieved_at: bestSet.logged_at,
        set_log_id: bestSet.id
      });
    }
  }
  
  return newPRs;
}

/**
 * Check what new milestones should be awarded
 */
export function checkNewMilestones(
  sessionLogs: SessionLog[],
  personalRecords: PersonalRecord[],
  existingMilestones: Milestone[],
  totalProgramSessions: number
): string[] {
  const newMilestoneKeys: string[] = [];
  const existingKeys = new Set(existingMilestones.map(m => m.milestone_key));
  
  const completedSessions = sessionLogs.filter(log => log.is_complete);
  const completedCount = completedSessions.length;
  const currentStreak = calculateCurrentStreak(sessionLogs);
  const completionRate = calculateCompletionRate(completedCount, totalProgramSessions);
  
  // Check each milestone definition
  for (const milestone of MILESTONE_DEFINITIONS) {
    if (existingKeys.has(milestone.key)) continue;
    
    let shouldAward = false;
    
    switch (milestone.key) {
      case "first_session":
        shouldAward = completedCount >= 1;
        break;
        
      case "week_complete":
        shouldAward = completedCount >= 3;
        break;
        
      case "streak_7":
        shouldAward = currentStreak >= 7;
        break;
        
      case "streak_14":
        shouldAward = currentStreak >= 14;
        break;
        
      case "streak_21":
        shouldAward = currentStreak >= 21;
        break;
        
      case "first_pr":
        shouldAward = personalRecords.length >= 1;
        break;
        
      case "pr_streak_3":
        shouldAward = checkPRStreak(personalRecords, 3);
        break;
        
      case "phase_1_complete":
        shouldAward = checkPhaseComplete(sessionLogs, 1);
        break;
        
      case "phase_2_complete":
        shouldAward = checkPhaseComplete(sessionLogs, 2);
        break;
        
      case "phase_3_complete":
        shouldAward = checkPhaseComplete(sessionLogs, 3);
        break;
        
      case "halfway_hero":
        shouldAward = completionRate >= 50;
        break;
        
      case "program_complete":
        shouldAward = completionRate >= 100;
        break;
    }
    
    if (shouldAward) {
      newMilestoneKeys.push(milestone.key);
    }
  }
  
  return newMilestoneKeys;
}

// Helper functions

function groupBy<T, K>(array: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of array) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function findBestSet(setLogs: SetLog[]): SetLog | null {
  if (!setLogs.length) return null;
  
  // Find the set with the highest weight * reps product
  return setLogs
    .filter(log => log.is_completed && log.weight_used && log.reps_completed)
    .reduce((best, current) => {
      const bestScore = (best.weight_used || 0) * (best.reps_completed || 0);
      const currentScore = (current.weight_used || 0) * (current.reps_completed || 0);
      return currentScore > bestScore ? current : best;
    });
}

function shouldRecordPR(setLog: SetLog, existingPR?: PersonalRecord): boolean {
  if (!setLog.weight_used || !setLog.reps_completed) return false;
  if (!existingPR) return true;
  
  const newScore = setLog.weight_used * setLog.reps_completed;
  const existingScore = existingPR.weight * existingPR.reps;
  
  return newScore > existingScore;
}

function checkPRStreak(personalRecords: PersonalRecord[], requiredCount: number): boolean {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentPRs = personalRecords.filter(pr => 
    new Date(pr.achieved_at) >= oneWeekAgo
  );
  
  return recentPRs.length >= requiredCount;
}

function checkPhaseComplete(sessionLogs: SessionLog[], phaseNumber: number): boolean {
  const phaseWeekRanges = {
    1: [1, 4],
    2: [5, 8], 
    3: [9, 12]
  };
  
  const [startWeek, endWeek] = phaseWeekRanges[phaseNumber as keyof typeof phaseWeekRanges] || [0, 0];
  
  const phaseSessions = sessionLogs.filter(log => 
    log.week_number >= startWeek && 
    log.week_number <= endWeek &&
    log.is_complete
  );
  
  // Assuming 3 sessions per week, 4 weeks per phase = 12 sessions
  const expectedSessions = (endWeek - startWeek + 1) * 3;
  return phaseSessions.length >= expectedSessions;
}