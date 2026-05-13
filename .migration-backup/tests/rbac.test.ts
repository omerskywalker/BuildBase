import { describe, it, expect } from "vitest";
import { getRequiredRole, canAccess, isRouteAllowed } from "@/lib/rbac";

describe("getRequiredRole", () => {
  it("returns null for /dashboard", () => {
    expect(getRequiredRole("/dashboard")).toBeNull();
  });

  it("returns null for /sessions", () => {
    expect(getRequiredRole("/sessions")).toBeNull();
  });

  it("returns null for /progress", () => {
    expect(getRequiredRole("/progress")).toBeNull();
  });

  it("returns null for /coach-notes", () => {
    expect(getRequiredRole("/coach-notes")).toBeNull();
  });

  it("returns 'coach' for /clients", () => {
    expect(getRequiredRole("/clients")).toBe("coach");
  });

  it("returns 'coach' for /clients/some-id", () => {
    expect(getRequiredRole("/clients/abc-123")).toBe("coach");
  });

  it("returns 'coach' for /playbook", () => {
    expect(getRequiredRole("/playbook")).toBe("coach");
  });

  it("returns 'admin' for /admin", () => {
    expect(getRequiredRole("/admin")).toBe("admin");
  });

  it("returns 'admin' for /admin/users", () => {
    expect(getRequiredRole("/admin/users")).toBe("admin");
  });

  it("returns 'admin' for /admin/programs", () => {
    expect(getRequiredRole("/admin/programs")).toBe("admin");
  });
});

describe("canAccess", () => {
  it("admin can access admin routes", () => {
    expect(canAccess("admin", "admin")).toBe(true);
  });

  it("admin can access coach routes", () => {
    expect(canAccess("admin", "coach")).toBe(true);
  });

  it("coach can access coach routes", () => {
    expect(canAccess("coach", "coach")).toBe(true);
  });

  it("coach cannot access admin routes", () => {
    expect(canAccess("coach", "admin")).toBe(false);
  });

  it("user cannot access coach routes", () => {
    expect(canAccess("user", "coach")).toBe(false);
  });

  it("user cannot access admin routes", () => {
    expect(canAccess("user", "admin")).toBe(false);
  });
});

describe("isRouteAllowed", () => {
  it("allows user on /dashboard", () => {
    expect(isRouteAllowed("/dashboard", "user")).toBe(true);
  });

  it("allows user on /sessions", () => {
    expect(isRouteAllowed("/sessions", "user")).toBe(true);
  });

  it("blocks user on /clients", () => {
    expect(isRouteAllowed("/clients", "user")).toBe(false);
  });

  it("blocks user on /admin/users", () => {
    expect(isRouteAllowed("/admin/users", "user")).toBe(false);
  });

  it("allows coach on /clients", () => {
    expect(isRouteAllowed("/clients", "coach")).toBe(true);
  });

  it("allows coach on /playbook", () => {
    expect(isRouteAllowed("/playbook", "coach")).toBe(true);
  });

  it("blocks coach on /admin/users", () => {
    expect(isRouteAllowed("/admin/users", "coach")).toBe(false);
  });

  it("allows admin on /admin/users", () => {
    expect(isRouteAllowed("/admin/users", "admin")).toBe(true);
  });

  it("allows admin on /clients", () => {
    expect(isRouteAllowed("/clients", "admin")).toBe(true);
  });

  it("allows admin on /dashboard", () => {
    expect(isRouteAllowed("/dashboard", "admin")).toBe(true);
  });
});
