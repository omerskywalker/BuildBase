// TODO Batch 1: Sidebar component
// - Role-aware navigation (user / coach / admin menu items)
// - BuildBase logo/wordmark at top
// - Active route highlighting
// - Mobile: collapsible sheet
"use client";

export function Sidebar() {
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
      <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #2A3D30", marginBottom: 12 }}>
        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
          <span style={{ color: "#1C3A2A" }}>Build</span>
          <span style={{ color: "#C84B1A" }}>Base</span>
        </span>
      </div>

      {/* Nav items — placeholder */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        {[
          { label: "Dashboard",   href: "/dashboard" },
          { label: "Sessions",    href: "/sessions" },
          { label: "Progress",    href: "/progress" },
          { label: "Coach's Notes", href: "/coach-notes" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: "8px 12px",
              borderRadius: 8,
              color: "#8A9E8A",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
