"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  batchNumber: number;
  itemCount: number;      // total not-started items that will be dispatched
  parallelizable: boolean;
  allDone: boolean;       // true if every item in the batch is done
}

export function BatchKickoffButton({ batchNumber, itemCount, parallelizable, allDone }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [dispatched, setDispatched] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  // Hide if not parallelizable or nothing left to do
  if (!parallelizable || allDone || itemCount === 0) return null;

  async function handleStartBatch() {
    if (state === "loading") return;
    setState("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/monitor/kickoff-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchNumber }),
      });
      const data = await res.json() as {
        success?: boolean;
        dispatched?: string[];
        failed?: Array<{ itemId: string; error: string }>;
        error?: string;
        count?: number;
      };

      if (res.status === 207) {
        // Partial success
        setDispatched(data.dispatched ?? []);
        setErrorMsg(`${data.failed?.length ?? 0} item(s) failed to dispatch`);
        setState("done");
      } else if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Batch kickoff failed");
      } else {
        setDispatched(data.dispatched ?? []);
        setState("done");
      }

      setTimeout(() => router.refresh(), 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Batch kickoff failed");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  if (state === "done") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: errorMsg ? "#C08030" : "#2D7A3A",
          background: errorMsg ? "rgba(192,128,48,0.1)" : "rgba(45,122,58,0.1)",
          border: `1px solid ${errorMsg ? "rgba(192,128,48,0.3)" : "rgba(45,122,58,0.3)"}`,
          borderRadius: 6, padding: "3px 10px",
        }}>
          {errorMsg ? `⚠ ${errorMsg}` : `✓ ${dispatched.length} agent${dispatched.length !== 1 ? "s" : ""} running`}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => void handleStartBatch()}
      disabled={state === "loading"}
      title={`Start all ${itemCount} not-started items in parallel`}
      style={{
        fontSize: 11, fontWeight: 700,
        color: state === "error" ? "#B83020" : "#2C1A10",
        background: state === "error" ? "rgba(184,48,32,0.12)" : "rgba(200,75,26,0.15)",
        border: `1px solid ${state === "error" ? "rgba(184,48,32,0.4)" : "rgba(200,75,26,0.4)"}`,
        borderRadius: 6, padding: "4px 12px",
        cursor: state === "loading" ? "not-allowed" : "pointer",
        opacity: state === "loading" ? 0.6 : 1,
        display: "flex", alignItems: "center", gap: 5,
        transition: "opacity 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {state === "loading" ? (
        <>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
          Dispatching {itemCount}…
        </>
      ) : state === "error" ? (
        `✗ ${errorMsg ?? "Failed"}`
      ) : (
        `▶▶ Start Batch (${itemCount})`
      )}
    </button>
  );
}
