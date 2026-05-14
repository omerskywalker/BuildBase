import { describe, it, expect } from 'vitest';
import {
  calculateCurrentStreak,
  calculateCompletionRate,
  detectPersonalRecords,
  checkNewMilestones,
  getMilestoneDefinition,
  MILESTONE_DEFINITIONS
} from '@/lib/milestone-utils';
import type { SessionLog, SetLog, PersonalRecord, Milestone } from '@/lib/types';

describe('milestone-utils', () => {
  describe('calculateCurrentStreak', () => {
    it('should return 0 for empty session logs', () => {
      expect(calculateCurrentStreak([])).toBe(0);
    });

    it('should return 0 when no sessions are completed', () => {
      const sessionLogs: SessionLog[] = [
        {
          id: '1',
          user_id: 'user1',
          workout_template_id: 'template1',
          enrollment_id: 'enrollment1',
          week_number: 1,
          session_number: 1,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: null,
          is_complete: false,
          post_session_effort: null,
          pre_session_soreness: null,
          soreness_prompted: false,
          notes: null,
          created_at: '2024-01-01T09:00:00Z'
        }
      ];
      
      expect(calculateCurrentStreak(sessionLogs)).toBe(0);
    });

    it('should calculate streak correctly for consecutive completed sessions', () => {
      const sessionLogs: SessionLog[] = [
        {
          id: '1',
          user_id: 'user1',
          workout_template_id: 'template1',
          enrollment_id: 'enrollment1',
          week_number: 1,
          session_number: 3,
          started_at: '2024-01-03T10:00:00Z',
          completed_at: '2024-01-03T11:00:00Z',
          is_complete: true,
          post_session_effort: 4,
          pre_session_soreness: null,
          soreness_prompted: false,
          notes: null,
          created_at: '2024-01-03T09:00:00Z'
        },
        {
          id: '2',
          user_id: 'user1',
          workout_template_id: 'template2',
          enrollment_id: 'enrollment1',
          week_number: 1,
          session_number: 2,
          started_at: '2024-01-02T10:00:00Z',
          completed_at: '2024-01-02T11:00:00Z',
          is_complete: true,
          post_session_effort: 3,
          pre_session_soreness: null,
          soreness_prompted: false,
          notes: null,
          created_at: '2024-01-02T09:00:00Z'
        },
        {
          id: '3',
          user_id: 'user1',
          workout_template_id: 'template3',
          enrollment_id: 'enrollment1',
          week_number: 1,
          session_number: 1,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T11:00:00Z',
          is_complete: true,
          post_session_effort: 2,
          pre_session_soreness: null,
          soreness_prompted: false,
          notes: null,
          created_at: '2024-01-01T09:00:00Z'
        }
      ];
      
      expect(calculateCurrentStreak(sessionLogs)).toBe(3);
    });

    it('should break streak when there is a gap', () => {
      const sessionLogs: SessionLog[] = [
        {
          id: '1',
          user_id: 'user1',
          workout_template_id: 'template1',
          enrollment_id: 'enrollment1',
          week_number: 1,
          session_number: 3,
          started_at: '2024-01-03T10:00:00Z',
          completed_at: '2024-01-03T11:00:00Z',
          is_complete: true,
          post_session_effort: 4,
          pre_session_soreness: null,
          soreness_prompted: false,
          notes: null,
          created_at: '2024-01-03T09:00:00Z'
        },
        {
          id: '2',
          user_id: 'user1',
          workout_template_id: 'template2',
          enrollment_id: 'enrollment1',
          week_number: 1,
          session_number: 2,
          started_at: '2024-01-02T10:00:00Z',
          completed_at: null,
          is_complete: false,
          post_session_effort: null,
          pre_session_soreness: null,
          soreness_prompted: false,
          notes: null,
          created_at: '2024-01-02T09:00:00Z'
        },
        {
          id: '3',
          user_id: 'user1',
          workout_template_id: 'template3',
          enrollment_id: 'enrollment1',
          week_number: 1,
          session_number: 1,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T11:00:00Z',
          is_complete: true,
          post_session_effort: 2,
          pre_session_soreness: null,
          soreness_prompted: false,
          notes: null,
          created_at: '2024-01-01T09:00:00Z'
        }
      ];
      
      expect(calculateCurrentStreak(sessionLogs)).toBe(1);
    });
  });

  describe('calculateCompletionRate', () => {
    it('should return 0 when no total sessions', () => {
      expect(calculateCompletionRate(5, 0)).toBe(0);
    });

    it('should calculate correct percentage', () => {
      expect(calculateCompletionRate(18, 36)).toBe(50);
      expect(calculateCompletionRate(9, 36)).toBe(25);
      expect(calculateCompletionRate(36, 36)).toBe(100);
    });

    it('should round to nearest integer', () => {
      expect(calculateCompletionRate(1, 3)).toBe(33);
      expect(calculateCompletionRate(2, 3)).toBe(67);
    });
  });

  describe('detectPersonalRecords', () => {
    it('should return empty array for empty set logs', () => {
      expect(detectPersonalRecords([], [])).toEqual([]);
    });

    it('should detect new PR when no existing PRs', () => {
      const setLogs: SetLog[] = [
        {
          id: 'set1',
          session_log_id: 'session1',
          template_exercise_id: 'te1',
          exercise_id: 'exercise1',
          set_number: 1,
          weight_used: 100,
          reps_completed: 8,
          is_completed: true,
          notes: null,
          logged_at: '2024-01-01T10:00:00Z'
        }
      ];
      
      const result = detectPersonalRecords(setLogs, []);
      expect(result).toHaveLength(1);
      expect(result[0].exercise_id).toBe('exercise1');
      expect(result[0].weight).toBe(100);
      expect(result[0].reps).toBe(8);
    });

    it('should not detect PR when existing PR is better', () => {
      const setLogs: SetLog[] = [
        {
          id: 'set1',
          session_log_id: 'session1',
          template_exercise_id: 'te1',
          exercise_id: 'exercise1',
          set_number: 1,
          weight_used: 100,
          reps_completed: 8,
          is_completed: true,
          notes: null,
          logged_at: '2024-01-01T10:00:00Z'
        }
      ];

      const existingPRs: PersonalRecord[] = [
        {
          id: 'pr1',
          user_id: 'user1',
          exercise_id: 'exercise1',
          weight: 110,
          reps: 8,
          achieved_at: '2023-12-01T10:00:00Z',
          set_log_id: 'oldset1'
        }
      ];
      
      const result = detectPersonalRecords(setLogs, existingPRs);
      expect(result).toHaveLength(0);
    });

    it('should detect PR when new set is better', () => {
      const setLogs: SetLog[] = [
        {
          id: 'set1',
          session_log_id: 'session1',
          template_exercise_id: 'te1',
          exercise_id: 'exercise1',
          set_number: 1,
          weight_used: 120,
          reps_completed: 8,
          is_completed: true,
          notes: null,
          logged_at: '2024-01-01T10:00:00Z'
        }
      ];

      const existingPRs: PersonalRecord[] = [
        {
          id: 'pr1',
          user_id: 'user1',
          exercise_id: 'exercise1',
          weight: 100,
          reps: 8,
          achieved_at: '2023-12-01T10:00:00Z',
          set_log_id: 'oldset1'
        }
      ];
      
      const result = detectPersonalRecords(setLogs, existingPRs);
      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(120);
    });
  });

  describe('checkNewMilestones', () => {
    it('should award first_session milestone', () => {
      const sessionLogs: SessionLog[] = [
        {
          id: '1',
          user_id: 'user1',
          workout_template_id: 'template1',
          enrollment_id: 'enrollment1',
          week_number: 1,
          session_number: 1,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T11:00:00Z',
          is_complete: true,
          post_session_effort: 3,
          pre_session_soreness: null,
          soreness_prompted: false,
          notes: null,
          created_at: '2024-01-01T09:00:00Z'
        }
      ];

      const result = checkNewMilestones(sessionLogs, [], [], 36);
      expect(result).toContain('first_session');
    });

    it('should award week_complete milestone after 3 sessions', () => {
      const sessionLogs: SessionLog[] = Array.from({ length: 3 }, (_, i) => ({
        id: `session${i + 1}`,
        user_id: 'user1',
        workout_template_id: `template${i + 1}`,
        enrollment_id: 'enrollment1',
        week_number: 1,
        session_number: i + 1,
        started_at: `2024-01-0${i + 1}T10:00:00Z`,
        completed_at: `2024-01-0${i + 1}T11:00:00Z`,
        is_complete: true,
        post_session_effort: 3,
        pre_session_soreness: null,
        soreness_prompted: false,
        notes: null,
        created_at: `2024-01-0${i + 1}T09:00:00Z`
      }));

      const result = checkNewMilestones(sessionLogs, [], [], 36);
      expect(result).toContain('week_complete');
    });

    it('should award halfway_hero at 50% completion', () => {
      const sessionLogs: SessionLog[] = Array.from({ length: 18 }, (_, i) => ({
        id: `session${i + 1}`,
        user_id: 'user1',
        workout_template_id: `template${i + 1}`,
        enrollment_id: 'enrollment1',
        week_number: Math.floor(i / 3) + 1,
        session_number: (i % 3) + 1,
        started_at: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        completed_at: `2024-01-${String(i + 1).padStart(2, '0')}T11:00:00Z`,
        is_complete: true,
        post_session_effort: 3,
        pre_session_soreness: null,
        soreness_prompted: false,
        notes: null,
        created_at: `2024-01-${String(i + 1).padStart(2, '0')}T09:00:00Z`
      }));

      const result = checkNewMilestones(sessionLogs, [], [], 36);
      expect(result).toContain('halfway_hero');
    });

    it('should not award already achieved milestones', () => {
      const sessionLogs: SessionLog[] = [
        {
          id: '1',
          user_id: 'user1',
          workout_template_id: 'template1',
          enrollment_id: 'enrollment1',
          week_number: 1,
          session_number: 1,
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T11:00:00Z',
          is_complete: true,
          post_session_effort: 3,
          pre_session_soreness: null,
          soreness_prompted: false,
          notes: null,
          created_at: '2024-01-01T09:00:00Z'
        }
      ];

      const existingMilestones: Milestone[] = [
        {
          id: 'milestone1',
          user_id: 'user1',
          milestone_key: 'first_session',
          achieved_at: '2024-01-01T11:00:00Z',
          notes: null,
          set_by: null
        }
      ];

      const result = checkNewMilestones(sessionLogs, [], existingMilestones, 36);
      expect(result).not.toContain('first_session');
    });
  });

  describe('getMilestoneDefinition', () => {
    it('should return correct milestone definition', () => {
      const definition = getMilestoneDefinition('first_session');
      expect(definition).toBeDefined();
      expect(definition?.title).toBe('First Steps');
      expect(definition?.category).toBe('consistency');
    });

    it('should return undefined for non-existent key', () => {
      const definition = getMilestoneDefinition('non_existent');
      expect(definition).toBeUndefined();
    });
  });

  describe('MILESTONE_DEFINITIONS', () => {
    it('should have all required milestone definitions', () => {
      const expectedKeys = [
        'first_session',
        'week_complete',
        'streak_7',
        'streak_14',
        'streak_21',
        'first_pr',
        'pr_streak_3',
        'phase_1_complete',
        'phase_2_complete',
        'phase_3_complete',
        'halfway_hero',
        'program_complete'
      ];

      const actualKeys = MILESTONE_DEFINITIONS.map(m => m.key);
      expect(actualKeys).toEqual(expect.arrayContaining(expectedKeys));
      expect(actualKeys).toHaveLength(expectedKeys.length);
    });

    it('should have valid categories for all milestones', () => {
      const validCategories = ['consistency', 'strength', 'progress', 'completion'];
      
      for (const milestone of MILESTONE_DEFINITIONS) {
        expect(validCategories).toContain(milestone.category);
      }
    });

    it('should have required fields for all milestones', () => {
      for (const milestone of MILESTONE_DEFINITIONS) {
        expect(milestone.key).toBeTruthy();
        expect(milestone.title).toBeTruthy();
        expect(milestone.description).toBeTruthy();
        expect(milestone.icon).toBeTruthy();
        expect(milestone.category).toBeTruthy();
      }
    });
  });
});