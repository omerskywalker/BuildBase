import { describe, it, expect } from "vitest";
import { getNavItems } from "@/lib/profile";

describe("Coach Dashboard", () => {
  it("coach nav includes Coach Overview link", () => {
    const items = getNavItems("coach", false);
    const overview = items.find((i) => i.href === "/clients/dashboard");
    expect(overview).toBeDefined();
    expect(overview!.label).toBe("Coach Overview");
    expect(overview!.icon).toBe("BarChart3");
  });

  it("admin nav includes Coach Overview link", () => {
    const items = getNavItems("admin", false);
    const overview = items.find((i) => i.href === "/clients/dashboard");
    expect(overview).toBeDefined();
  });

  it("user nav does NOT include Coach Overview link", () => {
    const items = getNavItems("user", false);
    const overview = items.find((i) => i.href === "/clients/dashboard");
    expect(overview).toBeUndefined();
  });

  it("Coach Overview appears before Clients in nav order", () => {
    const items = getNavItems("coach", false);
    const overviewIdx = items.findIndex((i) => i.href === "/clients/dashboard");
    const clientsIdx = items.findIndex((i) => i.href === "/clients");
    expect(overviewIdx).toBeLessThan(clientsIdx);
  });
});
