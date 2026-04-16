import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeOnboarding } from "@/app/onboarding/actions";

describe("onboarding", () => {
  describe("completeOnboarding", () => {
    let mockEq: ReturnType<typeof vi.fn>;
    let mockUpdate: ReturnType<typeof vi.fn>;
    let mockGetUser: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.clearAllMocks();

      mockEq = vi.fn().mockResolvedValue({ error: null });
      mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockGetUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: { getUser: mockGetUser },
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      } as any);

      vi.mocked(redirect).mockImplementation((url: string) => {
        throw new Error(`REDIRECT:${url}`);
      });
    });

    it("should complete onboarding with valid data", async () => {
      await expect(
        completeOnboarding({ full_name: "John Doe", gender: "male", template_tier: "default" })
      ).rejects.toThrow("REDIRECT:/dashboard");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: "John Doe", onboarding_done: true })
      );
    });

    it("should trim whitespace from full name", async () => {
      await expect(
        completeOnboarding({ full_name: "  John  ", gender: "male", template_tier: "default" })
      ).rejects.toThrow("REDIRECT:/dashboard");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: "John" })
      );
    });

    it("should throw error for empty full name", async () => {
      await expect(
        completeOnboarding({ full_name: "", gender: "male", template_tier: "default" })
      ).rejects.toThrow("Full name is required");
    });

    it("should throw error for whitespace-only full name", async () => {
      await expect(
        completeOnboarding({ full_name: "   ", gender: "male", template_tier: "default" })
      ).rejects.toThrow("Full name is required");
    });

    it("should throw error for invalid gender", async () => {
      await expect(
        completeOnboarding({ full_name: "John", gender: "invalid", template_tier: "default" })
      ).rejects.toThrow("Invalid gender");
    });

    it("should throw error for invalid template tier", async () => {
      await expect(
        completeOnboarding({ full_name: "John", gender: "male", template_tier: "invalid" })
      ).rejects.toThrow("Invalid template tier");
    });

    it("should handle all valid gender options", async () => {
      for (const gender of ["male", "female", "other", "unset"]) {
        await expect(
          completeOnboarding({ full_name: "John", gender, template_tier: "default" })
        ).rejects.toThrow("REDIRECT:/dashboard");
      }
    });

    it("should handle all valid template tiers", async () => {
      for (const tier of ["pre_baseline", "default", "post_baseline"]) {
        await expect(
          completeOnboarding({ full_name: "John", gender: "male", template_tier: tier })
        ).rejects.toThrow("REDIRECT:/dashboard");
      }
    });

    it("should redirect to login if no user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      await expect(
        completeOnboarding({ full_name: "John", gender: "male", template_tier: "default" })
      ).rejects.toThrow("REDIRECT:/login");
    });

    it("should handle database errors", async () => {
      mockEq.mockResolvedValue({ error: { message: "Database error" } });
      await expect(
        completeOnboarding({ full_name: "John", gender: "male", template_tier: "default" })
      ).rejects.toThrow("Database error");
    });

    it("should redirect to dashboard on success", async () => {
      await expect(
        completeOnboarding({ full_name: "John", gender: "male", template_tier: "default" })
      ).rejects.toThrow("REDIRECT:/dashboard");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });
  });
});
