import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST, DELETE } from "../../app/api/admin/overrides/route";
import { createClient } from "../../lib/supabase/server";

// Mock Supabase client
vi.mock("../../lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock NextResponse
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({ 
      json: data, 
      status: options?.status || 200,
      ok: options?.status ? options.status >= 200 && options.status < 300 : true
    })),
  },
}));

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
};

describe("Overrides API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("GET /api/admin/overrides", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request("http://localhost/api/admin/overrides?user_id=123");
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(response.json).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin or coach", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "user-1" } } 
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: "user" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides?user_id=123");
      const response = await GET(request);

      expect(response.status).toBe(403);
      expect(response.json).toEqual({ error: "Forbidden" });
    });

    it("should return 400 when user_id parameter is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: "admin" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides");
      const response = await GET(request);

      expect(response.status).toBe(400);
      expect(response.json).toEqual({ error: "user_id parameter is required" });
    });

    it("should return overrides for valid admin user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: "admin" },
        error: null,
      });
      
      const mockOverrides = [
        {
          id: "override-1",
          user_id: "user-1",
          template_exercise_id: "exercise-1",
          sets_override: 4,
          reps_override: 10,
          weight_override: 25.0,
        }
      ];
      
      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockOverrides,
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides?user_id=user-1");
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.json).toEqual(mockOverrides);
    });
  });

  describe("POST /api/admin/overrides", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "POST",
        body: JSON.stringify({
          user_id: "user-1",
          template_exercise_id: "exercise-1",
          sets_override: 4,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(response.json).toEqual({ error: "Unauthorized" });
    });

    it("should return 400 when required fields are missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: "admin" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "POST",
        body: JSON.stringify({
          user_id: "user-1",
          // Missing template_exercise_id
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(response.json).toEqual({ 
        error: "user_id and template_exercise_id are required" 
      });
    });

    it("should create new override successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { role: "admin" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null, // No existing override
          error: null,
        });

      const newOverride = {
        id: "override-1",
        user_id: "user-1",
        template_exercise_id: "exercise-1",
        sets_override: 4,
        reps_override: 10,
        weight_override: 25.0,
        notes: "Test override",
        set_by: "admin-1",
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: newOverride,
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "POST",
        body: JSON.stringify({
          user_id: "user-1",
          template_exercise_id: "exercise-1",
          sets_override: 4,
          reps_override: 10,
          weight_override: 25.0,
          notes: "Test override",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.json).toEqual(newOverride);
    });

    it("should update existing override", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: { role: "admin" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "existing-override-1" }, // Existing override found
          error: null,
        });

      const updatedOverride = {
        id: "existing-override-1",
        user_id: "user-1",
        template_exercise_id: "exercise-1",
        sets_override: 5,
        reps_override: 12,
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: updatedOverride,
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "POST",
        body: JSON.stringify({
          user_id: "user-1",
          template_exercise_id: "exercise-1",
          sets_override: 5,
          reps_override: 12,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.json).toEqual(updatedOverride);
    });
  });

  describe("DELETE /api/admin/overrides", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "DELETE",
        body: JSON.stringify({ id: "override-1" }),
      });
      const response = await DELETE(request);

      expect(response.status).toBe(401);
      expect(response.json).toEqual({ error: "Unauthorized" });
    });

    it("should return 400 when id is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: "admin" },
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "DELETE",
        body: JSON.stringify({}),
      });
      const response = await DELETE(request);

      expect(response.status).toBe(400);
      expect(response.json).toEqual({ error: "Override ID is required" });
    });

    it("should delete override successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: { id: "admin-1" } } 
      });
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: "admin" },
        error: null,
      });
      mockSupabase.from().delete().eq.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new Request("http://localhost/api/admin/overrides", {
        method: "DELETE",
        body: JSON.stringify({ id: "override-1" }),
      });
      const response = await DELETE(request);

      expect(response.status).toBe(200);
      expect(response.json).toEqual({ success: true });
    });
  });
});