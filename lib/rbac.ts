import type { UserRole } from "@/lib/types";

/**
 * Returns the minimum role required to access a given pathname, or null if
 * no special role is needed (any authenticated user may proceed).
 */
export function getRequiredRole(pathname: string): UserRole | null {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/admin/")
  ) {
    return "admin";
  }

  if (
    pathname.startsWith("/clients") ||
    pathname.startsWith("/playbook")
  ) {
    return "coach";
  }

  return null;
}

/**
 * Returns true if the given role is allowed to access a route that requires
 * `requiredRole`.  Admins can access everything.
 */
export function canAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === "admin") return true;
  if (requiredRole === "coach") return userRole === "coach";
  return false;
}

/**
 * Convenience: given a pathname and user role, returns true if the user is
 * allowed to visit the route.
 */
export function isRouteAllowed(pathname: string, userRole: UserRole): boolean {
  const required = getRequiredRole(pathname);
  if (!required) return true;
  return canAccess(userRole, required);
}
