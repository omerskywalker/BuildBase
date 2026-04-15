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
};

interface SidebarProps {
  role: UserRole;
  hasCoach: boolean;
}

export function Sidebar({ role, hasCoach }: SidebarProps) {
  const pathname = usePathname();
  const items = getNavItems(role, hasCoach);

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 220,
        height: "100vh",
        background: "#152019",
        borderRight: "1px solid #2A3D30",
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        zIndex: 20,
      }}
      className="hidden lg:flex"
    >
      {/* Logo */}
      <div
        style={{
          padding: "0 20px 20px",
          borderBottom: "1px solid #2A3D30",
          marginBottom: 12,
        }}
      >
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "var(--font-display, sans-serif)",
            }}
          >
            <span style={{ color: "#1C3A2A" }}>Build</span>
            <span style={{ color: "#C84B1A" }}>Base</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto" }}>
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                color: isActive ? "#E8F0E8" : "#8A9E8A",
                background: isActive ? "#22332A" : "transparent",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                marginBottom: 2,
                transition: "background 0.1s, color 0.1s",
              }}
            >
              {Icon && <Icon size={16} />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #2A3D30" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#4A5A4A",
          }}
        >
          {role}
        </span>
      </div>
    </aside>
  );
}
