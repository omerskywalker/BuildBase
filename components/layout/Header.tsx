"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { MobileNav } from "./MobileNav";
import type { UserRole } from "@/lib/types";

interface HeaderProps {
  fullName: string;
  role?: UserRole;
  hasCoach?: boolean;
}

export function Header({ fullName, role = "user", hasCoach = false }: HeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 bg-bg-surface border-b border-border-subtle px-4 h-14 flex items-center justify-between">
        {/* Left: hamburger + mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-content-secondary hover:text-content-primary hover:bg-bg-hover transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-lg font-bold font-display">
            <span className="text-brand">Build</span>
            <span className="text-accent font-bold">Base</span>
          </span>
        </div>

        {/* Spacer for desktop (sidebar takes left side) */}
        <div className="hidden lg:block" />

        {/* Right: user name + theme toggle + sign out */}
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-content-secondary max-w-[160px] truncate">
            {fullName}
          </span>

          <ThemeToggle />

          <NotificationBell />

          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border border-border-subtle text-content-secondary cursor-pointer transition-colors hover:border-border-strong hover:text-content-primary"
            >
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </header>

      <MobileNav
        role={role}
        hasCoach={hasCoach}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
  );
}
