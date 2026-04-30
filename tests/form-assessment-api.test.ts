import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/coach/form-assessment/route';

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  in: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

describe('Form Assessment API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.in.mockReturnThis();
    mockSupabase.upsert.mockReturnThis();
  });

  describe('GET /api/coach/form-assessment', () => {
    it('should return 400 if clientId is missing', async () => {
      const request = new NextRequest('http://localhost/api/coach/form-assessment');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('clientId is required');
    });

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/coach/form-assessment?clientId=123');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not a coach or admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'coach-123' } },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/coach/form-assessment?clientId=client-123');
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return exercises with assessments for valid coach', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'coach-123' } },
        error: null,
      });

      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: 'coach' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'client-123' }, error: null })
        .mockResolvedValueOnce({ data: { program_id: 'program-1' }, error: null });

      let lastTable = '';
      mockSupabase.from.mockImplementation((table: string) => {
        lastTable = table;
        return mockSupabase;
      });
      mockSupabase.select.mockImplementation((fields?: string) => {
        if (lastTable === 'template_exercises') {
          return {
            in: () => ({
              data: [
                { exercise_id: 'ex-1', exercises: { id: 'ex-1', name: 'Squat', muscle_group: 'Legs' } },
                { exercise_id: 'ex-2', exercises: { id: 'ex-2', name: 'Bench Press', muscle_group: 'Chest' } },
              ],
              error: null,
            }),
          };
        }
        if (lastTable === 'coach_form_assessments') {
          return {
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    { exercise_id: 'ex-1', status: 'locked_in', private_notes: 'Good form' },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return mockSupabase;
      });

      const request = new NextRequest('http://localhost/api/coach/form-assessment?clientId=client-123');
      const response = await GET(request);
      const data = await response.json();

      expect(data.exercises).toBeDefined();
      expect(data.exercises).toHaveLength(2);
      const squat = data.exercises.find((e: any) => e.name === 'Squat');
      expect(squat).toBeDefined();
      expect(squat.assessment).toEqual({
        exercise_id: 'ex-1',
        status: 'locked_in',
        private_notes: 'Good form',
      });
    });
  });

  describe('POST /api/coach/form-assessment', () => {
    it('should return 400 if required fields are missing', async () => {
      const request = new NextRequest('http://localhost/api/coach/form-assessment', {
        method: 'POST',
        body: JSON.stringify({ clientId: 'client-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 for invalid status', async () => {
      const request = new NextRequest('http://localhost/api/coach/form-assessment', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-123',
          exerciseId: 'ex-1',
          status: 'invalid_status',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid status');
    });

    it('should successfully create assessment for valid data', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'coach-123' } },
        error: null,
      });

      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: 'coach' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'client-123' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'ex-1' }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 'assessment-1',
            coach_id: 'coach-123',
            user_id: 'client-123',
            exercise_id: 'ex-1',
            status: 'locked_in',
            private_notes: 'Great progress!',
          },
          error: null,
        });

      const request = new NextRequest('http://localhost/api/coach/form-assessment', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-123',
          exerciseId: 'ex-1',
          status: 'locked_in',
          privateNotes: 'Great progress!',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.assessment).toBeDefined();
      expect(data.assessment.status).toBe('locked_in');
      expect(data.assessment.private_notes).toBe('Great progress!');
    });

    it('should validate that exercise exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'coach-123' } },
        error: null,
      });

      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: 'coach' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'client-123' }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const request = new NextRequest('http://localhost/api/coach/form-assessment', {
        method: 'POST',
        body: JSON.stringify({
          clientId: 'client-123',
          exerciseId: 'nonexistent',
          status: 'locked_in',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Exercise not found');
    });
  });
});
