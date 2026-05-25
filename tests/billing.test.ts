import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Stripe
vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
  },
}));

// Mock @supabase/supabase-js for webhook admin client
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: "user-123" }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

// Helper to create a mock Request
function mockRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request("http://localhost:3000/api/billing/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const { POST } = await import("@/app/api/billing/checkout/route");
    const req = mockRequest({ priceId: "price_123" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 if priceId is missing", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123", email: "test@test.com" } },
        }),
      },
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const { POST } = await import("@/app/api/billing/checkout/route");
    const req = mockRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("priceId is required");
  });
});

describe("POST /api/billing/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    const { POST } = await import("@/app/api/billing/portal/route");
    const req = mockRequest({});
    const res = await POST();

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });
});

describe("POST /api/billing/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests with invalid signature", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const { POST } = await import("@/app/api/billing/webhook/route");
    const req = new Request("http://localhost:3000/api/billing/webhook", {
      method: "POST",
      headers: { "stripe-signature": "bad_sig" },
      body: JSON.stringify({ type: "test" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid signature");
  });

  it("returns 400 if stripe-signature header is missing", async () => {
    const { POST } = await import("@/app/api/billing/webhook/route");
    const req = new Request("http://localhost:3000/api/billing/webhook", {
      method: "POST",
      body: JSON.stringify({ type: "test" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Missing stripe-signature header");
  });
});
