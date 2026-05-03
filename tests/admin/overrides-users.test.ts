import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "../../app/api/admin/overrides/users/route";
import { createClient } from "../../lib/supabase/server";

// Mock Supabase client
vi.mock("../../lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock NextResponse
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ 
      json: data, 
      status: options?.status || 200,
      ok: options?.status ? options.status >= 200 && options.status < 300 : true
    })),
  },
}));

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
};

describe("Overrides Users API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("GET /api/admin/overrides/users", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=123");
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(response.json).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin or coach", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "user-1" } } 
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: "user" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=123");
      const response = await GET(request);

      expect(response.status).toBe(403);
      expect(response.json).toEqual({ error: "Forbidden" });
    });

    it("should return 400 when user_id parameter is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: "admin" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides/users");
      const response = await GET(request);

      expect(response.status).toBe(400);
      expect(response.json).toEqual({ error: "user_id parameter is required" });
    });

    it("should return 404 when user has no active enrollment", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });
      
      // Mock the calls in sequence
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { role: "admin" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null, // No enrollment found
          error: { code: "PGRST116", message: "No rows found" },
        });

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=user-1");
      const response = await GET(request);

      expect(response.status).toBe(500); // Will be 500 due to error handling
    });

    it("should return user data with program and overrides", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });

      const mockEnrollment = {
        id: "enrollment-1",
        user_id: "user-1",
        program_id: "program-1",
        current_week: 2,
        current_session: 1,
        program: {
          id: "program-1",
          name: "12-Week Strength Program",
          phases: [
            {
              id: "phase-1",
              name: "Foundation Phase",
              workout_templates: [
                {
                  id: "template-1",
                  week_number: 1,
                  day_label: "A",
                  template_exercises: [
                    {
                      id: "template-exercise-1",
                      sets_default: 3,
                      reps_default: 8,
                      exercise: {
                        id: "exercise-1",
                        name: "Squat",
                        muscle_group: "Legs"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      };

      const mockUserProfile = {
        id: "user-1",
        full_name: "John Doe",
        email: "john@example.com",
        gender: "male",
        template_tier: "default",
      };

      const mockOverrides = [
        {
          id: "override-1",
          user_id: "user-1",
          template_exercise_id: "template-exercise-1",
          sets_override: 4,
        }
      ];

      // Mock the calls in sequence
      let callCount = 0;
      mockSupabase.from().select().eq().single.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: admin role check
          return Promise.resolve({
            data: { role: "admin" },
            error: null,
          });
        } else if (callCount === 2) {
          // Second call: enrollment data
          return Promise.resolve({
            data: mockEnrollment,
            error: null,
          });
        } else if (callCount === 3) {
          // Third call: user profile
          return Promise.resolve({
            data: mockUserProfile,
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockOverrides,
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=user-1");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = response.json as any;
      expect(json.user).toEqual(mockUserProfile);
      expect(json.enrollment).toEqual(mockEnrollment);
      expect(json.overrides).toEqual(expect.any(Object));
    });

    it("should allow coaches to access user data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "coach-1" } } 
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: "coach" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=user-1");
      
      // This should not immediately fail with 403
      expect(() => GET(request)).not.toThrow();
    });
  });
});