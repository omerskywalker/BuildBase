import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/notifications/route";
import { PATCH as PATCH_SINGLE } from "@/app/api/notifications/[id]/route";

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

describe("Notifications API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain methods
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.is.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
  });

  describe("GET /api/notifications", () => {
    it("should return 401 if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return notifications for authenticated user", async () => {
      const mockUser = { id: "user-1" };
      const mockNotifications = [
        {
          id: "n-1",
          user_id: "user-1",
          type: "coach_note",
          title: "New Note",
          message: "Your coach left you a note",
          link: "/coach-notes",
          read_at: null,
          created_at: "2025-01-01T00:00:00Z",
        },
        {
          id: "n-2",
          user_id: "user-1",
          type: "milestone",
          title: "PR Achieved!",
          message: "You hit a new personal record on Bench Press",
          link: "/progress/milestones",
          read_at: "2025-01-01T01:00:00Z",
          created_at: "2025-01-01T00:00:00Z",
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      mockSupabase.limit.mockResolvedValue({
        data: mockNotifications,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockNotifications);
      expect(data).toHaveLength(2);
    });

    it("should return empty array when no notifications", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("should return 500 on database error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockSupabase.limit.mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch notifications");
    });
  });

  describe("PATCH /api/notifications (mark all read)", () => {
    it("should return 401 if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const response = await PATCH();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should mark all notifications as read", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockSupabase.is.mockResolvedValue({ error: null });

      const response = await PATCH();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return 500 on database error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockSupabase.is.mockResolvedValue({
        error: { message: "DB error" },
      });

      const response = await PATCH();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to mark notifications as read");
    });
  });

  describe("PATCH /api/notifications/[id] (mark single read)", () => {
    it("should return 401 if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new NextRequest(
        "http://localhost/api/notifications/n-1",
        { method: "PATCH" },
      );

      const response = await PATCH_SINGLE(request, {
        params: Promise.resolve({ id: "n-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should mark a single notification as read", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: { id: "n-1" },
        error: null,
      });

      const request = new NextRequest(
        "http://localhost/api/notifications/n-1",
        { method: "PATCH" },
      );

      const response = await PATCH_SINGLE(request, {
        params: Promise.resolve({ id: "n-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should return 404 if notification not found", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "No rows found" },
      });

      const request = new NextRequest(
        "http://localhost/api/notifications/nonexistent",
        { method: "PATCH" },
      );

      const response = await PATCH_SINGLE(request, {
        params: Promise.resolve({ id: "nonexistent" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Notification not found");
    });
  });
});
