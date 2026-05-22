import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/admin/enroll/route";

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/admin/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_USER_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const VALID_PROGRAM_ID = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

describe("POST /api/admin/enroll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
  });

  it("should return 401 if not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(makeRequest({ userId: VALID_USER_ID, programId: VALID_PROGRAM_ID }));
    expect(response.status).toBe(401);
  });

  it("should return 403 if user is not admin", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "user" }, error: null });

    const response = await POST(makeRequest({ userId: VALID_USER_ID, programId: VALID_PROGRAM_ID }));
    expect(response.status).toBe(403);
  });

  it("should return 400 if userId is missing", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null });

    const response = await POST(makeRequest({ programId: VALID_PROGRAM_ID }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input");
  });

  it("should return 400 if programId is missing", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null });

    const response = await POST(makeRequest({ userId: VALID_USER_ID }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input");
  });

  it("should return 400 if userId is not a valid UUID", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin" }, error: null });

    const response = await POST(makeRequest({ userId: "not-a-uuid", programId: VALID_PROGRAM_ID }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input");
  });

  it("should enroll user successfully", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    // 1st single: admin role check
    mockSupabase.single
      .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
      // 2nd single: target user profile
      .mockResolvedValueOnce({ data: { template_tier: "default", gender: "male" }, error: null })
      // 3rd single: inserted enrollment
      .mockResolvedValueOnce({
        data: {
          id: "enroll-1",
          user_id: VALID_USER_ID,
          program_id: VALID_PROGRAM_ID,
          is_active: true,
          template_tier: "default",
          gender_applied: "male",
        },
        error: null,
      });

    // Deactivate step: .update().eq().eq() — the second eq resolves
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase) // .eq("id", user.id) for profile select
      .mockReturnValueOnce(mockSupabase) // .eq("id", userId) for target profile select
      .mockReturnValueOnce(mockSupabase) // .eq("user_id", userId) for deactivate
      .mockResolvedValueOnce({ error: null }); // .eq("is_active", true) for deactivate — resolves

    const response = await POST(makeRequest({ userId: VALID_USER_ID, programId: VALID_PROGRAM_ID }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe("enroll-1");
    expect(data.is_active).toBe(true);
    expect(data.user_id).toBe(VALID_USER_ID);
    expect(data.program_id).toBe(VALID_PROGRAM_ID);
  });
});
