"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

interface HeaderProps {
  fullName: string;
}

export function Header({ fullName }: HeaderProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#1E1A14",
        borderBottom: "1px solid #3A3228",
        padding: "0 16px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Mobile logo */}
      <span
        className="lg:hidden"
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "var(--font-display, sans-serif)",
        }}
      >
        <span style={{ color: "#1C3A2A" }}>Build</span>
        <span style={{ color: "#C84B1A" }}>Base</span>
      </span>

      {/* Spacer for desktop (sidebar takes left side) */}
      <div className="hidden lg:block" />

      {/* Right: user name + sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 13,
            color: "#8A9E8A",
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {fullName}
        </span>

        <form action={signOut}>
          <button
            type="submit"
            title="Sign out"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "transparent",
              border: "1px solid #3A3228",
              color: "#8A9E8A",
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </header>
  );
}
