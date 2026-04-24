"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateLoginForm } from "@/lib/auth-validation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateLoginForm(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        background: "#1C2A20",
        border: "1px solid #3A3228",
        borderRadius: 12,
        padding: 32,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#E8F0E8",
            fontFamily: "var(--font-display, sans-serif)",
            marginBottom: 4,
          }}
        >
          Sign in to{" "}
          <span style={{ color: "#1C3A2A" }}>Build</span>
          <span style={{ color: "#C84B1A", fontWeight: 700 }}>Base</span>
        </h1>
        <p style={{ color: "#8A9E8A", fontSize: 14 }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{ color: "#C84B1A", textDecoration: "none", fontWeight: 500 }}
          >
            Sign up
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            htmlFor="email"
            style={{ fontSize: 13, fontWeight: 500, color: "#8A9E8A" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              background: "#0F1A14",
              border: "1px solid #3A3228",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#E8F0E8",
              fontSize: 14,
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label
              htmlFor="password"
              style={{ fontSize: 13, fontWeight: 500, color: "#8A9E8A" }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              style={{ fontSize: 12, color: "#C84B1A", textDecoration: "none" }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              background: "#0F1A14",
              border: "1px solid #3A3228",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#E8F0E8",
              fontSize: 14,
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p
            style={{
              fontSize: 13,
              color: "#B83020",
              background: "#1C2A20",
              border: "1px solid #B83020",
              borderRadius: 6,
              padding: "8px 12px",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#8C3410" : "#C84B1A",
            color: "#E8F0E8",
            border: "none",
            borderRadius: 8,
            padding: "11px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
            marginTop: 4,
            transition: "background 0.15s",
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
