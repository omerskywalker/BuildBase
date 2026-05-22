import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetchJson, ApiError } from "@/lib/api-helpers";

describe("apiFetchJson", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on a successful response", async () => {
    const payload = { id: 1, name: "Bench Press" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(payload),
      }),
    );

    const result = await apiFetchJson<typeof payload>("/api/exercises");

    expect(result).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith("/api/exercises", undefined);
  });

  it("throws ApiError with correct status on non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ error: "Exercise not found" }),
      }),
    );

    await expect(apiFetchJson("/api/exercises/999")).rejects.toThrow(ApiError);

    try {
      await apiFetchJson("/api/exercises/999");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.statusText).toBe("Not Found");
      expect(apiErr.message).toBe("Exercise not found");
    }
  });

  it("falls back to default message when error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("not json")),
      }),
    );

    try {
      await apiFetchJson("/api/broken");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.statusText).toBe("Internal Server Error");
      expect(apiErr.message).toBe("API error 500: Internal Server Error");
    }
  });

  it("passes RequestInit options through to fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve({ success: true }),
      }),
    );

    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Squat" }),
    };

    await apiFetchJson("/api/exercises", options);

    expect(fetch).toHaveBeenCalledWith("/api/exercises", options);
  });
});
