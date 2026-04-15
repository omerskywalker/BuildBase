"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function PulsingDot({ color }: { color: string }) {
  return (
    <motion.span
      animate={{ opacity: [1, 0.25, 1], scale: [1, 1.4, 1] }}
      transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        marginRight: 5,
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    />
  );
}

export function KickoffButton({ itemId, disabled }: { itemId: string; disabled: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const router = useRouter();

  if (disabled) return null;

  async function handleStart() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/monitor/kickoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json() as { success?: boolean; prUrl?: string | null; prNumber?: number | null; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Kickoff failed");
      setPrUrl(data.prUrl ?? null);
      setState("done");
      // Refresh after short delay so KV override shows in-progress
      setTimeout(() => router.refresh(), 800);
    } catch (err) {
      console.error(err);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  if (state === "done") {
    return (
      <a
        href={prUrl ?? undefined}
        target="_blank"
        rel="noopener"
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontSize: 11, fontWeight: 700, color: "#3060A0",
          background: "rgba(48,96,160,0.1)", border: "1px solid rgba(48,96,160,0.3)",
          borderRadius: 6, padding: "3px 10px", textDecoration: "none",
          pointerEvents: prUrl ? "auto" : "none",
        }}>
        <PulsingDot color="#3060A0" />
        Started{prUrl ? " → PR" : ""}
      </a>
    );
  }

  if (state === "loading") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontSize: 11, fontWeight: 700, color: "#C84B1A",
          background: "rgba(200,75,26,0.08)", border: "1px solid rgba(200,75,26,0.25)",
          borderRadius: 6, padding: "3px 10px",
        }}>
        <PulsingDot color="#C84B1A" />
        Starting…
      </span>
    );
  }

  const isError = state === "error";
  return (
    <button
      onClick={() => void handleStart()}
      style={{
        fontSize: 11, fontWeight: 700,
        color: isError ? "#B83020" : "#C84B1A",
        background: isError ? "rgba(184,48,32,0.08)" : "rgba(200,75,26,0.08)",
        border: `1px solid ${isError ? "rgba(184,48,32,0.3)" : "rgba(200,75,26,0.25)"}`,
        borderRadius: 6, padding: "3px 10px",
        cursor: "pointer",
      }}>
      {isError ? "Failed — retry" : "▶ Start"}
    </button>
  );
}
