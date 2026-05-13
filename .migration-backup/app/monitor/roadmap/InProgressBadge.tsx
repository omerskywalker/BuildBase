"use client";

import { motion } from "framer-motion";

export function InProgressBadge() {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, color: "#3060A0",
      background: "rgba(48,96,160,0.1)", border: "1px solid rgba(48,96,160,0.3)",
      borderRadius: 6, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <motion.span
        style={{
          width: 6, height: 6, borderRadius: "50%", background: "#3060A0",
          display: "inline-block", flexShrink: 0,
        }}
        animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
      />
      In Progress
    </span>
  );
}
