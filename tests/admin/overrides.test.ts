import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "../../app/api/admin/overrides/route";

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

describe("Overrides API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
  });

  describe("GET /api/admin/overrides", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request("http://localhost/api/admin/overrides?user_id=123");
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

      const request = new Request("http://localhost/api/admin/overrides?user_id=123");
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

      const request = new Request("http://localhost/api/admin/overrides");
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("should return overrides for valid admin user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "admin" },
        error: null,
      });

      const mockOverrides = [
        {
          id: "override-1",
          user_id: "user-1",
          template_exercise_id: "exercise-1",
          sets_override: 4,
          reps_override: 10,
          weight_override: 25.0,
        },
      ];

      mockSupabase.order.mockResolvedValueOnce({
        data: mockOverrides,
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides?user_id=user-1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockOverrides);
    });
  });

  describe("POST /api/admin/overrides", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "POST",
        body: JSON.stringify({
          user_id: "user-1",
          template_exercise_id: "exercise-1",
          sets_override: 4,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should return 400 when required fields are missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "admin" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "POST",
        body: JSON.stringify({ user_id: "user-1" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("user_id and template_exercise_id are required");
    });

    it("should create new override successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });

      const newOverride = {
        id: "override-1",
        user_id: "user-1",
        template_exercise_id: "exercise-1",
        sets_override: 4,
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: newOverride, error: null });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "POST",
        body: JSON.stringify({
          user_id: "user-1",
          template_exercise_id: "exercise-1",
          sets_override: 4,
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(newOverride);
    });

    it("should update existing override", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });

      const updatedOverride = {
        id: "existing-override-1",
        user_id: "user-1",
        template_exercise_id: "exercise-1",
        sets_override: 5,
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: { id: "existing-override-1" }, error: null })
        .mockResolvedValueOnce({ data: updatedOverride, error: null });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "POST",
        body: JSON.stringify({
          user_id: "user-1",
          template_exercise_id: "exercise-1",
          sets_override: 5,
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedOverride);
    });
  });

  describe("DELETE /api/admin/overrides", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "DELETE",
        body: JSON.stringify({ id: "override-1" }),
      });
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it("should return 400 when id is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "admin" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "DELETE",
        body: JSON.stringify({}),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Override ID is required");
    });

    it("should delete override successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "admin" },
        error: null,
      });
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase) // from().select().eq() for profile
        .mockReturnValueOnce(mockSupabase) // .single() for profile (already handled)
        .mockResolvedValueOnce({ error: null }); // from().delete().eq() terminal

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "DELETE",
        body: JSON.stringify({ id: "override-1" }),
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
