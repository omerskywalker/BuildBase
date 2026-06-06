import { describe, it, expect } from "vitest";
import { getNavItems, needsOnboarding } from "@/lib/profile";

describe("getNavItems — user role", () => {
  it("includes core user nav items", () => {
    const items = getNavItems("user", false);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/sessions");
    expect(hrefs).toContain("/progress");
  });

  it("excludes coach-notes when no coach", () => {
    const items = getNavItems("user", false);
    expect(items.map((i) => i.href)).not.toContain("/coach-notes");
  });

  it("includes coach-notes when user has a coach", () => {
    const items = getNavItems("user", true);
    expect(items.map((i) => i.href)).toContain("/coach-notes");
  });

  it("includes settings for all users", () => {
    const items = getNavItems("user", false);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/settings");
  });

  it("places settings after other user items", () => {
    const items = getNavItems("user", false);
    const settingsIdx = items.findIndex((i) => i.href === "/settings");
    const progressIdx = items.findIndex((i) => i.href === "/progress");
    expect(settingsIdx).toBeGreaterThan(progressIdx);
  });

  it("excludes coach and admin items", () => {
    const items = getNavItems("user", false);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).not.toContain("/clients");
    expect(hrefs).not.toContain("/playbook");
    expect(hrefs).not.toContain("/admin/users");
  });
});

describe("getNavItems — coach role", () => {
  it("includes user + coach items", () => {
    const items = getNavItems("coach", false);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/clients");
    expect(hrefs).toContain("/playbook");
  });

  it("includes settings", () => {
    const items = getNavItems("coach", false);
    expect(items.map((i) => i.href)).toContain("/settings");
  });

  it("excludes admin items", () => {
    const items = getNavItems("coach", false);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).not.toContain("/admin/users");
    expect(hrefs).not.toContain("/admin/programs");
  });
});

describe("getNavItems — admin role", () => {
  it("includes all nav items", () => {
    const items = getNavItems("admin", false);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/clients");
    expect(hrefs).toContain("/playbook");
    expect(hrefs).toContain("/admin/users");
    expect(hrefs).toContain("/admin/programs");
    expect(hrefs).toContain("/settings");
  });
});

describe("needsOnboarding", () => {
  it("returns true when onboarding_done is false", () => {
    expect(needsOnboarding(false)).toBe(true);
  });

  it("returns false when onboarding_done is true", () => {
    expect(needsOnboarding(true)).toBe(false);
  });
});
