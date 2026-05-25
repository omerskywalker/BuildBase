import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PUT, DELETE } from "@/app/api/coach/playbook/route";

// Stable mock object — mutated in beforeEach to reset mock state
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  order: vi.fn(),
};

// All chainable methods return mockSupabase; terminal methods (.single, .order) return promises
function resetChains() {
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  // single and order are NOT chained — they resolve promises
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

describe("Playbook API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChains();
  });

  // ─── GET ──────────────────────────────────────────────────────────────────

  describe("GET /api/coach/playbook", () => {
    it("should return all entries for authenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "coach-id" } } });
      const mockEntries = [
        { id: "e1", title: "Squat Guide", content: "Content...", category: "Movement", coach_id: "coach-id" },
      ];
      mockSupabase.order.mockResolvedValue({ data: mockEntries, error: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockEntries);
      expect(mockSupabase.from).toHaveBeenCalledWith("playbook_entries");
    });

    it("should return 401 for unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 500 on database error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "coach-id" } } });
      mockSupabase.order.mockResolvedValue({ data: null, error: { message: "DB error" } });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch playbook entries");
    });
  });

  // ─── POST ─────────────────────────────────────────────────────────────────

  describe("POST /api/coach/playbook", () => {
    it("should create entry for coach", async () => {
      const mockEntry = {
        id: "new-id", title: "New Guide", content: "Guide content",
        category: "Programming", coach_id: "coach-id",
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "coach-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "coach" }, error: null })
        .mockResolvedValueOnce({ data: mockEntry, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "POST",
        body: JSON.stringify({ title: "New Guide", content: "Guide content", category: "Programming" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockEntry);
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        title: "New Guide",
        content: "Guide content",
        category: "Programming",
        coach_id: "coach-id",
      });
    });

    it("should create entry for admin", async () => {
      const mockEntry = { id: "new-id", title: "Admin Guide", content: "Content", category: null, coach_id: "admin-id" };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: mockEntry, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "POST",
        body: JSON.stringify({ title: "Admin Guide", content: "Content" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it("should return 400 for missing title", async () => {
      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "POST",
        body: JSON.stringify({ content: "Some content" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 400 for missing content", async () => {
      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "POST",
        body: JSON.stringify({ title: "A Title" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should return 401 for unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "POST",
        body: JSON.stringify({ title: "Title", content: "Content" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 403 for regular user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-id" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "user" }, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "POST",
        body: JSON.stringify({ title: "Title", content: "Content" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Only coaches and admins can create playbook entries");
    });
  });

  // ─── PUT ──────────────────────────────────────────────────────────────────

  describe("PUT /api/coach/playbook", () => {
    const VALID_UUID = "00000000-0000-0000-0000-000000000001";

    it("should update own entry for coach", async () => {
      const mockUpdated = { id: VALID_UUID, title: "Updated Title", content: "Old content", coach_id: "coach-id" };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "coach-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "coach" }, error: null })
        .mockResolvedValueOnce({ data: { coach_id: "coach-id" }, error: null })
        .mockResolvedValueOnce({ data: mockUpdated, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "PUT",
        body: JSON.stringify({ id: VALID_UUID, title: "Updated Title" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdated);
    });

    it("should allow admin to update any entry", async () => {
      const mockUpdated = { id: VALID_UUID, title: "Admin Updated", content: "Content", coach_id: "other-id" };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: { coach_id: "other-id" }, error: null })
        .mockResolvedValueOnce({ data: mockUpdated, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "PUT",
        body: JSON.stringify({ id: VALID_UUID, title: "Admin Updated" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);
    });

    it("should return 403 when coach tries to edit another coach's entry", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "coach-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "coach" }, error: null })
        .mockResolvedValueOnce({ data: { coach_id: "other-coach-id" }, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "PUT",
        body: JSON.stringify({ id: VALID_UUID, title: "Sneaky" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("You can only edit your own playbook entries");
    });

    it("should return 404 when entry doesn't exist", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "coach-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "coach" }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "PUT",
        body: JSON.stringify({ id: VALID_UUID, title: "Ghost" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid UUID", async () => {
      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "PUT",
        body: JSON.stringify({ id: "not-a-uuid", title: "Bad" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);
    });

    it("should return 401 for unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "PUT",
        body: JSON.stringify({ id: VALID_UUID, title: "Title" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PUT(request);
      expect(response.status).toBe(401);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  describe("DELETE /api/coach/playbook", () => {
    it("should delete own entry for coach", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "coach-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "coach" }, error: null })
        .mockResolvedValueOnce({ data: { coach_id: "coach-id" }, error: null });
      // eq is called 3 times: profile.eq, entry.eq, delete.eq
      // First two chain (return mockSupabase), third resolves as terminal
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)   // profile chain
        .mockReturnValueOnce(mockSupabase)   // entry lookup chain
        .mockResolvedValueOnce({ error: null }); // delete terminal

      const request = new NextRequest("http://localhost/api/coach/playbook?id=entry-id", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Playbook entry deleted");
    });

    it("should allow admin to delete any entry", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: { coach_id: "other-id" }, error: null });
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook?id=entry-id", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      expect(response.status).toBe(200);
    });

    it("should return 400 for missing ID", async () => {
      const request = new NextRequest("http://localhost/api/coach/playbook", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Entry ID is required");
    });

    it("should return 401 for unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new NextRequest("http://localhost/api/coach/playbook?id=entry-id", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      expect(response.status).toBe(401);
    });

    it("should return 403 for regular user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-id" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "user" }, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook?id=entry-id", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Only coaches and admins can delete playbook entries");
    });

    it("should return 403 when coach tries to delete another coach's entry", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "coach-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "coach" }, error: null })
        .mockResolvedValueOnce({ data: { coach_id: "other-coach-id" }, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook?id=entry-id", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("You can only delete your own playbook entries");
    });

    it("should return 404 when entry doesn't exist", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "coach-id" } } });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "coach" }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      const request = new NextRequest("http://localhost/api/coach/playbook?id=entry-id", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      expect(response.status).toBe(404);
    });
  });
});
