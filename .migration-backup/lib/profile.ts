import type { UserRole } from "@/lib/types";

/**
 * Returns the nav items a given role should see in the sidebar.
 * Keeps nav config in one place and makes it unit-testable.
 */
export interface NavItem {
  label: string;
  href: string;
  /** lucide-react icon name */
  icon: string;
}

export function getNavItems(role: UserRole, hasCoach: boolean): NavItem[] {
  const userItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Sessions", href: "/sessions", icon: "Dumbbell" },
    { label: "Progress", href: "/progress", icon: "TrendingUp" },
  ];

  if (hasCoach) {
    userItems.push({ label: "Coach's Notes", href: "/coach-notes", icon: "MessageSquare" });
  }

  const coachItems: NavItem[] = [
    { label: "Clients", href: "/clients", icon: "Users" },
    { label: "Playbook", href: "/playbook", icon: "BookOpen" },
  ];

  const adminItems: NavItem[] = [
    { label: "Users", href: "/admin/users", icon: "UserCog" },
    { label: "Programs", href: "/admin/programs", icon: "ClipboardList" },
  ];

  if (role === "admin") {
    return [...userItems, ...coachItems, ...adminItems];
  }
  if (role === "coach") {
    return [...userItems, ...coachItems];
  }
  return userItems;
}

/**
 * Returns true when the user needs to complete onboarding before accessing
 * the app.  Kept pure so it can be called from both proxy.ts and layouts.
 */
export function needsOnboarding(onboarding_done: boolean): boolean {
  return !onboarding_done;
}
