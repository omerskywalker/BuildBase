import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn(),
  single: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockSupabase,
}));

import { GET as programsGET, PUT as programsPUT } from "../app/api/admin/programs/route";
import { GET as programGET } from "../app/api/admin/programs/[id]/route";
import { PUT as phasePUT } from "../app/api/admin/programs/[id]/phases/route";

describe("Program Editor API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.update.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/admin/programs", () => {
    it("should return unauthorized when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const response = await programsGET();
      const data = await response.json();

      expect(data.error).toBe("Unauthorized");
      expect(response.status).toBe(401);
    });

    it("should return forbidden when user is not admin", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "user" },
        error: null,
      });

      const response = await programsGET();
      const data = await response.json();

      expect(data.error).toBe("Forbidden");
      expect(response.status).toBe(403);
    });

    it("should return programs when user is admin", async () => {
      const mockPrograms = [
        {
          id: "prog-1",
          name: "Test Program",
          description: "Test description",
          total_phases: 3,
          total_weeks: 12,
          phases: [
            { id: "phase-1", name: "Foundation", phase_number: 1 },
            { id: "phase-2", name: "Load", phase_number: 2 },
          ],
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "admin" },
        error: null,
      });
      mockSupabase.order.mockResolvedValueOnce({
        data: mockPrograms,
        error: null,
      });

      const response = await programsGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPrograms);
    });

    it("should handle database errors gracefully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "admin" },
        error: null,
      });
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const response = await programsGET();
      const data = await response.json();

      expect(data.error).toBe("Failed to fetch programs");
      expect(response.status).toBe(500);
    });
  });

  describe("PUT /api/admin/programs", () => {
    const mockRequest = (body: any) =>
      ({
        json: () => Promise.resolve(body),
      }) as Request;

    it("should update program when user is admin", async () => {
      const updateData = {
        id: "prog-1",
        name: "Updated Program",
        description: "Updated description",
        total_phases: 4,
        total_weeks: 16,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: updateData, error: null });

      const request = mockRequest(updateData);
      const response = await programsPUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updateData);
    });

    it("should return error when program ID is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "admin" },
        error: null,
      });

      const request = mockRequest({ name: "Test" });
      const response = await programsPUT(request);
      const data = await response.json();

      expect(data.error).toBe("Program ID is required");
      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/admin/programs/[id]", () => {
    const mockParams = { params: Promise.resolve({ id: "prog-1" }) };

    it("should return program with phases", async () => {
      const mockProgram = {
        id: "prog-1",
        name: "Test Program",
        phases: [
          { id: "phase-1", phase_number: 2 },
          { id: "phase-2", phase_number: 1 },
        ],
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: mockProgram, error: null });

      const response = await programGET({} as Request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.phases).toHaveLength(2);
      expect(data.phases[0].phase_number).toBe(1);
      expect(data.phases[1].phase_number).toBe(2);
    });

    it("should return 404 when program not found", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

      const response = await programGET({} as Request, mockParams);
      const data = await response.json();

      expect(data.error).toBe("Program not found");
      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/admin/programs/[id]/phases", () => {
    const mockRequest = (body: any) =>
      ({
        json: () => Promise.resolve(body),
      }) as Request;
    const mockParams = { params: Promise.resolve({ id: "prog-1" }) };

    it("should update phase successfully", async () => {
      const updateData = {
        phaseId: "phase-1",
        name: "Updated Phase",
        subtitle: "Updated subtitle",
        week_start: 1,
        week_end: 4,
        description: "Updated description",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: "admin" }, error: null })
        .mockResolvedValueOnce({ data: { id: "phase-1", ...updateData }, error: null });

      const request = mockRequest(updateData);
      const response = await phasePUT(request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("phase-1");
    });

    it("should return error when phase ID is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: "admin" },
        error: null,
      });

      const request = mockRequest({ name: "Test Phase" });
      const response = await phasePUT(request, mockParams);
      const data = await response.json();

      expect(data.error).toBe("Phase ID is required");
      expect(response.status).toBe(400);
    });
  });
});

describe("Program Editor Utilities", () => {
  describe("Week Range Validation", () => {
    const validateWeekRanges = (
      phases: Array<{ phase_number: number; week_start: number; week_end: number }>,
      totalWeeks: number
    ) => {
      const sortedPhases = phases.sort((a, b) => a.phase_number - b.phase_number);
      const errors: string[] = [];
      let expectedStart = 1;

      for (const phase of sortedPhases) {
        if (phase.week_start !== expectedStart) {
          errors.push(
            `Phase ${phase.phase_number} should start at week ${expectedStart}, not ${phase.week_start}`
          );
        }
        if (phase.week_end < phase.week_start) {
          errors.push(
            `Phase ${phase.phase_number}: end week (${phase.week_end}) cannot be before start week (${phase.week_start})`
          );
        }
        expectedStart = phase.week_end + 1;
      }

      const totalWeeksUsed = sortedPhases[sortedPhases.length - 1]?.week_end || 0;
      if (totalWeeksUsed !== totalWeeks) {
        errors.push(
          `Phase weeks (${totalWeeksUsed}) don't match program total (${totalWeeks})`
        );
      }

      return { isValid: errors.length === 0, errors };
    };

    it("should validate correct week ranges", () => {
      const phases = [
        { phase_number: 1, week_start: 1, week_end: 4 },
        { phase_number: 2, week_start: 5, week_end: 8 },
        { phase_number: 3, week_start: 9, week_end: 12 },
      ];

      const result = validateWeekRanges(phases, 12);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect gaps between phases", () => {
      const phases = [
        { phase_number: 1, week_start: 1, week_end: 4 },
        { phase_number: 2, week_start: 6, week_end: 9 },
        { phase_number: 3, week_start: 10, week_end: 12 },
      ];

      const result = validateWeekRanges(phases, 12);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Phase 2 should start at week 5, not 6"
      );
    });

    it("should detect invalid end before start", () => {
      const phases = [
        { phase_number: 1, week_start: 5, week_end: 3 },
        { phase_number: 2, week_start: 4, week_end: 8 },
      ];

      const result = validateWeekRanges(phases, 8);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Phase 1: end week (3) cannot be before start week (5)"
      );
    });

    it("should detect mismatch with total weeks", () => {
      const phases = [
        { phase_number: 1, week_start: 1, week_end: 4 },
        { phase_number: 2, week_start: 5, week_end: 8 },
      ];

      const result = validateWeekRanges(phases, 12);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Phase weeks (8) don't match program total (12)"
      );
    });

    it("should handle phases in wrong order", () => {
      const phases = [
        { phase_number: 2, week_start: 5, week_end: 8 },
        { phase_number: 1, week_start: 1, week_end: 4 },
        { phase_number: 3, week_start: 9, week_end: 12 },
      ];

      const result = validateWeekRanges(phases, 12);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle empty phases array", () => {
      const result = validateWeekRanges([], 12);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Phase weeks (0) don't match program total (12)");
    });
  });
});
