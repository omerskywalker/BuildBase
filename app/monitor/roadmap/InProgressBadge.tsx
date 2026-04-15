"use client";

export function InProgressBadge() {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: "#3060A0",
      background: "rgba(48,96,160,0.1)", border: "1px solid rgba(48,96,160,0.3)",
      borderRadius: 6, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: "#3060A0",
        animation: "pulse 1.5s ease-in-out infinite",
        display: "inline-block",
      }} />
      In Progress
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </span>
  );
}
