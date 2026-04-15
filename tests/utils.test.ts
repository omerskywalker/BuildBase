import { describe, it, expect } from "vitest";
import { getFormBadge, getDefaultWeight, formatWeight, hoursSince } from "@/lib/utils";

describe("getFormBadge", () => {
  it("returns 'Solid Form ✅' for locked_in", () => {
    expect(getFormBadge("locked_in")).toBe("Solid Form ✅");
  });

  it("returns null for needs_cues", () => {
    expect(getFormBadge("needs_cues")).toBeNull();
  });

  it("returns null for getting_there", () => {
    expect(getFormBadge("getting_there")).toBeNull();
  });

  it("returns null for null", () => {
    expect(getFormBadge(null)).toBeNull();
  });
});

describe("getDefaultWeight", () => {
  const te = {
    is_bodyweight: false,
    weight_pre_baseline_f: 35,
    weight_pre_baseline_m: 45,
    weight_default_f: 45,
    weight_default_m: 65,
    weight_post_baseline_f: 55,
    weight_post_baseline_m: 85,
  };

  it("returns female weight for default tier", () => {
    expect(getDefaultWeight(te, "default", "female")).toBe(45);
  });

  it("returns male weight for pre_baseline tier", () => {
    expect(getDefaultWeight(te, "pre_baseline", "male")).toBe(45);
  });

  it("returns female post_baseline weight", () => {
    expect(getDefaultWeight(te, "post_baseline", "female")).toBe(55);
  });

  it("returns 0 for bodyweight exercises", () => {
    expect(getDefaultWeight({ ...te, is_bodyweight: true }, "default", "male")).toBe(0);
  });
});

describe("formatWeight", () => {
  it("returns 'BW' for weight 0", () => {
    expect(formatWeight(0)).toBe("BW");
  });

  it("returns 'BW' when isBodyweight is true", () => {
    expect(formatWeight(45, true)).toBe("BW");
  });

  it("formats normal weight with lbs", () => {
    expect(formatWeight(65)).toBe("65 lbs");
  });
});

describe("hoursSince", () => {
  it("returns Infinity for null", () => {
    expect(hoursSince(null)).toBe(Infinity);
  });

  it("returns large number for old date", () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(hoursSince(old)).toBeGreaterThan(24);
  });
});
