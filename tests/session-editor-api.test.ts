import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as reorderPOST } from '@/app/api/admin/programs/[programId]/session-editor/reorder/route';
import { DELETE, PATCH } from '@/app/api/admin/programs/[programId]/session-editor/exercises/[exerciseId]/route';
import { POST as addExercisePOST } from '@/app/api/admin/programs/[programId]/session-editor/exercises/route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockTemplateExercise,
              error: null
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: mockTemplateExercise,
            error: null
          }))
        }))
      })),
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: mockExercise,
            error: null
          }))
        }))
      }))
    }))
  }))
}));

vi.mock('@/lib/rbac', () => ({
  requireRole: vi.fn(() => Promise.resolve())
}));

const mockExercise = {
  id: 'exercise-1',
  name: 'Push-ups',
  muscle_group: 'Chest',
  equipment: 'Bodyweight',
  instructions: 'Standard push-up',
  is_active: true
};

const mockTemplateExercise = {
  id: 'template-exercise-1',
  workout_template_id: 'session-1',
  exercise_id: 'exercise-1',
  order_index: 0,
  sets_default: 3,
  reps_default: 8,
  exercise: mockExercise
};

describe('Session Editor API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/programs/[programId]/session-editor/reorder', () => {
    it('should reorder exercises successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-1/session-editor/reorder', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'session-1',
          exercises: [
            { id: 'exercise-1', order_index: 1 },
            { id: 'exercise-2', order_index: 0 }
          ]
        })
      });

      const params = Promise.resolve({ programId: 'program-1' });
      const response = await reorderPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-1/session-editor/reorder', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'session-1'
          // missing exercises array
        })
      });

      const params = Promise.resolve({ programId: 'program-1' });
      const response = await reorderPOST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });

  describe('PATCH /api/admin/programs/[programId]/session-editor/exercises/[exerciseId]', () => {
    it('should update exercise successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-1/session-editor/exercises/exercise-1', {
        method: 'PATCH',
        body: JSON.stringify({
          sets_default: 4,
          reps_default: 10,
          superset_group: 'A'
        })
      });

      const params = Promise.resolve({ programId: 'program-1', exerciseId: 'exercise-1' });
      const response = await PATCH(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templateExercise).toBeDefined();
    });
  });

  describe('DELETE /api/admin/programs/[programId]/session-editor/exercises/[exerciseId]', () => {
    it('should delete exercise successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs/program-1/session-editor/exercises/exercise-1', {
        method: 'DELETE'
      });

      const params = Promise.resolve({ programId: 'program-1', exerciseId: 'exercise-1' });
      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});