import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Track RPC calls for assertion
const mockRpc = vi.fn(() => Promise.resolve({ data: null, error: null }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}));

vi.mock('@/lib/rbac', () => ({
  requireRole: vi.fn(() => Promise.resolve()),
}));

// Import after mocks are defined
import { POST } from '@/app/api/admin/programs/[programId]/session-editor/reorder/route';

describe('Exercise Reorder API — Transaction Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call reorder_exercises RPC with correct payload', async () => {
    const exercises = [
      { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', order_index: 1 },
      { id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', order_index: 0 },
    ];

    const request = new NextRequest(
      'http://localhost:3000/api/admin/programs/program-1/session-editor/reorder',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          exercises,
        }),
      }
    );

    const params = Promise.resolve({ programId: 'program-1' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify RPC was called instead of individual updates
    expect(mockRpc).toHaveBeenCalledOnce();
    expect(mockRpc).toHaveBeenCalledWith('reorder_exercises', {
      exercise_orders: exercises,
    });
  });

  it('should return 400 for missing exercises array', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/programs/program-1/session-editor/reorder',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          // missing exercises
        }),
      }
    );

    const params = Promise.resolve({ programId: 'program-1' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for empty exercises array', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/programs/program-1/session-editor/reorder',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          exercises: [],
        }),
      }
    );

    const params = Promise.resolve({ programId: 'program-1' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid exercise ID format', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/programs/program-1/session-editor/reorder',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          exercises: [{ id: 'not-a-uuid', order_index: 0 }],
        }),
      }
    );

    const params = Promise.resolve({ programId: 'program-1' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 400 for negative order_index', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/programs/program-1/session-editor/reorder',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          exercises: [
            { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', order_index: -1 },
          ],
        }),
      }
    );

    const params = Promise.resolve({ programId: 'program-1' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('should return 500 when RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'database connection lost', code: '08006' } as never,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/admin/programs/program-1/session-editor/reorder',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          exercises: [
            { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', order_index: 0 },
          ],
        }),
      }
    );

    const params = Promise.resolve({ programId: 'program-1' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to reorder exercises');
  });

  it('should handle a large batch of exercises', async () => {
    const exercises = Array.from({ length: 50 }, (_, i) => ({
      id: `${i.toString().padStart(8, '0')}-0000-4000-8000-000000000000`,
      order_index: i,
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/programs/program-1/session-editor/reorder',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          exercises,
        }),
      }
    );

    const params = Promise.resolve({ programId: 'program-1' });
    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledOnce();
  });
});
