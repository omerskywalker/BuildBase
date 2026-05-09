import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/admin/users/route";

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  order: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

describe("Admin Users API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
  });

  describe("GET /api/admin/users", () => {
    it("should return users for admin role", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null });
      mockSupabase.order.mockResolvedValueOnce({
        data: [{ id: "u1", email: "u1@test.com", role: "user" }],
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].id).toBe("u1");
    });

    it("should return 401 for unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("should return 403 for non-admin user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "user" }, error: null });

      const response = await GET();
      expect(response.status).toBe(403);
    });
  });

  describe("PUT /api/admin/users", () => {
    it("should update user for admin", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: { id: "u1", role: "coach" }, error: null });

      const request = new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "u1", role: "coach" }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("u1");
    });

    it("should return 400 for missing user ID", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null });

      const request = new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "coach" }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/admin/users", () => {
    it("should deactivate user for admin", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null });
      // 1st eq: select chain → returns this (default mockReturnThis)
      // 2nd eq: update chain → resolves with result
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ error: null });

      const request = new Request("http://localhost", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "u1" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should prevent self-deletion", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null });

      const request = new Request("http://localhost", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "admin-1" }),
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Cannot delete your own account");
    });

    it("should return 400 for missing user ID", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null });

      const request = new Request("http://localhost", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const response = await DELETE(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("User ID is required");
    });
  });
});
