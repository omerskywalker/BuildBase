import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockSupabaseClient: any = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a fluent Supabase query mock that resolves with the given result */
function buildSelectChain(result: { data: any; error: any; count?: number | null }) {
  const terminal: any = {
    ...result,
    then: (resolve: any) => resolve(result),
  };

  // Build chainable methods from the bottom up
  const makeChainable = (res: any): any => {
    const chain: any = {};
    const methods = ["select", "eq", "in", "order", "range", "single", "limit"];
    for (const m of methods) {
      chain[m] = vi.fn(() => makeChainable(res));
    }
    // When awaited, resolve with the result
    chain.then = (resolve: any) => resolve(res);
    // Allow count option on select
    return chain;
  };

  return makeChainable(result);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Session History API — GET /api/sessions/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test("returns 401 when user is not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const { GET } = await import("@/app/api/sessions/history/route");

    const request = new NextRequest(
      "http://localhost:3000/api/sessions/history"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  test("returns empty sessions array when user has no completed sessions", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    // Count query returns 0
    const countChain = buildSelectChain({ data: null, error: null, count: 0 });
    // Sessions query returns empty array
    const sessionsChain = buildSelectChain({ data: [], error: null });

    mockSupabaseClient.from
      .mockReturnValueOnce(countChain) // count query
      .mockReturnValueOnce(sessionsChain); // sessions query

    const { GET } = await import("@/app/api/sessions/history/route");

    const request = new NextRequest(
      "http://localhost:3000/api/sessions/history"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessions).toEqual([]);
    expect(data.total).toBe(0);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(20);
  });

  test("respects page and limit query parameters", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const countChain = buildSelectChain({ data: null, error: null, count: 45 });
    const sessionsChain = buildSelectChain({ data: [], error: null });

    mockSupabaseClient.from
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(sessionsChain);

    const { GET } = await import("@/app/api/sessions/history/route");

    const request = new NextRequest(
      "http://localhost:3000/api/sessions/history?page=3&limit=10"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe(3);
    expect(data.limit).toBe(10);
    expect(data.total).toBe(45);
  });

  test("clamps limit to maximum of 50", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const countChain = buildSelectChain({ data: null, error: null, count: 0 });
    const sessionsChain = buildSelectChain({ data: [], error: null });

    mockSupabaseClient.from
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(sessionsChain);

    const { GET } = await import("@/app/api/sessions/history/route");

    const request = new NextRequest(
      "http://localhost:3000/api/sessions/history?limit=200"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.limit).toBe(50);
  });

  test("defaults page to 1 when negative value provided", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const countChain = buildSelectChain({ data: null, error: null, count: 0 });
    const sessionsChain = buildSelectChain({ data: [], error: null });

    mockSupabaseClient.from
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(sessionsChain);

    const { GET } = await import("@/app/api/sessions/history/route");

    const request = new NextRequest(
      "http://localhost:3000/api/sessions/history?page=-5"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe(1);
  });

  test("returns 500 when count query fails", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const countChain = buildSelectChain({
      data: null,
      error: { message: "DB error" },
      count: null,
    });

    mockSupabaseClient.from.mockReturnValueOnce(countChain);

    const { GET } = await import("@/app/api/sessions/history/route");

    const request = new NextRequest(
      "http://localhost:3000/api/sessions/history"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch session history");
  });

  test("returns sessions with set_logs when data exists", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const countChain = buildSelectChain({ data: null, error: null, count: 1 });

    const sessionData = [
      {
        id: "session-1",
        workout_template_id: "wt-1",
        week_number: 2,
        session_number: 4,
        started_at: "2025-01-10T09:00:00Z",
        completed_at: "2025-01-10T10:00:00Z",
        is_complete: true,
        post_session_effort: 3,
        pre_session_soreness: 4,
        notes: null,
        workout_templates: {
          id: "wt-1",
          day_label: "A",
          title: "Upper Body Strength",
        },
      },
    ];
    const sessionsChain = buildSelectChain({
      data: sessionData,
      error: null,
    });

    const setLogData = [
      {
        id: "set-1",
        session_log_id: "session-1",
        set_number: 1,
        weight_used: 135,
        reps_completed: 8,
        is_completed: true,
        exercises: { id: "ex-1", name: "Bench Press" },
      },
      {
        id: "set-2",
        session_log_id: "session-1",
        set_number: 2,
        weight_used: 135,
        reps_completed: 7,
        is_completed: true,
        exercises: { id: "ex-1", name: "Bench Press" },
      },
    ];
    const setLogsChain = buildSelectChain({
      data: setLogData,
      error: null,
    });

    mockSupabaseClient.from
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(sessionsChain)
      .mockReturnValueOnce(setLogsChain);

    const { GET } = await import("@/app/api/sessions/history/route");

    const request = new NextRequest(
      "http://localhost:3000/api/sessions/history"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].id).toBe("session-1");
    expect(data.sessions[0].workout_templates.title).toBe(
      "Upper Body Strength"
    );
    expect(data.sessions[0].set_logs).toHaveLength(2);
    expect(data.sessions[0].set_logs[0].weight_used).toBe(135);
    expect(data.sessions[0].set_logs[0].exercises.name).toBe("Bench Press");
    expect(data.total).toBe(1);
  });
});

