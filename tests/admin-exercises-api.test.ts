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
import { GET, POST, PUT, DELETE } from '@/app/api/admin/exercises/route';
import { NextResponse } from 'next/server';

describe('/api/admin/exercises', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/exercises', () => {
    it('should return unauthorized for unauthenticated requests', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request('http://localhost/api/admin/exercises');
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

      const request = new Request('http://localhost/api/admin/exercises');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return exercises for admin users', async () => {
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

      // Mock exercises query
      const exercisesQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'exercise-1',
              name: 'Squat',
              muscle_group: 'Legs',
              equipment: 'Barbell',
              is_active: true
            }
          ],
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? profileQuery : exercisesQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].name).toBe('Squat');
    });

    it('should apply search filters', async () => {
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

      const exercisesQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? profileQuery : exercisesQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises?search=squat&muscle_group=Legs&is_active=true');
      await GET(request);

      expect(exercisesQuery.ilike).toHaveBeenCalledWith('name', '%squat%');
      expect(exercisesQuery.eq).toHaveBeenCalledWith('muscle_group', 'Legs');
      expect(exercisesQuery.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('POST /api/admin/exercises', () => {
    it('should create a new exercise', async () => {
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

      // Mock existing exercise check (none found)
      const existingQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };

      // Mock insert query
      const insertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'new-exercise-id',
            name: 'Deadlift',
            muscle_group: 'Back',
            equipment: 'Barbell',
            is_active: true
          },
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileQuery;
        if (callCount === 2) return existingQuery;
        return insertQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Deadlift',
          muscle_group: 'Back',
          equipment: 'Barbell'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Deadlift');
      expect(insertQuery.insert).toHaveBeenCalledWith({
        name: 'Deadlift',
        muscle_group: 'Back',
        equipment: 'Barbell',
        instructions: null,
        coaching_cues: null,
        video_url: null,
        created_by: 'admin-id',
        is_active: true
      });
    });

    it('should reject exercise with duplicate name', async () => {
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

      // Mock existing exercise found
      const existingQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'existing-id' },
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? profileQuery : existingQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Existing Exercise'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Exercise with this name already exists');
    });

    it('should require exercise name', async () => {
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

      const request = new Request('http://localhost/api/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          muscle_group: 'Back'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Exercise name is required');
    });
  });

  describe('PUT /api/admin/exercises', () => {
    it('should update an existing exercise', async () => {
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

      // Mock name uniqueness check (none found)
      const uniqueQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      };

      // Mock update query
      const updateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'exercise-id',
            name: 'Updated Exercise',
            muscle_group: 'Updated Group',
            is_active: false
          },
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileQuery;
        if (callCount === 2) return uniqueQuery;
        return updateQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'exercise-id',
          name: 'Updated Exercise',
          muscle_group: 'Updated Group',
          is_active: false
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Exercise');
      expect(updateQuery.update).toHaveBeenCalledWith({
        name: 'Updated Exercise',
        muscle_group: 'Updated Group',
        equipment: null,
        instructions: null,
        coaching_cues: null,
        video_url: null,
        is_active: false
      });
    });

    it('should require exercise ID', async () => {
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

      const request = new Request('http://localhost/api/admin/exercises', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Exercise Name'
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Exercise ID is required');
    });
  });

  describe('DELETE /api/admin/exercises', () => {
    it('should soft delete exercise used in templates', async () => {
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

      // Mock usage check (exercise is used)
      const usageQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'template-exercise-id' }],
          error: null
        })
      };

      // Mock soft delete
      const softDeleteQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileQuery;
        if (callCount === 2) return usageQuery;
        return softDeleteQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'exercise-id'
        })
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Exercise deactivated (still used in templates)');
      expect(softDeleteQuery.update).toHaveBeenCalledWith({ is_active: false });
    });

    it('should hard delete unused exercise', async () => {
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

      // Mock usage check (exercise not used)
      const usageQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      // Mock hard delete
      const hardDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      };

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileQuery;
        if (callCount === 2) return usageQuery;
        return hardDeleteQuery;
      });

      const request = new Request('http://localhost/api/admin/exercises', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'exercise-id'
        })
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Exercise deleted');
      expect(hardDeleteQuery.delete).toHaveBeenCalled();
    });

    it('should require exercise ID', async () => {
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

      const request = new Request('http://localhost/api/admin/exercises', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Exercise ID is required');
    });
  });
});