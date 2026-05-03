import { describe, test, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the supabase client
const mockSupabaseClient: any = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            not: vi.fn(() => ({
              eq: vi.fn()
            }))
          }))
        }))
      }))
    }))
  }))
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient))
}));

describe('Chart API endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Charts data API (/api/progress/charts)', () => {
    test('returns unauthorized when no user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const { GET } = await import('@/app/api/progress/charts/route');
      
      const request = new NextRequest('http://localhost:3000/api/progress/charts?exerciseId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns bad request when exerciseId is missing', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user1' } }
      });

      const { GET } = await import('@/app/api/progress/charts/route');
      
      const request = new NextRequest('http://localhost:3000/api/progress/charts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Exercise ID is required');
    });

    test('allows user to access their own data', async () => {
      const userId = 'user1';
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } }
      });

      // Mock profile query
      const profileQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'user', coach_id: null }
            }))
          }))
        }))
      };
      
      // Mock chart data query
      const chartDataQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                not: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [
                      {
                        weight_used: 135,
                        logged_at: '2024-01-01T10:00:00Z',
                        session_logs: {
                          week_number: 1,
                          workout_templates: {
                            title: 'Session A',
                            day_label: 'A'
                          }
                        }
                      }
                    ],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      };

      mockSupabaseClient.from
        .mockImplementationOnce(() => profileQuery)
        .mockImplementationOnce(() => chartDataQuery);

      const { GET } = await import('@/app/api/progress/charts/route');
      
      const request = new NextRequest(`http://localhost:3000/api/progress/charts?exerciseId=1&userId=${userId}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        weight: 135,
        sessionName: 'Week 1 - Session A'
      });
    });
  });

  describe('Exercises API (/api/progress/exercises)', () => {
    test('returns unauthorized when no user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const { GET } = await import('@/app/api/progress/exercises/route');
      
      const request = new NextRequest('http://localhost:3000/api/progress/exercises');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('returns exercises with logged sets for user', async () => {
      const userId = 'user1';
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } }
      });

      // Mock profile query
      const profileQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { role: 'user', coach_id: null }
            }))
          }))
        }))
      };

      // Mock exercises query
      const exercisesQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              not: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({
                  data: [
                    {
                      id: 'ex1',
                      name: 'Bench Press',
                      muscle_group: 'Chest'
                    },
                    {
                      id: 'ex2', 
                      name: 'Squat',
                      muscle_group: 'Legs'
                    }
                  ],
                  error: null
                }))
              }))
            }))
          }))
        }))
      };

      mockSupabaseClient.from
        .mockImplementationOnce(() => profileQuery)
        .mockImplementationOnce(() => exercisesQuery);

      const { GET } = await import('@/app/api/progress/exercises/route');
      
      const request = new NextRequest('http://localhost:3000/api/progress/exercises');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.exercises).toHaveLength(2);
      expect(data.exercises[0]).toMatchObject({
        id: 'ex1',
        name: 'Bench Press',
        muscle_group: 'Chest'
      });
    });
  });
});