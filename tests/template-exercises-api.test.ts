import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ 
      json: async () => data, 
      status: options?.status || 200,
      ok: (options?.status || 200) < 400
    })),
  },
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Import after mocking
import { GET, PUT } from '@/app/api/admin/exercises/template-exercises/route';

describe('/api/admin/exercises/template-exercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/exercises/template-exercises', () => {
    it('should return unauthorized for unauthenticated requests', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request('http://localhost/api/admin/exercises/template-exercises');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return forbidden for non-admin users', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } }
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { role: 'user' }
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const request = new Request('http://localhost/api/admin/exercises/template-exercises');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return template exercises for admin users', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } }
      });

      // Mock profile check
      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' }
        })
      };

      // Mock template exercises query
      const templateExercisesQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'template-exercise-1',
              exercise_id: 'exercise-1',
              workout_template_id: 'workout-1',
              sets_default: 3,
              reps_default: 10,
              weight_default_f: 95,
              weight_default_m: 135,
              exercise: {
                id: 'exercise-1',
                name: 'Squat',
                muscle_group: 'Legs'
              }
            }
          ],
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? profileQuery : templateExercisesQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises/template-exercises');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].exercise.name).toBe('Squat');
    });

    it('should filter by exercise_id parameter', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } }
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' }
        })
      };

      const templateExercisesQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? profileQuery : templateExercisesQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises/template-exercises?exercise_id=exercise-123');
      await GET(request);

      expect(templateExercisesQuery.eq).toHaveBeenCalledWith('exercise_id', 'exercise-123');
    });

    it('should filter by workout_template_id parameter', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } }
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' }
        })
      };

      const templateExercisesQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? profileQuery : templateExercisesQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises/template-exercises?workout_template_id=workout-456');
      await GET(request);

      expect(templateExercisesQuery.eq).toHaveBeenCalledWith('workout_template_id', 'workout-456');
    });
  });

  describe('PUT /api/admin/exercises/template-exercises', () => {
    it('should update template exercise weights and settings', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } }
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' }
        })
      };

      // Mock fetching template exercise data for versioning
      const fetchQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            workout_template_id: 'workout-1',
            workout_template: {
              phase_id: 'phase-1',
              phase: {
                program_id: 'program-1'
              }
            }
          },
          error: null
        })
      };

      // Mock program version update
      const programVersionQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { version: 1 },
          error: null
        })
      };

      const programUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      };

      // Mock template exercise update
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'template-exercise-1',
            sets_default: 4,
            reps_default: 8,
            weight_default_f: 105,
            weight_default_m: 145,
            exercise: {
              id: 'exercise-1',
              name: 'Squat'
            }
          },
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileQuery;
        if (callCount === 2) return fetchQuery;
        if (callCount === 3) return programVersionQuery;
        if (callCount === 4) return programUpdateQuery;
        return updateQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises/template-exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'template-exercise-1',
          sets_default: 4,
          reps_default: 8,
          weight_default_f: 105,
          weight_default_m: 145,
          is_bodyweight: false,
          superset_group: 'A1',
          coaching_cues: 'Keep chest up',
          notes: 'Focus on depth'
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sets_default).toBe(4);
      expect(data.reps_default).toBe(8);
      expect(data.weight_default_f).toBe(105);
      expect(data.weight_default_m).toBe(145);
      
      // Verify that program versioning was triggered
      expect(programUpdateQuery.update).toHaveBeenCalledWith({ version: 2 });
      
      // Verify template exercise update
      expect(updateQuery.update).toHaveBeenCalledWith({
        sets_default: 4,
        reps_default: 8,
        weight_default_f: 105,
        weight_default_m: 145,
        is_bodyweight: false,
        superset_group: 'A1',
        coaching_cues: 'Keep chest up',
        notes: 'Focus on depth'
      });
    });

    it('should require template exercise ID', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } }
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' }
        })
      };

      mockSupabaseClient.from.mockReturnValue(profileQuery);

      const request = new Request('http://localhost/api/admin/exercises/template-exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sets_default: 3
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Template exercise ID is required');
    });

    it('should handle template exercise not found', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } }
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' }
        })
      };

      // Mock template exercise not found
      const fetchQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? profileQuery : fetchQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises/template-exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'non-existent-id',
          sets_default: 3
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Template exercise not found');
    });

    it('should handle bodyweight exercises correctly', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } }
      });

      const profileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' }
        })
      };

      const fetchQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            workout_template_id: 'workout-1',
            workout_template: {
              phase_id: 'phase-1',
              phase: {
                program_id: 'program-1'
              }
            }
          },
          error: null
        })
      };

      const programVersionQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { version: 1 },
          error: null
        })
      };

      const programUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      };

      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'template-exercise-1',
            is_bodyweight: true,
            weight_default_f: 0,
            weight_default_m: 0,
            exercise: {
              id: 'exercise-1',
              name: 'Push-ups'
            }
          },
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileQuery;
        if (callCount === 2) return fetchQuery;
        if (callCount === 3) return programVersionQuery;
        if (callCount === 4) return programUpdateQuery;
        return updateQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises/template-exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'template-exercise-1',
          is_bodyweight: true,
          weight_default_f: 0,
          weight_default_m: 0
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.is_bodyweight).toBe(true);
      expect(data.weight_default_f).toBe(0);
      expect(data.weight_default_m).toBe(0);
    });
  });
});