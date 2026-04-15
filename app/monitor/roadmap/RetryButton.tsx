"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryButton({ itemId }: { itemId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const router = useRouter();

  async function handleRetry() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/monitor/kickoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, retry: true }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "Retry failed");
      setState("done");
      setTimeout(() => { setState("idle"); router.refresh(); }, 2000);
    } catch (err) {
      console.error(err);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <button onClick={() => void handleRetry()} disabled={state === "loading"}
      style={{
        fontSize: 11, fontWeight: 700,
        color: state === "error" ? "#B83020" : "#C08030",
        background: state === "error" ? "rgba(184,48,32,0.08)" : "rgba(192,128,48,0.08)",
        border: `1px solid ${state === "error" ? "rgba(184,48,32,0.3)" : "rgba(192,128,48,0.3)"}`,
        borderRadius: 6, padding: "3px 10px",
        cursor: state === "loading" ? "not-allowed" : "pointer",
        opacity: state === "loading" ? 0.6 : 1,
      }}>
      {state === "loading" ? "Retrying…" : state === "done" ? "Retried ✓" : state === "error" ? "Failed" : "↺ Retry CI"}
    </button>
  );
}
