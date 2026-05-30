"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  MessageSquare,
  Users,
  BookOpen,
  UserCog,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { getNavItems, type NavItem } from "@/lib/profile";
import type { UserRole } from "@/lib/types";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  MessageSquare,
  Users,
  BookOpen,
  UserCog,
  ClipboardList,
  BarChart3,
};

interface SidebarProps {
  role: UserRole;
  hasCoach: boolean;
}

export function Sidebar({ role, hasCoach }: SidebarProps) {
  const pathname = usePathname();
  const items = getNavItems(role, hasCoach);

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 w-[220px] h-screen bg-bg-surface border-r border-border-subtle flex-col py-5 z-20">
      {/* Logo */}
      <div className="px-5 pb-5 border-b border-border-subtle mb-3">
        <Link href="/dashboard" className="no-underline">
          <span className="text-xl font-bold font-display">
            <span className="text-brand">Build</span>
            <span className="text-accent">Base</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {items.map((item: NavItem) => {
          const Icon = ICON_MAP[item.icon];
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline text-sm mb-0.5 transition-colors",
                isActive
                  ? "text-content-primary bg-bg-hover font-semibold"
                  : "text-content-secondary bg-transparent font-medium hover:bg-bg-hover hover:text-content-primary",
              ].join(" ")}
            >
              {Icon && <Icon size={16} />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      <div className="px-5 pt-3 border-t border-border-subtle">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-content-muted">
          {role}
        </span>
      </div>
    </aside>
  );
}
