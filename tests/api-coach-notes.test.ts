import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST, GET } from "@/app/api/coach/notes/route";
import { DELETE, PATCH } from "@/app/api/coach/notes/[id]/route";

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

describe("Coach Notes API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/coach/notes", () => {
    it("should create a note successfully", async () => {
      const mockUser = { id: "coach-id" };
      const mockProfile = { role: "coach", id: "coach-id" };
      const mockTargetUser = { id: "user-id", coach_id: "coach-id" };
      const mockNote = {
        id: "note-id",
        coach_id: "coach-id",
        user_id: "user-id",
        message: "Test message",
        is_sent: true,
        sent_at: "2023-01-01T00:00:00.000Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockTargetUser, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockNote, error: null });

      const request = new NextRequest("http://localhost/api/coach/notes", {
        method: "POST",
        body: JSON.stringify({
          message: "Test message",
          userId: "user-id",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockNote);
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        coach_id: "coach-id",
        user_id: "user-id",
        message: "Test message",
        is_sent: true,
        sent_at: expect.any(String),
      });
    });

    it("should return 401 for unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new NextRequest("http://localhost/api/coach/notes", {
        method: "POST",
        body: JSON.stringify({
          message: "Test message",
          userId: "user-id",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 for missing message", async () => {
      const mockUser = { id: "coach-id" };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const request = new NextRequest("http://localhost/api/coach/notes", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-id",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Message and user ID are required");
    });

    it("should return 403 for non-coach/admin user", async () => {
      const mockUser = { id: "user-id" };
      const mockProfile = { role: "user", id: "user-id" };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });

      const request = new NextRequest("http://localhost/api/coach/notes", {
        method: "POST",
        body: JSON.stringify({
          message: "Test message",
          userId: "user-id",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Only coaches and admins can send notes");
    });

    it("should return 403 for coach sending to non-client", async () => {
      const mockUser = { id: "coach-id" };
      const mockProfile = { role: "coach", id: "coach-id" };
      const mockTargetUser = { id: "user-id", coach_id: "other-coach-id" };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockTargetUser, error: null });

      const request = new NextRequest("http://localhost/api/coach/notes", {
        method: "POST",
        body: JSON.stringify({
          message: "Test message",
          userId: "user-id",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("You can only send notes to your clients");
    });
  });

  describe("GET /api/coach/notes", () => {
    it("should fetch notes for coach", async () => {
      const mockUser = { id: "coach-id" };
      const mockProfile = { role: "coach", id: "coach-id" };
      const mockNotes = [
        {
          id: "note-1",
          coach_id: "coach-id",
          user_id: "user-id",
          message: "Test message 1",
          sent_at: "2023-01-01T00:00:00.000Z",
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });
      mockSupabase.order.mockResolvedValue({ data: mockNotes, error: null });

      const request = new NextRequest("http://localhost/api/coach/notes");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockNotes);
      expect(mockSupabase.eq).toHaveBeenCalledWith("coach_id", "coach-id");
    });

    it("should fetch notes for user", async () => {
      const mockUser = { id: "user-id" };
      const mockProfile = { role: "user", id: "user-id" };
      const mockNotes = [
        {
          id: "note-1",
          coach_id: "coach-id",
          user_id: "user-id",
          message: "Test message 1",
          sent_at: "2023-01-01T00:00:00.000Z",
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });
      mockSupabase.order.mockResolvedValue({ data: mockNotes, error: null });

      const request = new NextRequest("http://localhost/api/coach/notes");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockNotes);
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-id");
    });
  });

  describe("DELETE /api/coach/notes/[id]", () => {
    it("should unsend unread note successfully", async () => {
      const mockUser = { id: "coach-id" };
      const mockNote = {
        id: "note-id",
        coach_id: "coach-id",
        user_id: "user-id",
        read_at: null,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValue({ data: mockNote, error: null });
      // Chain: .from().select().eq("id",id).single() → mockNote (via single)
      // Then:  .from().delete().eq("id",id) → needs { error: null }
      // The 3rd .eq() call (after from→delete→eq) must resolve the delete result
      mockSupabase.eq
        .mockReturnValueOnce(mockSupabase)   // 1st eq: select chain .eq("id", id)
        .mockResolvedValueOnce({ error: null }); // 2nd eq: delete chain .eq("id", id)

      const response = await DELETE(
        new NextRequest("http://localhost"),
        { params: Promise.resolve({ id: "note-id" }) }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Note unsent successfully");
    });

    it("should return 400 for read note", async () => {
      const mockUser = { id: "coach-id" };
      const mockNote = {
        id: "note-id",
        coach_id: "coach-id",
        user_id: "user-id",
        read_at: "2023-01-01T00:00:00.000Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValue({ data: mockNote, error: null });

      const response = await DELETE(
        new NextRequest("http://localhost"),
        { params: Promise.resolve({ id: "note-id" }) }
      );

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Cannot unsend note that has been read");
    });
  });

  describe("PATCH /api/coach/notes/[id]", () => {
    it("should mark note as read", async () => {
      const mockUser = { id: "user-id" };
      const mockNote = {
        id: "note-id",
        coach_id: "coach-id",
        user_id: "user-id",
      };
      const mockUpdatedNote = {
        ...mockNote,
        read_at: "2023-01-01T00:00:00.000Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValueOnce({ data: mockNote, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockUpdatedNote, error: null });

      const request = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ action: "read" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(
        request,
        { params: Promise.resolve({ id: "note-id" }) }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUpdatedNote);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        read_at: expect.any(String),
      });
    });

    it("should return 400 for invalid action", async () => {
      const request = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ action: "invalid" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(
        request,
        { params: Promise.resolve({ id: "note-id" }) }
      );

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Action must be 'read' or 'dismiss'");
    });

    it("should return 403 for non-recipient", async () => {
      const mockUser = { id: "wrong-user-id" };
      const mockNote = {
        id: "note-id",
        coach_id: "coach-id",
        user_id: "user-id",
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValue({ data: mockNote, error: null });

      const request = new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ action: "read" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await PATCH(
        request,
        { params: Promise.resolve({ id: "note-id" }) }
      );

      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("You can only mark your own notes as read or dismissed");
    });
  });
});