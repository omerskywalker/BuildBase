import { describe, it, expect } from 'vitest';
import type { TemplateExercise, Exercise } from '@/lib/types';

// Utility functions for session editor
export function reorderExercises<T extends { id: string }>(
  items: T[], 
  activeId: string, 
  overId: string
): T[] {
  const activeIndex = items.findIndex(item => item.id === activeId);
  const overIndex = items.findIndex(item => item.id === overId);
  
  if (activeIndex === -1 || overIndex === -1) return items;
  
  const result = [...items];
  const [removed] = result.splice(activeIndex, 1);
  result.splice(overIndex, 0, removed);
  
  return result;
}

export function updateExerciseOrderIndices<T extends { order_index: number }>(
  exercises: T[]
): T[] {
  return exercises.map((exercise, index) => ({
    ...exercise,
    order_index: index
  }));
}

export function validateExerciseData(data: Partial<TemplateExercise>): boolean {
  if (data.sets_default !== undefined && (data.sets_default < 1 || data.sets_default > 10)) {
    return false;
  }
  
  if (data.reps_default !== undefined && (data.reps_default < 1 || data.reps_default > 50)) {
    return false;
  }
  
  if (data.superset_group !== undefined && data.superset_group !== null) {
    const validPattern = /^[A-Z]$/;
    if (!validPattern.test(data.superset_group)) {
      return false;
    }
  }
  
  return true;
}

export function filterAvailableExercises(
  allExercises: Exercise[],
  excludeIds: string[],
  searchQuery: string = '',
  muscleGroup: string = ''
): Exercise[] {
  return allExercises
    .filter(exercise => !excludeIds.includes(exercise.id))
    .filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (exercise.muscle_group?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesMuscleGroup = !muscleGroup || exercise.muscle_group === muscleGroup;
      return matchesSearch && matchesMuscleGroup;
    });
}

describe('Session Editor Utils', () => {
  const mockExercises = [
    { id: '1', order_index: 0, name: 'Exercise 1' },
    { id: '2', order_index: 1, name: 'Exercise 2' },
    { id: '3', order_index: 2, name: 'Exercise 3' }
  ];

  const mockExerciseLibrary: Exercise[] = [
    {
      id: 'ex1',
      name: 'Push-ups',
      muscle_group: 'Chest',
      equipment: 'Bodyweight',
      instructions: null,
      coaching_cues: null,
      video_url: null,
      created_by: null,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'ex2',
      name: 'Pull-ups',
      muscle_group: 'Back',
      equipment: 'Pull-up bar',
      instructions: null,
      coaching_cues: null,
      video_url: null,
      created_by: null,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'ex3',
      name: 'Squats',
      muscle_group: 'Legs',
      equipment: 'Bodyweight',
      instructions: null,
      coaching_cues: null,
      video_url: null,
      created_by: null,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z'
    }
  ];

  describe('reorderExercises', () => {
    it('should reorder exercises correctly when moving down', () => {
      const result = reorderExercises(mockExercises, '1', '3');
      expect(result.map(e => e.id)).toEqual(['2', '3', '1']);
    });

    it('should reorder exercises correctly when moving up', () => {
      const result = reorderExercises(mockExercises, '3', '1');
      expect(result.map(e => e.id)).toEqual(['3', '1', '2']);
    });

    it('should return original array if active item not found', () => {
      const result = reorderExercises(mockExercises, 'nonexistent', '2');
      expect(result).toEqual(mockExercises);
    });

    it('should return original array if over item not found', () => {
      const result = reorderExercises(mockExercises, '1', 'nonexistent');
      expect(result).toEqual(mockExercises);
    });
  });

  describe('updateExerciseOrderIndices', () => {
    it('should update order indices based on array position', () => {
      const reordered = reorderExercises(mockExercises, '3', '1');
      const result = updateExerciseOrderIndices(reordered);
      
      expect(result[0].order_index).toBe(0);
      expect(result[1].order_index).toBe(1);
      expect(result[2].order_index).toBe(2);
    });
  });

  describe('validateExerciseData', () => {
    it('should validate sets within range', () => {
      expect(validateExerciseData({ sets_default: 3 })).toBe(true);
      expect(validateExerciseData({ sets_default: 0 })).toBe(false);
      expect(validateExerciseData({ sets_default: 11 })).toBe(false);
    });

    it('should validate reps within range', () => {
      expect(validateExerciseData({ reps_default: 8 })).toBe(true);
      expect(validateExerciseData({ reps_default: 0 })).toBe(false);
      expect(validateExerciseData({ reps_default: 51 })).toBe(false);
    });

    it('should validate superset group format', () => {
      expect(validateExerciseData({ superset_group: 'A' })).toBe(true);
      expect(validateExerciseData({ superset_group: 'B' })).toBe(true);
      expect(validateExerciseData({ superset_group: null })).toBe(true);
      expect(validateExerciseData({ superset_group: 'a' })).toBe(false);
      expect(validateExerciseData({ superset_group: 'AB' })).toBe(false);
      expect(validateExerciseData({ superset_group: '1' })).toBe(false);
    });
  });

  describe('filterAvailableExercises', () => {
    it('should filter out excluded exercises', () => {
      const result = filterAvailableExercises(mockExerciseLibrary, ['ex1']);
      expect(result).toHaveLength(2);
      expect(result.find(ex => ex.id === 'ex1')).toBeUndefined();
    });

    it('should filter by search query', () => {
      const result = filterAvailableExercises(mockExerciseLibrary, [], 'push');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Push-ups');
    });

    it('should filter by muscle group', () => {
      const result = filterAvailableExercises(mockExerciseLibrary, [], '', 'Chest');
      expect(result).toHaveLength(1);
      expect(result[0].muscle_group).toBe('Chest');
    });

    it('should combine all filters', () => {
      const result = filterAvailableExercises(mockExerciseLibrary, ['ex3'], 'up', 'Back');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Pull-ups');
    });
  });
});