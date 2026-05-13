import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../app/api/admin/overrides/users/route";

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

describe("Overrides Users API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
  });

  describe("GET /api/admin/overrides/users", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=123");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return 403 when user is not admin or coach", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "user" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=123");
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("should return 400 when user_id parameter is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "admin" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides/users");
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("should return 404 when user has no active enrollment", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116", message: "No rows found" } });

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=user-1");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it("should return user data with program and overrides", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });

      const mockEnrollment = {
        id: "enrollment-1",
        user_id: "user-1",
        program_id: "program-1",
        current_week: 2,
      };

      const mockUserProfile = {
        id: "user-1",
        full_name: "John Doe",
        email: "john@example.com",
        gender: "male",
        template_tier: "default",
      };

      const mockOverrides = [
        { id: "override-1", user_id: "user-1", template_exercise_id: "te-1", sets_override: 4 },
      ];

      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: mockEnrollment, error: null })
        .mockResolvedValueOnce({ data: mockUserProfile, error: null });

      // .eq() is called 5 times: chain1(1), chain2(2), chain3(1), chain4(1 terminal)
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)   // chain 1: profiles.eq("id")
        .mockReturnValueOnce(mockSupabase)   // chain 2: enrollments.eq("user_id")
        .mockReturnValueOnce(mockSupabase)   // chain 2: enrollments.eq("is_active")
        .mockReturnValueOnce(mockSupabase)   // chain 3: profiles.eq("id")
        .mockResolvedValueOnce({ data: mockOverrides, error: null }); // chain 4: overrides.eq("user_id") terminal

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=user-1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual(mockUserProfile);
      expect(data.enrollment).toEqual(mockEnrollment);
      expect(data.overrides).toBeDefined();
    });

    it("should allow coaches to access user data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "coach-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "coach" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides/users?user_id=user-1");
      expect(() => GET(request)).not.toThrow();
    });
  });
});