describe("Session History — Pagination Logic", () => {
  test("calculates correct offset for each page", () => {
    const limit = 20;

    const page1Offset = (1 - 1) * limit;
    expect(page1Offset).toBe(0);

    const page2Offset = (2 - 1) * limit;
    expect(page2Offset).toBe(20);

    const page3Offset = (3 - 1) * limit;
    expect(page3Offset).toBe(40);
  });

  test("calculates total pages correctly", () => {
    const limit = 20;

    expect(Math.ceil(0 / limit)).toBe(0);
    expect(Math.ceil(1 / limit)).toBe(1);
    expect(Math.ceil(20 / limit)).toBe(1);
    expect(Math.ceil(21 / limit)).toBe(2);
    expect(Math.ceil(100 / limit)).toBe(5);
  });

  test("clamps page number to valid range", () => {
    expect(Math.max(1, -1)).toBe(1);
    expect(Math.max(1, 0)).toBe(1);
    expect(Math.max(1, 1)).toBe(1);
    expect(Math.max(1, 5)).toBe(5);
  });

  test("clamps limit to valid range (1–50)", () => {
    const clampLimit = (n: number) => Math.min(50, Math.max(1, n));

    expect(clampLimit(-10)).toBe(1);
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(1)).toBe(1);
    expect(clampLimit(20)).toBe(20);
    expect(clampLimit(50)).toBe(50);
    expect(clampLimit(100)).toBe(50);
  });
});

describe("Session History — Set Log Grouping", () => {
  test("groups set logs by exercise name", () => {
    const setLogs = [
      { exercises: { id: "ex-1", name: "Bench Press" }, set_number: 1 },
      { exercises: { id: "ex-1", name: "Bench Press" }, set_number: 2 },
      { exercises: { id: "ex-2", name: "Squat" }, set_number: 1 },
    ];

    const grouped: Map<string, any[]> = new Map();
    for (const log of setLogs) {
      const key = log.exercises?.id ?? "unknown";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(log);
    }

    expect(grouped.size).toBe(2);
    expect(grouped.get("ex-1")).toHaveLength(2);
    expect(grouped.get("ex-2")).toHaveLength(1);
  });

  test("handles set logs with missing exercise data", () => {
    const setLogs = [
      { exercises: null, set_number: 1 },
      { exercises: { id: "ex-1", name: "Bench Press" }, set_number: 1 },
    ];

    const grouped: Map<string, any[]> = new Map();
    for (const log of setLogs) {
      const key = log.exercises?.id ?? "unknown";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(log);
    }

    expect(grouped.size).toBe(2);
    expect(grouped.get("unknown")).toHaveLength(1);
  });
});
