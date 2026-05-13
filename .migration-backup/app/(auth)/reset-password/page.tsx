"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validatePassword, validatePasswordMatch } from "@/lib/auth-validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(password) ?? validatePasswordMatch(password, confirm);
    if (pwError) {
      setError(pwError);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/login?reset=success");
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        background: "#E8DECE",
        border: "1px solid #C8B99D",
        borderRadius: 12,
        padding: 32,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#2C1A10",
            fontFamily: "var(--font-display, sans-serif)",
            marginBottom: 4,
          }}
        >
          Set new password
        </h1>
        <p style={{ color: "#6B5A48", fontSize: 14 }}>Choose a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "#6B5A48" }}>
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            style={{
              background: "#EDE4D3",
              border: "1px solid #C8B99D",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#2C1A10",
              fontSize: 14,
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="confirm" style={{ fontSize: 13, fontWeight: 500, color: "#6B5A48" }}>
            Confirm new password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              background: "#EDE4D3",
              border: "1px solid #C8B99D",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#2C1A10",
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
              background: "#E8DECE",
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
            color: "#FEFCF8",
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
          {loading ? "Updating…" : "Update password"}
        </button>

        <Link
          href="/login"
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "#6B5A48",
            textDecoration: "none",
            marginTop: 4,
          }}
        >
          ← Back to sign in
        </Link>
      </form>
    </div>
  );
}
