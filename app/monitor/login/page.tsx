"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/monitor/roadmap";
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/monitor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError("Incorrect PIN");
        setLoading(false);
        return;
      }
      router.push(from);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div style={{ marginBottom: 16 }}>
        <input
          type="password"
          inputMode="numeric"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "#EDE4D3",
            border: `1px solid ${error ? "#B83020" : "#C8B99D"}`,
            borderRadius: 8,
            color: "#2C1A10",
            fontSize: 16,
            outline: "none",
            boxSizing: "border-box",
          }}
          autoFocus
        />
        {error && <p style={{ color: "#B83020", fontSize: 13, marginTop: 6 }}>{error}</p>}
      </div>
      <button
        type="submit"
        disabled={loading || !pin}
        style={{
          width: "100%",
          padding: "10px 0",
          background: "#C84B1A",
          color: "#FEFCF8",
          border: "none",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 700,
          cursor: loading || !pin ? "not-allowed" : "pointer",
          opacity: loading || !pin ? 0.6 : 1,
        }}
      >
        {loading ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}

export default function MonitorLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center" style={{ background: "#EDE4D3" }}>
      <div style={{ width: "100%", maxWidth: 320, background: "#E8DECE", border: "1px solid #C8B99D", borderRadius: 12, padding: 28 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#2C1A10", fontFamily: "var(--font-space-grotesk)", marginBottom: 4 }}>
          <span style={{ color: "#1C3A2A" }}>Build</span><span style={{ color: "#C84B1A" }}>Base</span>
          <span style={{ color: "#988A78", fontWeight: 400, fontSize: 14 }}> Monitor</span>
        </h1>
        <p style={{ color: "#988A78", fontSize: 13, marginBottom: 20 }}>Enter PIN to access roadmap.</p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
