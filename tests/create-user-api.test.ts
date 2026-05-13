import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/users/create/route";

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

const mockAdminClient = {
  auth: {
    admin: {
      createUser: vi.fn(),
    },
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mockAdminClient,
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/admin/users/create", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/admin/users/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockAdminClient.from.mockReturnThis();
    mockAdminClient.select.mockReturnThis();
    mockAdminClient.update.mockReturnThis();
    mockAdminClient.eq.mockReturnThis();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  });

  it("should return 401 if not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(makeRequest({ email: "a@b.com", password: "123456" }));
    expect(response.status).toBe(401);
  });

  it("should return 403 if user is not admin", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.single.mockResolvedValue({ data: { role: "user" }, error: null });

    const response = await POST(makeRequest({ email: "a@b.com", password: "123456" }));
    expect(response.status).toBe(403);
  });

  it("should return 400 if email is missing", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.single.mockResolvedValue({ data: { role: "admin" }, error: null });

    const response = await POST(makeRequest({ password: "123456" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Email and password are required");
  });

  it("should return 400 if password is too short", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.single.mockResolvedValue({ data: { role: "admin" }, error: null });

    const response = await POST(makeRequest({ email: "a@b.com", password: "123" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Password must be at least 6 characters");
  });

  it("should return 400 for invalid role", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.single.mockResolvedValue({ data: { role: "admin" }, error: null });

    const response = await POST(makeRequest({ email: "a@b.com", password: "123456", role: "superadmin" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid role");
  });

  it("should return 400 for invalid gender", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.single.mockResolvedValue({ data: { role: "admin" }, error: null });

    const response = await POST(makeRequest({ email: "a@b.com", password: "123456", gender: "xyz" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid gender");
  });

  it("should return 400 for invalid template tier", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.single.mockResolvedValue({ data: { role: "admin" }, error: null });

    const response = await POST(makeRequest({ email: "a@b.com", password: "123456", template_tier: "mega" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid template tier");
  });

  it("should return 409 if email already exists", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    mockSupabase.single.mockResolvedValue({ data: { role: "admin" }, error: null });
    mockAdminClient.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: "User already been registered" },
    });

    const response = await POST(makeRequest({ email: "existing@b.com", password: "123456" }));
    expect(response.status).toBe(409);
  });

  it("should create user successfully", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockSupabase.single.mockResolvedValue({ data: { role: "admin" }, error: null });
    mockAdminClient.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: "new-user-1" } },
      error: null,
    });
    mockAdminClient.eq.mockResolvedValueOnce({ error: null });
    mockAdminClient.single.mockResolvedValue({
      data: { id: "new-user-1", email: "new@test.com", role: "user" },
      error: null,
    });

    const response = await POST(
      makeRequest({
        email: "new@test.com",
        password: "secure123",
        full_name: "New User",
        gender: "male",
        role: "user",
        template_tier: "default",
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe("new-user-1");
  });

  it("should create coach with assignment", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    mockSupabase.single.mockResolvedValue({ data: { role: "admin" }, error: null });
    mockAdminClient.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: "coach-new" } },
      error: null,
    });
    mockAdminClient.eq.mockResolvedValueOnce({ error: null });
    mockAdminClient.single.mockResolvedValue({
      data: { id: "coach-new", email: "coach@test.com", role: "coach" },
      error: null,
    });

    const response = await POST(
      makeRequest({
        email: "coach@test.com",
        password: "secure123",
        full_name: "Coach Name",
        role: "coach",
        gender: "female",
        template_tier: "post_baseline",
      })
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user.role).toBe("coach");
  });
});
