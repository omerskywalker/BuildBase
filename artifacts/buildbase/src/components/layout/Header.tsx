import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";

interface HeaderProps {
  fullName: string;
}

export function Header({ fullName }: HeaderProps) {
  const { signOut } = useAuth();
  const [, navigate] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 10, background: "#E5DAC8",
        borderBottom: "1px solid #C8B99D", padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}
    >
      <span
        className="lg:hidden"
        style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display, sans-serif)" }}
      >
        <span style={{ color: "#1C3A2A" }}>Build</span>
        <span style={{ color: "#C84B1A" }}>Base</span>
      </span>
      <div className="hidden lg:block" />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#6B5A48", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fullName}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 8, background: "transparent",
            border: "1px solid #C8B99D", color: "#6B5A48", cursor: "pointer",
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
