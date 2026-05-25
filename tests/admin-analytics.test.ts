import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/analytics/route";

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  gte: vi.fn(),
  single: vi.fn(),
};

// Build a chainable mock that tracks calls
function createChainableMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    gte: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
  };

  // Each method returns the chain itself by default
  Object.values(chain).forEach((fn) => fn.mockReturnValue(chain));

  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
const mockedCreateClient = vi.mocked(createClient);

describe("Admin Analytics API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    const chain = createChainableMock();
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      from: vi.fn().mockReturnValue(chain),
    };
    mockedCreateClient.mockResolvedValue(client as any);

    const response = await GET();
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 403 if not admin role", async () => {
    const chain = createChainableMock();
    chain.single.mockResolvedValue({ data: { role: "user" }, error: null });

    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockReturnValue(chain),
    };
    mockedCreateClient.mockResolvedValue(client as any);

    const response = await GET();
    expect(response.status).toBe(403);

    const data = await response.json();
    expect(data.error).toBe("Forbidden");
  });

  it("should return 200 with expected shape for admin", async () => {
    // Track which table is being queried
    let callIndex = 0;
    const profileAdminChain = createChainableMock();
    profileAdminChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });

    const countChain = (count: number) => {
      const c = createChainableMock();
      // Override select to resolve with count
      c.select.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count, error: null }),
        gte: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count, error: null }),
        }),
      });
      // Direct resolves for methods that end the chain
      c.eq.mockResolvedValue({ count, error: null });
      c.gte.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count, error: null }),
      });
      return c;
    };

    // We need a more precise mock that handles the various query paths
    const fromMock = vi.fn();

    // Simulate: profiles(role check) -> profiles(totalAthletes) -> user_enrollments -> session_logs -> session_logs -> profiles(coaches) -> profiles(client count per coach) -> profiles(newSignups)
    const roleCheckChain = createChainableMock();
    roleCheckChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });

    // For count queries, we need select({count:"exact", head:true}) to return a chain ending in count
    const makeCountResolve = (count: number) => {
      const obj: any = {
        eq: vi.fn().mockResolvedValue({ count, error: null }),
        gte: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count, error: null }),
        }),
        in: vi.fn().mockResolvedValue({ data: [{ id: "coach-1", full_name: "Coach A", email: "coach@test.com" }], error: null }),
      };
      // gte without further eq
      obj.gte.mockResolvedValue({ count, error: null });
      return obj;
    };

    // Build a mock client where .from() returns different chains depending on call order
    let fromCallCount = 0;
    const mockClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }) },
      from: vi.fn().mockImplementation((table: string) => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // First from("profiles") -> role check
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
              }),
            }),
          };
        }
        if (fromCallCount === 2) {
          // profiles count (totalAthletes)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
            }),
          };
        }
        if (fromCallCount === 3) {
          // user_enrollments count (activeAthletes)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 7, error: null }),
            }),
          };
        }
        if (fromCallCount === 4) {
          // session_logs count (totalRecentSessions)
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 20, error: null }),
            }),
          };
        }
        if (fromCallCount === 5) {
          // session_logs count (completedRecentSessions)
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 15, error: null }),
              }),
            }),
          };
        }
        if (fromCallCount === 6) {
          // profiles (coaches list)
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: "coach-1", full_name: "Coach Alpha", email: "coach@test.com" },
                ],
                error: null,
              }),
            }),
          };
        }
        if (fromCallCount === 7) {
          // profiles count per coach (clientCount)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
            }),
          };
        }
        if (fromCallCount === 8) {
          // profiles count (newSignups)
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
            }),
          };
        }
        // fallback
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }),
    };

    mockedCreateClient.mockResolvedValue(mockClient as any);

    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("totalAthletes");
    expect(data).toHaveProperty("activeAthletes");
    expect(data).toHaveProperty("weeklyCompletionRate");
    expect(data).toHaveProperty("coachWorkload");
    expect(data).toHaveProperty("newSignups");
    expect(data).toHaveProperty("recentSessions");

    expect(typeof data.totalAthletes).toBe("number");
    expect(typeof data.activeAthletes).toBe("number");
    expect(typeof data.weeklyCompletionRate).toBe("number");
    expect(Array.isArray(data.coachWorkload)).toBe(true);
    expect(typeof data.newSignups).toBe("number");
    expect(typeof data.recentSessions).toBe("number");

    // Verify values from our mock
    expect(data.totalAthletes).toBe(10);
    expect(data.activeAthletes).toBe(7);
    expect(data.weeklyCompletionRate).toBe(75); // 15/20 * 100
    expect(data.coachWorkload).toHaveLength(1);
    expect(data.coachWorkload[0].name).toBe("Coach Alpha");
    expect(data.coachWorkload[0].clientCount).toBe(3);
    expect(data.newSignups).toBe(5);
    expect(data.recentSessions).toBe(20);
  });
});
