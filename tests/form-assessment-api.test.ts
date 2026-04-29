import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Next.js
vi.mock('next/request', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
    json = vi.fn();
  }
}));

vi.mock('next/response', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({ data, init })),
  }
}));

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
  in: vi.fn(() => mockSupabase),
  upsert: vi.fn(() => mockSupabase),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

describe('Form Assessment API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/coach/form-assessment', () => {
    it('should return 400 if clientId is missing', async () => {
      const { GET } = await import('@/app/api/coach/form-assessment/route');
      
      const request = {
        url: 'http://localhost/api/coach/form-assessment',
      } as any;

      const response = await GET(request);
      
      expect(response.init.status).toBe(400);
      expect(response.data.error).toBe('clientId is required');
    });

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const { GET } = await import('@/app/api/coach/form-assessment/route');
      
      const request = {
        url: 'http://localhost/api/coach/form-assessment?clientId=123',
      } as any;

      const response = await GET(request);
      
      expect(response.init.status).toBe(401);
      expect(response.data.error).toBe('Unauthorized');
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

      const { GET } = await import('@/app/api/coach/form-assessment/route');
      
      const request = {
        url: 'http://localhost/api/coach/form-assessment?clientId=client-123',
      } as any;

      const response = await GET(request);
      
      expect(response.init.status).toBe(403);
      expect(response.data.error).toBe('Unauthorized');
    });

    it('should return exercises with assessments for valid coach', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'coach-123' } },
        error: null,
      });
      
      // Mock profile check
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: 'coach' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'client-123' }, error: null })
        .mockResolvedValueOnce({ data: { program_id: 'program-1' }, error: null });

      // Mock exercises data
      mockSupabase.select.mockImplementation((fields) => {
        if (fields.includes('exercise_id')) {
          return {
            in: () => ({
              data: [
                { exercise_id: 'ex-1', exercises: { id: 'ex-1', name: 'Squat', muscle_group: 'Legs' } },
                { exercise_id: 'ex-2', exercises: { id: 'ex-2', name: 'Bench Press', muscle_group: 'Chest' } }
              ],
              error: null
            })
          };
        }
        return mockSupabase;
      });

      // Mock assessments
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          { exercise_id: 'ex-1', status: 'locked_in', private_notes: 'Good form' }
        ],
        error: null
      });

      const { GET } = await import('@/app/api/coach/form-assessment/route');
      
      const request = {
        url: 'http://localhost/api/coach/form-assessment?clientId=client-123',
      } as any;

      const response = await GET(request);
      
      expect(response.data.exercises).toBeDefined();
      expect(response.data.exercises).toHaveLength(2);
      expect(response.data.exercises[0].assessment).toEqual({
        exercise_id: 'ex-1', 
        status: 'locked_in', 
        private_notes: 'Good form'
      });
    });
  });

  describe('POST /api/coach/form-assessment', () => {
    it('should return 400 if required fields are missing', async () => {
      const { POST } = await import('@/app/api/coach/form-assessment/route');
      
      const request = {
        json: vi.fn().mockResolvedValue({ clientId: 'client-123' }),
      } as any;

      const response = await POST(request);
      
      expect(response.init.status).toBe(400);
      expect(response.data.error).toBe('Missing required fields');
    });

    it('should return 400 for invalid status', async () => {
      const { POST } = await import('@/app/api/coach/form-assessment/route');
      
      const request = {
        json: vi.fn().mockResolvedValue({
          clientId: 'client-123',
          exerciseId: 'ex-1',
          status: 'invalid_status',
        }),
      } as any;

      const response = await POST(request);
      
      expect(response.init.status).toBe(400);
      expect(response.data.error).toBe('Invalid status');
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

      const { POST } = await import('@/app/api/coach/form-assessment/route');
      
      const request = {
        json: vi.fn().mockResolvedValue({
          clientId: 'client-123',
          exerciseId: 'ex-1',
          status: 'locked_in',
          privateNotes: 'Great progress!',
        }),
      } as any;

      const response = await POST(request);
      
      expect(response.data.assessment).toBeDefined();
      expect(response.data.assessment.status).toBe('locked_in');
      expect(response.data.assessment.private_notes).toBe('Great progress!');
    });

    it('should validate that exercise exists', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'coach-123' } },
        error: null,
      });
      
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: 'coach' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'client-123' }, error: null })
        .mockResolvedValueOnce({ data: null, error: null }); // Exercise not found

      const { POST } = await import('@/app/api/coach/form-assessment/route');
      
      const request = {
        json: vi.fn().mockResolvedValue({
          clientId: 'client-123',
          exerciseId: 'nonexistent',
          status: 'locked_in',
        }),
      } as any;

      const response = await POST(request);
      
      expect(response.init.status).toBe(404);
      expect(response.data.error).toBe('Exercise not found');
    });
  });
});