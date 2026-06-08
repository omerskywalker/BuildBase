import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockIn = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

function setupChain(data: unknown, error: unknown = null) {
  mockSelect.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          data,
          error,
        }),
      }),
    }),
    in: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
    }),
  });
}

describe("GET /api/sessions/export", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import("@/app/api/sessions/export/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when user has no completed sessions", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupChain([]);

    const { GET } = await import("@/app/api/sessions/export/route");
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns CSV with correct headers when sessions exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const sessions = [
      {
        id: "session-1",
        week_number: 1,
        session_number: 1,
        started_at: "2026-01-01T10:00:00Z",
        completed_at: "2026-01-01T11:00:00Z",
        is_complete: true,
        post_session_effort: 3,
        pre_session_soreness: 2,
        notes: null,
        workout_templates: { day_label: "A", title: "Upper Body" },
      },
    ];

    setupChain(sessions);

    const { GET } = await import("@/app/api/sessions/export/route");
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain(".csv");

    const body = await res.text();
    const lines = body.split("\n");
    expect(lines[0]).toBe(
      "Date,Week,Session,Day,Title,Exercise,Set,Weight (lbs),Reps,Effort,Soreness,Notes"
    );
    expect(lines.length).toBeGreaterThan(1);
  });
});
