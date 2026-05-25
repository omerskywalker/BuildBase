import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/coach/notify-note/route";

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

// Chain helpers
function createChain(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  // For queries that don't call .single() (e.g. rate limit check)
  chain.then = undefined;
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(undefined),
}));

// We need to override createClient to return our mock
import { createClient } from "@/lib/supabase/server";
const mockedCreateClient = vi.mocked(createClient);

describe("Coach Note Email Notifications - POST /api/coach/notify-note", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase as never);
  });

  it("should return 200 with valid input and send notification", async () => {
    const mockUser = { id: "coach-id" };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

    // Rate limit check - no recent notes
    const rateLimitChain = createChain({ data: [], error: null });
    // Remove single from rate limit (it returns array)
    rateLimitChain.neq = vi.fn().mockResolvedValue({ data: [], error: null });

    // User profile lookup
    const userProfileChain = createChain({
      data: { email: "athlete@example.com", full_name: "Test Athlete" },
      error: null,
    });

    // Coach profile lookup
    const coachProfileChain = createChain({
      data: { full_name: "Coach Smith" },
      error: null,
    });

    mockSupabase.from
      .mockReturnValueOnce(rateLimitChain) // coach_notes for rate limit
      .mockReturnValueOnce(userProfileChain) // profiles for user email
      .mockReturnValueOnce(coachProfileChain); // profiles for coach name

    const request = new NextRequest("http://localhost/api/coach/notify-note", {
      method: "POST",
      body: JSON.stringify({
        noteId: "note-123",
        userId: "user-id",
        coachId: "coach-id",
        content: "Great session today!",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 400 with missing fields", async () => {
    const mockUser = { id: "coach-id" };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

    const request = new NextRequest("http://localhost/api/coach/notify-note", {
      method: "POST",
      body: JSON.stringify({
        noteId: "note-123",
        // missing userId, coachId, content
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("required");
  });

  it("should rate limit if recent note exists within the last hour", async () => {
    const mockUser = { id: "coach-id" };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

    // Rate limit check - has recent note
    const rateLimitChain = createChain(null);
    rateLimitChain.neq = vi.fn().mockResolvedValue({
      data: [{ id: "existing-note-id" }],
      error: null,
    });

    mockSupabase.from.mockReturnValueOnce(rateLimitChain);

    const request = new NextRequest("http://localhost/api/coach/notify-note", {
      method: "POST",
      body: JSON.stringify({
        noteId: "note-456",
        userId: "user-id",
        coachId: "coach-id",
        content: "Another note",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain("Rate limited");
  });

  it("should return 401 if not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest("http://localhost/api/coach/notify-note", {
      method: "POST",
      body: JSON.stringify({
        noteId: "note-789",
        userId: "user-id",
        coachId: "coach-id",
        content: "Test note",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
