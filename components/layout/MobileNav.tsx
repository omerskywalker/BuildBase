"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
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

interface MobileNavProps {
  role: UserRole;
  hasCoach: boolean;
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ role, hasCoach, open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const items = getNavItems(role, hasCoach);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="absolute top-0 left-0 w-[280px] h-full bg-bg-surface border-r border-border-subtle flex flex-col py-5 shadow-xl animate-in slide-in-from-left duration-200">
        {/* Header with logo + close button */}
        <div className="px-5 pb-5 border-b border-border-subtle mb-3 flex items-center justify-between">
          <Link href="/dashboard" className="no-underline" onClick={onClose}>
            <span className="text-xl font-bold font-display">
              <span className="text-brand">Build</span>
              <span className="text-accent">Base</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-content-secondary hover:text-content-primary hover:bg-bg-hover transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
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
                onClick={onClose}
                className={[
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg no-underline text-sm mb-0.5 transition-colors",
                  isActive
                    ? "text-content-primary bg-bg-hover font-semibold"
                    : "text-content-secondary bg-transparent font-medium hover:bg-bg-hover hover:text-content-primary",
                ].join(" ")}
              >
                {Icon && <Icon size={18} />}
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
    </div>
  );
}
