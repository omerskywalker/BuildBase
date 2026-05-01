import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "@/app/api/admin/users/route";
import { NextRequest } from "next/server";

// Mock Supabase
const mockUser = { id: "admin-user-id" };
const mockProfile = { id: "admin-user-id", role: "admin" };
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: vi.fn(() => ({
    select: mockSelect,
    update: mockUpdate,
  })),
};

mockSelect.mockReturnValue({
  eq: mockEq,
  order: mockOrder,
});

mockEq.mockReturnValue({
  single: mockSingle,
});

mockUpdate.mockReturnValue({
  eq: mockEq,
});

mockEq.mockReturnValue({
  select: mockSelect,
});

mockSelect.mockReturnValue({
  single: mockSingle,
});

// Mock the server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Admin Users API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/users", () => {
    it("should return users for admin role", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      mockOrder.mockResolvedValue({
        data: [
          {
            id: "user1",
            email: "user1@example.com",
            full_name: "User One",
            role: "user",
            coach: null,
          },
        ],
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(mockGetUser).toHaveBeenCalled();
    });

    it("should return 401 for unauthenticated user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 for non-admin user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockSingle.mockResolvedValue({ data: { role: "user" }, error: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });

  describe("PUT /api/admin/users", () => {
    it("should update user for admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      mockSingle.mockResolvedValue({
        data: { id: "user1", role: "coach" },
        error: null,
      });

      const request = new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "user1",
          role: "coach",
          template_tier: "default",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("user1");
      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    });

    it("should return 400 for missing user ID", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });

      const request = new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "coach" }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("User ID is required");
    });
  });

  describe("DELETE /api/admin/users", () => {
    it("should deactivate user for admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      mockUpdate.mockResolvedValue({ error: null });

      const request = new Request("http://localhost", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "user1" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should prevent self-deletion", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });

      const request = new Request("http://localhost", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "admin-user-id" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Cannot delete your own account");
    });

    it("should return 400 for missing user ID", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });

      const request = new Request("http://localhost", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("User ID is required");
    });
  });
});