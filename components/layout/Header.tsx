"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

interface HeaderProps {
  fullName: string;
}

export function Header({ fullName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-bg-surface border-b border-border-subtle px-4 h-14 flex items-center justify-between">
      {/* Mobile logo */}
      <span className="lg:hidden text-lg font-bold font-display">
        <span className="text-brand">Build</span>
        <span className="text-accent font-bold">Base</span>
      </span>

      {/* Spacer for desktop (sidebar takes left side) */}
      <div className="hidden lg:block" />

      {/* Right: user name + sign out */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-content-secondary max-w-[160px] truncate">
          {fullName}
        </span>

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
  );
}
