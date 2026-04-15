// TODO Batch 1: Header component
// - Mobile hamburger menu (opens Sidebar sheet)
// - Page title (dynamic)
// - User avatar + sign out dropdown
"use client";

export function Header() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#152019",
        borderBottom: "1px solid #2A3D30",
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
        style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-space-grotesk, sans-serif)" }}
      >
        <span style={{ color: "#1C3A2A" }}>Build</span>
        <span style={{ color: "#C84B1A" }}>Base</span>
      </span>

      {/* Right side placeholder */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2A3D30" }} />
      </div>
    </header>
  );
}
