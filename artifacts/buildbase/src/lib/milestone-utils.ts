import type { SessionLog, PersonalRecord, Milestone } from "./types";

export interface MilestoneDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: "consistency" | "strength" | "progress" | "completion";
}

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  { key: "first_session", title: "First Steps", description: "Complete your first workout session", icon: "🎯", category: "consistency" },
  { key: "week_complete", title: "Week Warrior", description: "Complete your first full week", icon: "📅", category: "consistency" },
  { key: "streak_7", title: "Week Streak", description: "Complete 7 sessions in a row", icon: "🔥", category: "consistency" },
  { key: "streak_14", title: "Two Week Streak", description: "Complete 14 sessions in a row", icon: "🚀", category: "consistency" },
  { key: "streak_21", title: "Three Week Streak", description: "Complete 21 sessions in a row", icon: "⚡", category: "consistency" },
  { key: "first_pr", title: "Personal Best", description: "Set your first personal record", icon: "💪", category: "strength" },
  { key: "pr_streak_3", title: "PR Machine", description: "Set 3 personal records in one week", icon: "🏆", category: "strength" },
  { key: "phase_1_complete", title: "Foundation Master", description: "Complete Phase 1 of your program", icon: "🏗️", category: "progress" },
  { key: "phase_2_complete", title: "Strength Builder", description: "Complete Phase 2 of your program", icon: "🏋️", category: "progress" },
  { key: "phase_3_complete", title: "Peak Performer", description: "Complete Phase 3 of your program", icon: "🎖️", category: "progress" },
  { key: "halfway_hero", title: "Halfway Hero", description: "Complete 50% of your program", icon: "🎯", category: "completion" },
  { key: "program_complete", title: "Program Graduate", description: "Complete your entire 12-week program", icon: "🎓", category: "completion" },
];

export function getMilestoneDefinition(key: string): MilestoneDefinition | undefined {
  return MILESTONE_DEFINITIONS.find(m => m.key === key);
}

export function calculateCurrentStreak(sessionLogs: SessionLog[]): number {
  if (!sessionLogs.length) return 0;
  const sortedLogs = [...sessionLogs]
    .filter(log => log.completed_at !== null)
    .sort((a, b) => {
      if (a.week_number !== b.week_number) return b.week_number - a.week_number;
      return b.session_number - a.session_number;
    });
  let streak = 0;
  let expectedSession = sortedLogs[0]?.session_number;
  let expectedWeek = sortedLogs[0]?.week_number;
  for (const log of sortedLogs) {
    if (log.week_number === expectedWeek && log.session_number === expectedSession) {
      streak++;
      expectedSession--;
      if (expectedSession < 1) { expectedSession = 3; expectedWeek--; }
    } else break;
  }
  return streak;
}

export function calculateCompletionRate(completedSessions: number, totalSessions: number): number {
  return totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
}
